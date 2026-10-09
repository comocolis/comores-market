'use client'

import { useState, useRef } from 'react'
import { submitContactForm } from '@/app/actions/contact'
import { Send, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { UiButton, UiInput, UiSelect, UiTextarea } from '@/components/ui'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const clientAction = async (formData: FormData) => {
    setIsSubmitting(true)
    const result = await submitContactForm(null, formData)
    setIsSubmitting(false)

    if (result?.success) {
      setIsSuccess(true)
      toast.success("Message envoyé !")
      formRef.current?.reset()
    } else {
      toast.error(result?.message || "Erreur")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-brand py-12 px-6 text-center rounded-b-[2.5rem] shadow-sm">
        <h1 className="text-3xl font-extrabold text-white mb-2">Contactez-nous</h1>
        <p className="text-white/80 max-w-md mx-auto">
          Une question ? Un problème technique ? Une demande de suppression de données ?
          Nous sommes là pour vous aider.
        </p>
      </div>

      <div className="flex-1 px-6 -mt-8 pb-24">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-8">
          
          {isSuccess ? (
            <div className="text-center py-12 animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Message reçu !</h2>
              <p className="text-gray-500 mb-8">
                Merci de nous avoir contactés. Notre équipe va traiter votre demande dans les plus brefs délais.
              </p>
              <UiButton onClick={() => setIsSuccess(false)}>Envoyer un autre message</UiButton>
            </div>
          ) : (
            <form ref={formRef} action={clientAction} className="space-y-5">
              <UiInput
                label="Votre nom"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Ali Soilihi"
                startAdornment={<User size={20} aria-hidden="true" />}
              />

              <UiInput
                label="Votre email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="exemple@email.com"
                startAdornment={<Mail size={20} aria-hidden="true" />}
              />

              <UiSelect
                label="Sujet de la demande"
                name="subject"
                required
                defaultValue=""
                startAdornment={<AlertCircle size={20} aria-hidden="true" />}
              >
                <option value="" disabled>Choisissez un sujet...</option>
                <option value="support">Support technique</option>
                <option value="bug">Signaler un bug</option>
                <option value="partnership">Partenariat / Pro</option>
                <option value="data_deletion">Suppression de compte / Données</option>
                <option value="other">Autre</option>
              </UiSelect>

              <UiTextarea
                label="Votre message"
                name="message"
                required
                rows={5}
                placeholder="Dites-nous comment nous pouvons vous aider..."
              />

              <UiButton type="submit" size="lg" loading={isSubmitting} className="w-full">
                {isSubmitting ? 'Envoi en cours...' : <>Envoyer le message <Send size={18} aria-hidden="true" /></>}
              </UiButton>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <Link href="/" className="text-sm text-gray-600 font-medium hover:text-brand-700 transition">
                ← Retour à l&apos;accueil
             </Link>
          </div>

        </div>
      </div>
    </div>
  )
}