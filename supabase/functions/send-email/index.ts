
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { fullName, email, phone, island, city } = await req.json()
    const resend = new Resend(resendApiKey)

    await resend.emails.send({
      from: 'Comores Market <onboarding@resend.dev>',
      to: ['abdesisco1@gmail.com'],
      subject: `🚀 Nouvel inscrit : ${fullName}`,
      html: `
        <div style="font-family: sans-serif; color: #111827;">
          <h2 style="color: #d97706;">Un nouvel utilisateur a rejoint l'aventure !</h2>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
          <ul style="line-height: 1.6;">
            <li><strong>Nom :</strong> ${fullName}</li>
            <li><strong>Email :</strong> ${email}</li>
            <li><strong>Téléphone :</strong> ${phone}</li>
            <li><strong>Localisation :</strong> ${city}, ${island}</li>
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
