'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Le splashscreen reste visible 2.5 secondes
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 z-9999 flex flex-col items-center justify-center bg-white shadow-2xl overflow-hidden"
        >
          
          {/* --- CENTRE : LOGO ET TITRE --- */}
          <div className="relative flex flex-col items-center justify-center -mt-12">
            
            {/* LOGO ANIMÉ */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                filter: [
                  "drop-shadow(0px 0px 0px rgba(0,0,0,0))",
                  "drop-shadow(0px 10px 30px rgba(34, 197, 94, 0.15))", // Ombre verte légère
                  "drop-shadow(0px 0px 0px rgba(0,0,0,0))"
                ]
              }}
              transition={{ 
                duration: 2, 
                ease: "easeOut"
              }}
              className="relative w-36 h-36 mb-8"
            >
               <Image 
                 src="/logo.png" 
                 alt="Comores Market" 
                 fill 
                 className="object-contain" 
                 priority 
               />
            </motion.div>

            {/* TITRE APP */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-6"
            >
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
                Comores<span className="text-[#22c55e]">Market</span>
              </h1>

              {/* BARRE DE CHARGEMENT */}
              <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mx-auto relative">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.5, ease: "circOut", delay: 0.1 }}
                  className="absolute inset-0 bg-mustard rounded-full" 
                />
              </div>
            </motion.div>
          </div>

          {/* --- SLOGAN EN BAS (FIXE & JAUNE #fbbf24) --- */}
          {/* Plus d'animation de mouvement (y), position statique */}
          <div className="absolute bottom-16 left-0 w-full text-center px-8 z-10">
             <p className="text-[10px] font-bold tracking-[0.3em] text-gray-200 uppercase mb-3">
                Bienvenue sur
             </p>
             
             {/* Slogan Fixe avec la couleur demandée */}
             <p className="text-sm font-bold text-mustard tracking-wide leading-relaxed font-sans italic">
                "Le marché comorien en ligne,<br/>pour les Comoriens."
             </p>
          </div>

          {/* DÉCORATION BAS DE PAGE */}
          <div className="absolute bottom-0 w-full h-1.5 bg-linear-to-r from-transparent via-mustard/30 to-transparent" />

        </motion.div>
      )}
    </AnimatePresence>
  )
}