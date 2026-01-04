'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Share, PlusSquare } from 'lucide-react'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // 1. Vérifier si l'app est déjà installée
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    if (isStandalone) return

    // 2. Détection iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // 3. Gestion Android (Event standard)
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    // 4. Gestion iOS (Pas d'event, on force l'affichage)
    if (isIosDevice) {
        setTimeout(() => setIsVisible(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsVisible(false)
    }
    setDeferredPrompt(null)
  }

  if (!isVisible) return null

  return (
    // CONTENEUR PRINCIPAL (Votre design conservé)
    <div className="fixed top-0 inset-x-0 z-[9999] p-4 animate-in slide-in-from-top duration-500 pointer-events-none">
      
      <div className="bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-white/10 max-w-[480px] mx-auto pointer-events-auto">
        
        {/* LOGO */}
        <div className="bg-brand p-2 rounded-xl shrink-0">
            <Smartphone size={20} className="text-white" />
        </div>

        {/* TEXTE ADAPTATIF */}
        <div className="flex-1 min-w-0">
            {isIOS ? (
                <div className="flex flex-col gap-0.5">
                    <p className="font-bold text-sm leading-tight">Installer sur iPhone</p>
                    <p className="text-[9px] text-gray-300 flex items-center gap-1 whitespace-nowrap">
                       Appuyez sur <Share size={10} /> puis <span className="font-bold">Sur l'écran d'accueil</span> <PlusSquare size={10} />
                    </p>
                </div>
            ) : (
                <>
                    <p className="font-bold text-sm leading-tight">Installer l'app</p>
                    <p className="text-[10px] text-gray-300 truncate">Accès rapide & hors ligne.</p>
                </>
            )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
            {/* Le bouton Installer ne s'affiche que sur Android/PC */}
            {!isIOS && (
                <button 
                    onClick={handleInstallClick}
                    className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1 shadow-sm active:scale-95"
                >
                    <Download size={14} /> <span className="hidden sm:inline">Installer</span>
                </button>
            )}
            
            <button 
                onClick={() => setIsVisible(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white active:scale-90"
            >
                <X size={16} />
            </button>
        </div>

      </div>
    </div>
  )
}