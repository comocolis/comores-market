'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 1. On écoute l'événement qui dit "Hey, ce site est installable !"
    const handler = (e: any) => {
      // On empêche le navigateur d'afficher sa bannière moche par défaut
      e.preventDefault()
      // On garde l'événement en mémoire pour le déclencher quand on veut
      setDeferredPrompt(e)
      // On affiche notre belle bannière
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // 2. On déclenche l'invite d'installation système
    deferredPrompt.prompt()

    // 3. On attend la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
      setIsVisible(false) // On cache la bannière si accepté
    }
    
    // On nettoie l'événement (il ne peut être utilisé qu'une fois)
    setDeferredPrompt(null)
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-100 p-4 animate-in slide-in-from-top duration-500">
      <div className="bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-white/10 max-w-md mx-auto">
        
        {/* LOGO / ICONE */}
        <div className="bg-brand p-2 rounded-xl shrink-0">
            <Smartphone size={20} className="text-white" />
        </div>

        {/* TEXTE */}
        <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Installer l'application</p>
            <p className="text-[10px] text-gray-300 truncate">Accès plus rapide, même hors ligne.</p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
            <button 
                onClick={handleInstallClick}
                className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1 shadow-sm"
            >
                <Download size={14} /> Installer
            </button>
            <button 
                onClick={() => setIsVisible(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
            >
                <X size={16} />
            </button>
        </div>

      </div>
    </div>
  )
}