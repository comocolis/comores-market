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
  console.log("--- TENTATIVE D'ENVOI EMAIL ---")
  console.log("1. Receiver ID:", receiverId)

  try {
    const supabase = await createClient()

    // 1. Récupérer l'email du destinataire
    const { data: receiver, error: dbError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', receiverId)
      .single()

    if (dbError) {
        console.error("ERREUR DB (Récupération profil):", dbError)
        return { success: false }
    }

    if (!receiver || !receiver.email) {
      console.error("ERREUR : Email introuvable ou vide pour cet utilisateur dans la table profiles.")
      console.log("Données trouvées :", receiver)
      return { success: false }
    }

    console.log("2. Email trouvé :", receiver.email)
    console.log("3. Envoi via Resend...")

    // 2. Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Comores Market <onboarding@resend.dev>',
      to: [receiver.email], // Doit être ton email perso si tu es en mode test Resend !
      subject: `Nouveau message de ${senderName}`,
      html: `<strong>${senderName}</strong> vous a envoyé : "${messageContent}"`
    })

    if (error) {
      console.error("ERREUR RESEND :", error)
      return { success: false, error }
    }

    console.log("4. SUCCÈS RESEND :", data)
    return { success: true, data }

  } catch (err) {
    console.error("ERREUR CRITIQUE SERVEUR :", err)
    return { success: false }
  }
}