'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // L'écran reste affiché 2.5 secondes
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#16a34a]"
        >
          <div className="flex flex-col items-center">
            
            {/* LOGO ANIMÉ (Effet Rebond) */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20, 
                duration: 1.5 
              }}
              className="relative w-36 h-36 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center p-4 mb-6 overflow-hidden"
            >
              {/* On utilise l'image que je vois dans votre Explorer */}
              <Image 
                src="/android-chrome-192x192.png" 
                alt="Logo" 
                width={120} 
                height={120} 
                className="object-contain"
                priority
              />
            </motion.div>

            {/* TEXTE (Glissement vers le haut) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-white font-extrabold text-3xl tracking-tight mb-1">
                Comores<span className="text-yellow-400">Market</span>
              </h1>
              <p className="text-white/80 text-xs font-medium tracking-widest uppercase">
                Chargement...
              </p>
            </motion.div>

            {/* BARRE DE CHARGEMENT */}
            <motion.div 
                className="mt-8 h-1 bg-white/20 w-32 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <motion.div 
                    className="h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}