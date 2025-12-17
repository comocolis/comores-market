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

    // 1. Récupérer l'email du destinataire via la table profiles
    // (On suppose que la colonne 'email' est remplie dans profiles)
    const { data: receiver } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', receiverId)
      .single()

    if (!receiver || !receiver.email) {
      console.error("Email destinataire introuvable pour ID:", receiverId)
      return { success: false }
    }

    // 2. Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Comores Market <onboarding@resend.dev>', // Utilise le domaine par défaut de Resend pour tester
      to: [receiver.email], // L'email du destinataire
      subject: `Nouveau message de ${senderName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #16a34a; margin: 0;">Comores<span style="color: #fbbf24;">Market</span></h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; color: #374151;">Bonjour <strong>${receiver.full_name || 'Utilisateur'}</strong>,</p>
            <p style="font-size: 16px; color: #374151;">Vous avez reçu un nouveau message concernant une annonce.</p>
            
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <p style="margin: 0; font-weight: bold; color: #111827; font-size: 14px;">${senderName} a écrit :</p>
              <p style="margin: 8px 0 0 0; color: #4b5563; font-style: italic;">"${messageContent}"</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://comores-market.com/messages" style="background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Répondre maintenant
              </a>
            </div>
          </div>
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            Si le bouton ne fonctionne pas, copiez ce lien : https://comores-market.com/messages
          </p>
        </div>
      `
    })

    if (error) {
      console.error("Erreur Resend:", error)
      return { success: false, error }
    }

    return { success: true, data }

  } catch (err) {
    console.error("Erreur serveur email:", err)
    return { success: false }
  }
}