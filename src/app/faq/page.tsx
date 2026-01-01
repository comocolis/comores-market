'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Données de la FAQ (Mises à jour)
const faqData = [
  {
    question: "Comment devenir vendeur Pro ?",
    answer: "Pour obtenir le badge 'Expert Pro' et débloquer les réseaux sociaux, rendez-vous dans votre espace Compte et cliquez sur 'Devenir Pro'. L'abonnement vous offre une visibilité maximale."
  },
  {
    question: "Est-ce gratuit de publier ?",
    answer: "Oui ! La publication d'annonces classiques est 100% gratuite pour les particuliers. Nous prenons 0% de commission sur vos ventes."
  },
  {
    question: "Comment booster mon annonce ?",
    answer: "Une fois votre annonce en ligne, allez dans 'Mes Annonces' et cliquez sur l'icône de fusée. Le boost place votre article en tête de liste pendant 24 heures."
  },
  {
    question: "Comment signaler une fraude ?",
    answer: "Sur chaque page d'annonce, cliquez sur le drapeau rouge en haut à droite. Notre équipe modère le contenu 24h/24 pour votre sécurité."
  },
  {
    question: "Puis-je modifier mon annonce ?",
    answer: "Bien sûr. Allez dans l'onglet 'Mes Annonces', sélectionnez l'article et cliquez sur le stylo pour éditer le prix, la description ou les photos."
  }
]

export default function FAQPage() {
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-sans text-gray-900">
      
      {/* HEADER FIXE (Optimisé pour ne pas bouger) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/90 backdrop-blur-xl p-4 pt-safe z-[100] flex items-center gap-4 shadow-sm border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition active:scale-90">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
          <HelpCircle size={20} className="text-brand" /> Aide & FAQ
        </h1>
      </div>

      {/* CONTENU (Padding ajusté pour éviter que le header ne cache le texte) */}
      <div className="pt-28 px-5 max-w-[480px] mx-auto space-y-4">
        {faqData.map((item, i) => (
          <div key={i} className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden group">
            <button 
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex justify-between items-center p-5 text-left active:bg-gray-50 transition"
            >
              <span className={`text-sm font-black ${openIndex === i ? 'text-brand' : 'text-gray-800'}`}>
                {item.question}
              </span>
              {openIndex === i ? <ChevronUp size={18} className="text-brand" /> : <ChevronDown size={18} className="text-gray-300 group-hover:text-gray-500" />}
            </button>
            
            <AnimatePresence>
              {openIndex === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0 text-xs text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* SECTION SUPPORT CORRIGÉE */}
        <div className="mt-8 p-6 bg-brand/5 rounded-[2rem] text-center border border-brand/10 mb-8">
          <p className="text-xs font-black text-brand mb-3">Une autre question ?</p>
          <a 
            href="mailto:contact.comoresmarket@gmail.com" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-xs font-black text-gray-700 active:scale-95 transition hover:border-brand/30 hover:text-brand"
          >
            <Mail size={14} />
            Contacter le support
          </a>
        </div>
      </div>
    </div>
  )
}