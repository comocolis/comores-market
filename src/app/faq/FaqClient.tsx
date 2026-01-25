'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
// AJOUT : Import du tracking
import { trackEvent } from '@/lib/analytics'

// Données de la FAQ
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

export default function FaqClient() {
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const CONTACT_EMAIL = "contact.comoresmarket@gmail.com"

  // Fonction pour gérer l'ouverture et le tracking
  const handleToggle = (index: number) => {
    if (openIndex === index) {
        setOpenIndex(null)
    } else {
        setOpenIndex(index)
        // 📊 TRACKING : Savoir quelle question intéresse le plus l'utilisateur
        trackEvent('faq_question_opened', {
            question_index: index,
            question_title: faqData[index].question
        })
    }
  }

  const handleContactClick = () => {
      // 📊 TRACKING : Savoir que quelqu'un cherche de l'aide
      trackEvent('contact_support_click', {
          source: 'faq_page'
      })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans pb-24">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8 pt-safe">
        <button 
          onClick={() => router.back()} 
          className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition"
        >
            <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Aide & FAQ</h1>
      </div>

      <div className="space-y-4">
        {/* LISTE DES QUESTIONS */}
        {faqData.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button 
              onClick={() => handleToggle(i)}
              className="w-full flex justify-between items-center p-5 text-left active:bg-gray-50 transition"
            >
              <span className={`text-sm font-bold pr-4 ${openIndex === i ? 'text-brand' : 'text-gray-800'}`}>
                {item.question}
              </span>
              {openIndex === i ? <ChevronUp size={18} className="text-brand shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
            </button>
            
            <AnimatePresence>
              {openIndex === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-50 mt-2">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* SECTION CONTACT */}
        <section className="bg-white p-6 rounded-2xl shadow-sm mt-8 border border-gray-100 text-center">
            <h2 className="text-gray-900 font-bold mb-2">Une autre question ?</h2>
            <p className="text-sm text-gray-500 mb-4">Notre équipe est là pour vous aider.</p>
            <a 
                href={`mailto:${CONTACT_EMAIL}`}
                onClick={handleContactClick}
                className="flex items-center gap-2 text-brand font-bold bg-brand/5 p-3 rounded-xl hover:bg-brand/10 transition justify-center text-sm"
            >
                <Mail size={18} /> Contacter le support
            </a>
        </section>

        <div className="pt-8 text-xs text-center text-gray-400">
            © 2025 Comores Market. Tous droits réservés.
        </div>
      </div>
    </div>
  )
}