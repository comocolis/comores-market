'use client'

import { Check, Crown, ShieldCheck, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProPage() {
  
  const benefits = [
    "Badge 'Vendeur Vérifié' sur votre profil",
    "Vos annonces remontent en tête de liste",
    "Jusqu'à 10 photos par annonce (au lieu de 3)",
    "Lien WhatsApp direct sur vos annonces",
    "Statistiques de vues détaillées",
    "Support prioritaire 7j/7"
  ]

  // Liens WhatsApp pré-remplis
  const whatsappLinkMonth = "https://wa.me/2693376132?text=Bonjour,%20je%20souhaite%20prendre%20l'abonnement%20PRO%20Mensuel%20(2500%20KMF)."
  const whatsappLinkYear = "https://wa.me/2693376132?text=Bonjour,%20je%20souhaite%20prendre%20l'abonnement%20PRO%20ANNUEL%20(25000%20KMF)."

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      
      {/* Header Héroïque */}
      <div className="bg-gray-900 text-white pt-12 pb-16 px-6 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full mb-6 border border-white/10 backdrop-blur-md">
            <Crown size={16} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Devenez l'Élite</span>
          </div>
          <h1 className="text-3xl font-black mb-4 leading-tight">
            Vendez plus vite.<br />
            <span className="text-brand">Vendez mieux.</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Rejoignez le club des meilleurs vendeurs des Comores et débloquez des outils exclusifs.
          </p>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-6">
        
        {/* CARTE 1 : MENSUEL */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-black text-xl text-gray-900">Mensuel</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Engagement libre</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-2xl">
              <Zap size={24} className="text-gray-900" fill="currentColor" />
            </div>
          </div>
          
          <div className="mb-6">
            <span className="text-3xl font-black text-gray-900">2 500</span>
            <span className="text-sm font-bold text-gray-400 ml-1">KMF / mois</span>
          </div>

          <a 
            href={whatsappLinkMonth}
            target="_blank"
            className="block w-full py-4 bg-gray-100 text-gray-900 font-black text-center rounded-2xl mb-6 hover:bg-gray-200 transition active:scale-95"
          >
            Choisir Mensuel
          </a>

          <ul className="space-y-3">
            {benefits.slice(0, 3).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                <Check size={18} className="text-brand shrink-0 mt-0.5" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CARTE 2 : ANNUEL (MISE EN AVANT) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 p-6 rounded-[2rem] shadow-2xl shadow-gray-900/30 border-2 border-amber-400 relative overflow-hidden"
        >
          {/* Badge Promo */}
          <div className="absolute top-0 right-0 bg-amber-400 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-bl-2xl uppercase tracking-wider">
            2 mois offerts
          </div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-black text-xl text-white flex items-center gap-2">
                Annuel <Crown size={18} className="text-amber-400 fill-amber-400" />
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Le choix malin</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black text-white">25 000</span>
               <span className="text-sm font-bold text-gray-400">KMF / an</span>
            </div>
            <p className="text-[10px] text-amber-400 font-bold mt-1">Économisez 5 000 KMF</p>
          </div>

          <a 
            href={whatsappLinkYear}
            target="_blank"
            className="block w-full py-4 bg-brand text-white font-black text-center rounded-2xl mb-6 hover:bg-green-600 transition shadow-lg shadow-green-500/30 active:scale-95 uppercase tracking-widest text-xs"
          >
            Choisir Annuel
          </a>

          <ul className="space-y-3">
            {benefits.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300 font-medium">
                <Check size={18} className="text-brand shrink-0 mt-0.5" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Note de bas de page */}
        <div className="text-center px-4 pt-4">
            <p className="text-xs text-gray-400 leading-relaxed">
                Le paiement s'effectue via Holo ou MVola. L'activation est manuelle et se fait généralement en moins de 15 minutes après validation.
            </p>
            <div className="flex justify-center gap-2 mt-4 opacity-50 grayscale">
                <ShieldCheck size={24} />
            </div>
        </div>

      </div>
    </div>
  )
}