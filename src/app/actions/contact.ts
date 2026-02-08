'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitContactForm(prevState: any, formData: FormData) {
  // ✅ CORRECTION : On attend la création du client (await)
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const subject = formData.get('subject') as string
  const message = formData.get('message') as string

  if (!name || !email || !subject || !message) {
    return { success: false, message: 'Veuillez remplir tous les champs.' }
  }

  try {
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        subject,
        message,
      })

    if (error) {
        console.error('Erreur Supabase:', error)
        return { success: false, message: "Une erreur est survenue lors de l'envoi." }
    }

    revalidatePath('/contact')
    return { success: true, message: 'Message envoyé avec succès !' }
    
  } catch (error) {
    return { success: false, message: "Erreur serveur." }
  }
}