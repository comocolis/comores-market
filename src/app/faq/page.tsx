'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Données FAQ (Textes validés)
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
    question: "Comment se passe le paiement ?",
    answer: "Comores Market est une plateforme de mise en relation. Le paiement se fait généralement en espèces (Main à la main) lors de la rencontre avec le vendeur. Ne jamais envoyer d'argent à l'avance sans voir l'objet."
  },
  {
    question: "Comment booster mon annonce ?",
    answer: "Une fois votre annonce en ligne, allez dans 'Mes Annonces' et cliquez sur l'icône de fusée. Le boost place votre article en tête de liste pendant 24 heures."
  },
  {
    question: "Proposez-vous la livraison ?",
    answer: "L'application ne gère pas la livraison. C'est à vous de convenir d'un lieu de rendez-vous avec le vendeur (Place publique, Moroni, Mutsamudu, etc.) pour récupérer l'article."
  },
  {
    question: "Que faire si le vendeur ne répond pas ?",
    answer: "Si un vendeur est inactif, essayez de le contacter via WhatsApp s'il a renseigné son numéro (bouton vert). Sinon, passez à une autre annonce plus récente."
  },
  {
    question: "L'application est-elle sur iPhone ?",
    answer: "Oui, Comores Market est une PWA (Web App). Sur iPhone, ouvrez Safari, appuyez sur le bouton 'Partager' (carré avec flèche) et choisissez 'Sur l'écran d'accueil'."
  },
  {
    question: "Comment signaler une fraude ?",
    answer: "Sur chaque page d'annonce, cliquez sur le drapeau rouge en haut à droite. Notre équipe modère le contenu 24h/24 pour votre sécurité."
  },
  {
    question: "Puis-je modifier mon annonce ?",
    answer: "Bien sûr. Allez dans l'onglet 'Mes Annonces', sélectionnez l'article et cliquez sur le stylo pour éditer le prix, la description ou les photos."
  },
  {
    question: "Comment changer ma photo de profil ?",
    answer: "Allez dans l'onglet 'Compte', activez le mode 'Modifier' en haut à droite, puis cliquez sur votre photo actuelle pour en télécharger une nouvelle."
  },
  {
    question: "J'ai oublié mon mot de passe",
    answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Vous recevrez un lien par email pour le réinitialiser en toute sécurité."
  },
  {
    question: "Comment supprimer mon compte ?",
    answer: "Rendez-vous dans l'onglet 'Compte', descendez tout en bas dans la 'Zone Critique' et suivez la procédure de suppression définitive."
  }
]

export default function FAQPage() {
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-sans text-gray-900 flex flex-col">
      
      {/* HEADER STICKY : La solution au conflit.
          Il reste dans le flux (sous la bannière) et se colle en haut au scroll. 
      */}
      <div className="sticky top-0 z-40 w-full bg-[#F8FAFC]/90 backdrop-blur-xl p-4 pt-safe border-b border-gray-100 flex items-center gap-4 transition-all">
        <button 
          onClick={() => router.back()} 
          className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-90 transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
          <HelpCircle size={20} className="text-brand" /> Aide & FAQ
        </h1>
      </div>

      {/* CONTENU : Padding normal (plus besoin de compensation pt-24) */}
      <div className="flex-1 px-5 pt-6 w-full space-y-4">
        {faqData.map((item, i) => (
          <div key={i} className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-200">
            <button 
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex justify-between items-center p-5 text-left active:bg-gray-50 transition cursor-pointer"
            >
              <span className={`text-sm font-black pr-4 ${openIndex === i ? 'text-brand' : 'text-gray-800'}`}>
                {item.question}
              </span>
              {openIndex === i ? <ChevronUp size={18} className="text-brand shrink-0" /> : <ChevronDown size={18} className="text-gray-300 group-hover:text-gray-500 shrink-0" />}
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

        {/* SECTION SUPPORT */}
        <div className="mt-8 p-6 bg-brand/5 rounded-[2rem] text-center border border-brand/10 mb-8">
          <p className="text-xs font-black text-brand mb-3">Une autre question ?</p>
          <a 
            href="mailto:contact.comoresmarket@gmail.com" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-xs font-black text-gray-700 active:scale-95 transition hover:border-brand/30 hover:text-brand cursor-pointer"
          >
            <Mail size={14} />
            Contacter le support
          </a>
        </div>
      </div>
    </div>
  )
}