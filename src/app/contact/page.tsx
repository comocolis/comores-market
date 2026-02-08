'use client'

import { useState, useRef } from 'react'
import { submitContactForm } from '@/app/actions/contact'
import { Loader2, Send, Mail, User, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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
              <button 
                onClick={() => setIsSuccess(false)}
                className="bg-brand text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-brand-dark transition"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form ref={formRef} action={clientAction} className="space-y-5">
              
              {/* Nom */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Votre Nom</label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand transition" size={20} />
                  <input 
                    name="name" 
                    type="text" 
                    required 
                    aria-label="Votre nom complet"
                    placeholder="Ali Soilihi"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition" 
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Votre Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand transition" size={20} />
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    aria-label="Votre adresse email"
                    placeholder="exemple@email.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition" 
                  />
                </div>
              </div>

              {/* Sujet */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Sujet de la demande</label>
                <div className="relative group">
                  <AlertCircle className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand transition" size={20} />
                  {/* ✅ CORRECTION : Ajout de aria-label pour l'accessibilité */}
                  <select 
                    name="subject" 
                    required
                    aria-label="Choisir le sujet de la demande"
                    defaultValue=""
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Choisissez un sujet...</option>
                    <option value="support">Support technique</option>
                    <option value="bug">Signaler un bug</option>
                    <option value="partnership">Partenariat / Pro</option>
                    <option value="data_deletion">❌ Suppression de compte / Données</option>
                    <option value="other">Autre</option>
                  </select>
                  <div className="absolute right-4 top-4 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Votre Message</label>
                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand transition" size={20} />
                  <textarea 
                    name="message" 
                    required 
                    aria-label="Votre message"
                    rows={5}
                    placeholder="Dites-nous comment nous pouvons vous aider..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" /> Envoi en cours...
                  </>
                ) : (
                  <>
                    Envoyer le message <Send size={18} />
                  </>
                )}
              </button>

            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <Link href="/" className="text-sm text-gray-500 font-medium hover:text-brand transition">
                ← Retour à l'accueil
             </Link>
          </div>

        </div>
      </div>
    </div>
  )
}