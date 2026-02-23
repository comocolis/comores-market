'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Si l'utilisateur est déjà venu récemment ou autre logique, on pourrait 
    // masquer immédiatement. Pour l'instant on garde le timer.
    const timer = setTimeout(() => {
      setShow(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white"
        >
          <div className="relative flex flex-col items-center justify-center -mt-12">
            <div className="relative w-36 h-36 mb-8">
              <Image 
                src="/logo.png" 
                alt="Comores Market" 
                fill
                className="object-contain" 
                priority
              />
            </div>
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
                Comores<span className="text-[#22c55e]">Market</span>
              </h1>
              <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mx-auto relative">
                <div className="absolute inset-0 bg-yellow-500 rounded-full w-full animate-pulse" /> 
              </div>
            </div>
          </div>
          <div className="absolute bottom-16 left-0 w-full text-center px-8 z-10">
             <p className="text-[10px] font-bold tracking-[0.3em] text-gray-200 uppercase mb-3">
                Bienvenue sur
             </p>
             <p className="text-sm font-bold text-yellow-500 tracking-wide leading-relaxed font-sans italic">
                &quot;Le marché comorien en ligne,<br/>pour les Comoriens.&quot;
             </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}