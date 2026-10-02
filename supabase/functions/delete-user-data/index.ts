import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const jsonResponse = (body: Record<string, string>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

function secretsMatch(expected: string, supplied: string) {
  const encoder = new TextEncoder()
  const expectedBytes = encoder.encode(expected)
  const suppliedBytes = encoder.encode(supplied)
  if (expectedBytes.length !== suppliedBytes.length) return false

  let difference = 0
  for (let index = 0; index < expectedBytes.length; index++) {
    difference |= expectedBytes[index] ^ suppliedBytes[index]
  }
  return difference === 0
}

async function removeUserFiles(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  userId: string,
) {
  const pageSize = 100
  const filePaths: string[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(userId, { limit: pageSize, offset })

    if (error) throw new Error(`Unable to list ${bucket} files`)

    const files = data ?? []
    filePaths.push(...files.filter(file => file.id).map(file => `${userId}/${file.name}`))

    if (files.length < pageSize) break
    offset += files.length
  }

  for (let index = 0; index < filePaths.length; index += pageSize) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths.slice(index, index + pageSize))

    if (error) throw new Error(`Unable to remove ${bucket} files`)
  }

  return filePaths.length
}

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const webhookSecret = Deno.env.get("DELETE_USER_DATA_WEBHOOK_SECRET")
  if (!webhookSecret) {
    console.error("DELETE_USER_DATA_WEBHOOK_SECRET is not configured")
    return jsonResponse({ error: "Webhook not configured" }, 500)
  }

  const suppliedSecret = req.headers.get("x-webhook-secret") ?? ""
  if (!secretsMatch(webhookSecret, suppliedSecret)) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  try {
    const payload = await req.json()
    const userId = payload?.old_record?.id

    if (typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return jsonResponse({ error: "Invalid user_id" }, 400)
    }

    console.log(`Starting storage cleanup for user ${userId}`)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase service credentials are not configured")
      return jsonResponse({ error: "Storage cleanup is not configured" }, 500)
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const avatarCount = await removeUserFiles(supabase, "avatars", userId)
    const potentialAvatars = [`${userId}.jpg`, `${userId}.png`, `${userId}.jpeg`, `${userId}.webp`]
    const { error: legacyAvatarError } = await supabase.storage.from("avatars").remove(potentialAvatars)
    if (legacyAvatarError) throw new Error("Unable to remove legacy avatar files")

    const [productCount, messageImageCount] = await Promise.all([
      removeUserFiles(supabase, "products", userId),
      removeUserFiles(supabase, "messages_images", userId),
    ])

    console.log(
      `Removed ${avatarCount} avatar, ${productCount} product and ${messageImageCount} message files for ${userId}`,
    )

    return jsonResponse({ message: "Storage cleanup completed" }, 200)

  } catch (error) {
    console.error("Storage cleanup failed:", error)
    return jsonResponse({ error: "Storage cleanup failed" }, 500)
  }
})