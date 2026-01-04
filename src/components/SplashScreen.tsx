'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image' 

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Durée totale de l'animation
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
          // CORRECTION ICI : On centre et on limite la largeur pour imiter le mobile sur PC
          className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[9999] flex flex-col items-center justify-center bg-white shadow-2xl"
        >
          
          <div className="relative flex flex-col items-center justify-center">
            
            {/* CONTENEUR LOGO ANIMÉ */}
            <motion.div
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.05, 1], // Effet de respiration
                filter: [
                  "drop-shadow(0px 0px 0px rgba(0,0,0,0))",
                  "drop-shadow(0px 10px 20px rgba(0,0,0,0.15))", // Ombre douce
                  "drop-shadow(0px 0px 0px rgba(0,0,0,0))"
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.2 
              }}
              className="relative w-32 h-32 mb-6"
            >
               <Image 
                 src="/logo.png" 
                 alt="Logo Comores Market" 
                 fill 
                 className="object-contain" 
                 priority 
               />
            </motion.div>

            {/* LE TEXTE ANIMÉ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="text-center space-y-4"
            >
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Comores<span className="text-[#22c55e]">Market</span>
              </h1>

              {/* BARRE DE CHARGEMENT */}
              <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-auto relative">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                  className="absolute inset-0 bg-[#22c55e] rounded-full"
                />
              </div>
              
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] pt-2">
                Chargement...
              </p>
            </motion.div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}