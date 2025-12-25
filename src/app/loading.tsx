'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] bg-[#1A4D2E] flex flex-col items-center justify-center overflow-hidden">
      
      {/* --- EFFET DE TEXTURE EN ARRIÈRE-PLAN --- */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
      
      {/* --- LOGO CENTRAL ANIMÉ --- */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.16, 1, 0.3, 1] // Bézier luxe (très fluide)
          }}
          className="relative"
        >
          {/* Badge Lumineux derrière le logo */}
          <div className="absolute inset-0 bg-brand/20 blur-[60px] rounded-full scale-150 animate-pulse" />
          
          {/* Logo principal */}
          <div className="w-32 h-32 relative drop-shadow-2xl">
            <Image 
              src="/logo.png" // Assurez-vous que votre logo est bien à cet endroit
              alt="Comores Market Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* --- TEXTE ET INDICATEUR DE PRESTIGE --- */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-8 flex flex-col items-center"
        >
          <h2 className="text-white font-black text-xl tracking-[0.3em] uppercase opacity-90">
            Comores Market
          </h2>
          
          <div className="flex items-center gap-2 mt-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={14} className="text-brand" fill="currentColor" />
            </motion.div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] ml-1">
              Conciergerie Digitale
            </span>
          </div>
        </motion.div>
      </div>

      {/* --- BARRE DE PROGRESSION MINIMALISTE --- */}
      <div className="absolute bottom-20 w-48 h-[2px] bg-white/5 overflow-hidden rounded-full">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ 
            repeat: Infinity, 
            duration: 2, 
            ease: "easeInOut" 
          }}
          className="w-full h-full bg-gradient-to-r from-transparent via-brand to-transparent"
        />
      </div>

      {/* --- FOOTER DISCRET --- */}
      <div className="absolute bottom-10">
        <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.4em]">
          Chargement de votre univers
        </p>
      </div>
    </div>
  )
}