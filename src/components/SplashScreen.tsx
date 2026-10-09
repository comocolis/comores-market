'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const SESSION_KEY = 'cm_splash_seen'
const VISIBLE_MS = 900
const FADE_MS = 300

// Splash affiche une seule fois par session de navigation. Animations en CSS pur
// (pas de framer-motion) pour ne pas alourdir le JS charge sur toutes les pages.
export default function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible')

  useEffect(() => {
    let alreadySeen = false
    try {
      alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1'
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // sessionStorage indisponible (navigation privee stricte) : on affiche le splash normalement
    }

    // Deja vu dans cette session : on retire le splash des que possible (via timer, pas de setState synchrone).
    const visibleMs = alreadySeen ? 0 : VISIBLE_MS
    const fadeMs = alreadySeen ? 0 : FADE_MS

    const fadeTimer = setTimeout(() => setPhase('fading'), visibleMs)
    const goneTimer = setTimeout(() => setPhase('gone'), visibleMs + fadeMs)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(goneTimer)
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white transition-opacity ease-out ${
        phase === 'fading' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="relative flex flex-col items-center justify-center -mt-12">
        <div className="relative w-36 h-36 mb-8">
          <Image src="/logo.png" alt="Comores Market" fill sizes="144px" className="object-contain" loading="eager" fetchPriority="low" />
        </div>
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            Comores<span className="text-[#22c55e]">Market</span>
          </h1>
          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-auto relative">
            <div className="h-full bg-yellow-500 rounded-full cm-splash-bar" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-16 left-0 w-full text-center px-8 z-10">
        <p className="text-[10px] font-bold tracking-[0.3em] text-gray-200 uppercase mb-3">Bienvenue sur</p>
        <p className="text-sm font-bold text-yellow-500 tracking-wide leading-relaxed font-sans italic">
          &quot;Le marché comorien en ligne,<br />pour les Comoriens.&quot;
        </p>
      </div>
    </div>
  )
}