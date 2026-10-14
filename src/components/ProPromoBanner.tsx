'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Sparkles, X, ArrowRight, Gift } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProPromoBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fermé la bannière
    const isDismissed = localStorage.getItem('cm_pro_promo_dismissed')
    if (!isDismissed) {
      // Léger délai d'apparition pour un effet d'animation fluide
      const timer = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem('cm_pro_promo_dismissed', 'true')
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-4 my-3 overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-0.5 shadow-xl shadow-amber-500/20"
        >
          <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 px-4 py-3.5 text-white">
            {/* Halos de lumière animés en arrière-plan */}
            <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-2xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-orange-500/20 blur-2xl" />

            <div className="relative flex items-center gap-3">
              {/* Icône Cadeau animée */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 shadow-md">
                <Gift size={22} className="animate-bounce" />
                <Sparkles size={12} className="absolute -top-1 -right-1 text-amber-200 fill-amber-200 animate-pulse" />
              </div>

              {/* Texte promotionnel */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                    <Crown size={10} className="fill-amber-300" /> Offre de Bienvenue
                  </span>
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-tight">
                  1 AN PRO OFFERT pour tout nouvel inscrit ! 🎁
                </h3>
                <p className="text-[10px] text-slate-300 font-medium leading-tight mt-0.5 line-clamp-1">
                  Profitez de tous les avantages Vendeur Élite gratuitement pendant 12 mois.
                </p>
              </div>

              {/* Bouton Fermer */}
              <button
                onClick={handleDismiss}
                aria-label="Fermer la bannière"
                className="absolute top-0 right-0 p-1 text-slate-400 hover:text-white transition active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* Bouton d'action CTA */}
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
              <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                <Sparkles size={11} /> Durée limitée
              </span>
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
              >
                J'en profite <ArrowRight size={12} strokeWidth={3} />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
