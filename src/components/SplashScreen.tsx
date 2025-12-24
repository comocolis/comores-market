'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [animationStep, setAnimationStep] = useState(0) // 0: Start, 1: Logo Up, 2: Fade Out

  useEffect(() => {
    // Étape 1 : Le logo apparaît (déjà géré par le rendu initial)
    
    // Étape 2 : Petit rebond ou effet visuel après 500ms
    const timer1 = setTimeout(() => setAnimationStep(1), 500)

    // Étape 3 : Disparition (Fade out) après 2 secondes
    const timer2 = setTimeout(() => setAnimationStep(2), 2000)

    // Étape 4 : Suppression du DOM après 2.5 secondes
    const timer3 = setTimeout(() => setIsVisible(false), 2500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        animationStep === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#16a34a' }} // Vert Comores Market
    >
      <div 
        className={`transition-transform duration-700 ease-out flex flex-col items-center ${
          animationStep >= 1 ? 'scale-110' : 'scale-50 opacity-0'
        } ${animationStep === 0 ? 'translate-y-10' : 'translate-y-0 opacity-100'}`}
      >
        {/* VOTRE LOGO */}
        <div className="relative w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-4 overflow-hidden p-2">
             <Image 
               src="/android-chrome-192x192.png" // Assurez-vous que le chemin est bon
               alt="Logo" 
               width={100} 
               height={100} 
               className="object-contain"
             />
        </div>
        
        {/* TEXTE ANIMÉ */}
        <h1 className="text-white font-extrabold text-2xl tracking-tight">
          Comores<span className="text-yellow-400">Market</span>
        </h1>
        
        {/* CHARGEMENT */}
        <div className="mt-8 flex gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}