
import { createClient } from '@/utils/supabase/client'
// import { revalidatePath } from 'next/cache' // Not supported client-side

export async function submitContactForm(prevState: any, formData: FormData) {
  // Client-side Supabase client
  const supabase = createClient()

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

    // revalidatePath('/contact')
    return { success: true, message: 'Message envoyé avec succès !' }
    
  } catch (error) {
    return { success: false, message: "Erreur serveur." }
  }
}