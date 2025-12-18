'use server'

import { Resend } from 'resend'
import { createClient } from '@/utils/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNewMessageEmail(
  receiverId: string, 
  senderName: string, 
  messageContent: string,
  productId: string
) {
  try {
    const supabase = await createClient()

    // 1. Récupérer l'email du destinataire dans la base de données
    const { data: receiver, error: dbError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', receiverId)
      .single()

    if (dbError || !receiver || !receiver.email) {
      console.error("❌ Erreur : Email destinataire introuvable pour ID:", receiverId)
      return { success: false, error: "Email introuvable" }
    }

    // 2. Préparer l'adresse d'expédition
    // ⚠️ TANT QUE LE DOMAINE N'EST PAS VÉRIFIÉ SUR RESEND : Utilise 'onboarding@resend.dev'
    // ✅ UNE FOIS LE DOMAINE VÉRIFIÉ : Remplace par 'notifications@comores-market.com'
    const FROM_EMAIL = 'Comores Market <onboarding@resend.dev>' 
    
    // 3. Envoyer l'email
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [receiver.email], 
      subject: `Nouveau message de ${senderName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouveau message</title>
        </head>
        <body style="font-family: Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <div style="background-color: #16a34a; padding: 30px; text-align: center;">
              <h1 style="color: white; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                Comores<span style="color: #fbbf24;">Market</span>
              </h1>
            </div>

            <div style="padding: 30px; color: #374151;">
              <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>${receiver.full_name || 'Utilisateur'}</strong>,</p>
              
              <p style="font-size: 16px; margin-bottom: 24px;">
                Vous avez reçu un nouveau message concernant votre annonce.
              </p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; border-left: 4px solid #16a34a; margin-bottom: 30px;">
                <p style="margin: 0; font-weight: bold; color: #111827; font-size: 14px; margin-bottom: 8px;">
                  ${senderName} a écrit :
                </p>
                <p style="margin: 0; color: #4b5563; font-style: italic; font-size: 16px; line-height: 1.5;">
                  "${messageContent}"
                </p>
              </div>

              <div style="text-align: center; margin-bottom: 20px;">
                <a href="https://comores-market.com/messages" 
                   style="background-color: #16a34a; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(22, 163, 74, 0.2);">
                  Répondre maintenant
                </a>
              </div>
              
              <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
                Si le lien ne fonctionne pas, rendez-vous sur : comores-market.com/messages
              </p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} Comores Market. Tous droits réservés.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error("❌ Erreur Resend:", error)
      return { success: false, error }
    }

    console.log("✅ Email envoyé avec succès !", data)
    return { success: true, data }

  } catch (err) {
    console.error("❌ Erreur Critique Serveur:", err)
    return { success: false }
  }
}