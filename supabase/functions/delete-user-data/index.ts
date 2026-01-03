import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // 1. Récupération des infos envoyées par le Webhook
    const payload = await req.json()
    
    // On récupère l'ID de l'utilisateur supprimé (old_record)
    const user_id = payload.old_record?.id

    if (!user_id) {
      console.error("❌ Pas d'ID utilisateur trouvé dans le payload")
      return new Response(JSON.stringify({ error: "No user_id provided" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      })
    }

    console.log(`🗑️ DÉBUT NETTOYAGE pour l'utilisateur : ${user_id}`)

    // 2. Connexion "Super Admin" à Supabase
    // Ces variables sont injectées automatiquement par Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // ---------------------------------------------------------
    // 3. NETTOYAGE DES AVATARS
    // ---------------------------------------------------------
    // On suppose que l'avatar est stocké sous un chemin contenant l'ID user
    // ou qu'il faut chercher dans le dossier racine du bucket avatars.
    
    // Méthode A : Si chaque user a son dossier
    const { data: avatarFiles } = await supabase
      .storage
      .from('avatars')
      .list(user_id) // Liste le contenu du dossier "user_id"

    if (avatarFiles && avatarFiles.length > 0) {
      const filesToRemove = avatarFiles.map((x) => `${user_id}/${x.name}`)
      const { error: errDel } = await supabase.storage.from('avatars').remove(filesToRemove)
      if (!errDel) console.log(`✅ ${filesToRemove.length} fichiers supprimés dans avatars/${user_id}`)
    }
    
    // Méthode B : Si l'avatar est à la racine (ex: "user_id.jpg")
    // On tente de supprimer les extensions courantes
    const potentialAvatars = [`${user_id}.jpg`, `${user_id}.png`, `${user_id}.jpeg`, `${user_id}.webp`]
    await supabase.storage.from('avatars').remove(potentialAvatars)


    // ---------------------------------------------------------
    // 4. NETTOYAGE DES IMAGES PRODUITS
    // ---------------------------------------------------------
    const BUCKET_PRODUITS = 'products' // <--- VÉRIFIEZ CE NOM !

    // On liste le dossier de l'utilisateur dans le bucket produits
    const { data: productFiles, error: listError } = await supabase
      .storage
      .from(BUCKET_PRODUITS)
      .list(user_id)

    if (listError) {
        console.error("Erreur liste produits:", listError)
    } else if (productFiles && productFiles.length > 0) {
       // Suppression des fichiers trouvés
       const filesToRemove = productFiles.map((x) => `${user_id}/${x.name}`)
       const { error: delError } = await supabase.storage.from(BUCKET_PRODUITS).remove(filesToRemove)
       
       if (delError) console.error("Erreur suppression produits:", delError)
       else console.log(`✅ ${filesToRemove.length} images produits supprimées pour ${user_id}`)
    } else {
        console.log("ℹ️ Aucune image produit trouvée ou dossier vide.")
    }

    return new Response(JSON.stringify({ message: "Nettoyage terminé avec succès" }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })

  } catch (error) {
    console.error("🔥 ERREUR CRITIQUE:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    })
  }
})