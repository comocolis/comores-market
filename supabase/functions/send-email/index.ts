
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]!)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
    const island = typeof body?.island === 'string' ? body.island.trim() : ''
    const city = typeof body?.city === 'string' ? body.city.trim() : ''

    if (
      !fullName || fullName.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      !phone || phone.length > 40 ||
      !island || island.length > 80 ||
      !city || city.length > 120
    ) {
      return new Response(JSON.stringify({ error: 'Invalid signup details' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resend = new Resend(resendApiKey)
    const safeFullName = escapeHtml(fullName)
    const safeEmail = escapeHtml(email)
    const safePhone = escapeHtml(phone)
    const safeIsland = escapeHtml(island)
    const safeCity = escapeHtml(city)

    await resend.emails.send({
      from: 'Comores Market <onboarding@resend.dev>',
      to: ['abdesisco1@gmail.com'],
      subject: `🚀 Nouvel inscrit : ${fullName.replace(/[\r\n]/g, ' ')}`,
      html: `
        <div style="font-family: sans-serif; color: #111827;">
          <h2 style="color: #d97706;">Un nouvel utilisateur a rejoint l'aventure !</h2>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
          <ul style="line-height: 1.6;">
            <li><strong>Nom :</strong> ${safeFullName}</li>
            <li><strong>Email :</strong> ${safeEmail}</li>
            <li><strong>Téléphone :</strong> ${safePhone}</li>
            <li><strong>Localisation :</strong> ${safeCity}, ${safeIsland}</li>
          </ul>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Notification automatique sent by Comores Market System.
          </p>
        </div>
      `,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
