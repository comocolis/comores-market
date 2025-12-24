// src/components/SplashScreen.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Temps d'affichage total : 2.2 secondes
    const timer = setTimeout(() => setIsVisible(false), 2200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ 
            y: '-100%', // Rideau qui monte
            transition: { duration: 0.8, ease: [0.45, 0, 0.55, 1] } 
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#16a34a]"
        >
          <div className="flex flex-col items-center">
            {/* LOGO : Apparition "Spring" minimale */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center p-5 mb-6"
            >
              <Image 
                src="/android-chrome-192x192.png" 
                alt="Logo" 
                width={100} 
                height={100} 
                className="object-contain"
                priority
              />
            </motion.div>

            {/* NOM : Minimaliste */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-white font-bold text-3xl tracking-tight">
                Comores<span className="text-yellow-400">Market</span>
              </h1>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}