'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share, PlusSquare, MoreVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// URL officielle de votre application sur le Google Play Store
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.comoresmarket.app'

export default function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // Si l'utilisateur est déjà dans l'application installée (standalone), on ne montre rien
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Si l'utilisateur a déjà masqué la bannière durant cette session, on l'ignore
    if (sessionStorage.getItem('installBannerDismissed')) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Affichage progressif après 3 secondes pour ne pas surcharger visuellement au chargement initial
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      // Pour iOS, on affiche la boîte d'instructions PWA manuelle qui est très claire
      setShowInstructions(true);
    } else {
      // Pour Android (et les autres supports), on redirige directement vers la fiche Play Store
      window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
      // On masque la bannière après le clic de redirection
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('installBannerDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {/* === BANNIÈRE COMPACTE & PREMIUM === */}
      {isVisible && !showInstructions && (
        <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-4 pt-safe left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-100 bg-[#0F172A]/95 backdrop-blur-md text-white p-2 pr-3 rounded-full shadow-2xl shadow-black/30 flex items-center justify-between border border-white/10 ring-1 ring-black/5"
        >
          {/* GAUCHE : Icône + Texte */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Icône ronde */}
            <div className="bg-brand h-10 w-10 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand/20 shrink-0">
                <Download size={20} strokeWidth={2.5} />
            </div>
            
            {/* Texte dense */}
            <div className="flex flex-col justify-center min-w-0 pr-2">
                <p className="font-bold text-[13px] leading-none text-white truncate">Installer l'App</p>
                <p className="text-[10px] text-gray-500 font-medium mt-1 leading-none truncate">Accès rapide & hors ligne</p>
            </div>
          </div>
          
          {/* DROITE : Boutons */}
          <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleInstallClick} 
                className="bg-white text-gray-900 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-transform active:scale-95 shadow-sm hover:bg-gray-100"
              >
                Installer
              </button>
              <button 
                onClick={handleDismiss}
                aria-label="Fermer la bannière d'installation"
                className="h-8 w-8 flex items-center justify-center bg-white/10 rounded-full text-gray-500 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
          </div>
        </motion.div>
      )}

      {/* MODALE D'INSTRUCTIONS (Pour iOS et fallback) */}
      {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex flex-col justify-end pb-0 sm:items-center sm:justify-center"
            onClick={() => setShowInstructions(false)}
          >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 pb-12 w-full max-w-sm relative shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 sm:hidden" />
                  
                  {isIOS ? (
                      <>
                        <h3 className="text-xl font-black text-center mb-6 text-gray-900 tracking-tight">Installer sur iPhone</h3>
                        <div className="space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl shrink-0"><Share size={24} /></div>
                                <p className="text-sm font-bold text-gray-600">1. Appuyez sur <span className="text-gray-900 font-black">Partager</span> en bas.</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                <div className="bg-gray-200 text-gray-600 p-3 rounded-2xl shrink-0"><PlusSquare size={24} /></div>
                                <p className="text-sm font-bold text-gray-600">2. Appuyez sur <span className="text-gray-900 font-black">Sur l'écran d'accueil</span>.</p>
                            </div>
                        </div>
                      </>
                  ) : (
                      <>
                        <h3 className="text-xl font-black text-center mb-6 text-gray-900 tracking-tight">Installation Manuelle</h3>
                        <p className="text-center text-xs text-gray-500 mb-6 px-4 font-medium">L'installation automatique est bloquée. Suivez ces étapes :</p>
                        <div className="space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                <div className="bg-gray-200 text-gray-600 p-3 rounded-2xl shrink-0"><MoreVertical size={24} /></div>
                                <p className="text-sm font-bold text-gray-600">1. Ouvrez le <span className="text-gray-900 font-black">Menu</span> du navigateur.</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                <div className="bg-brand/10 text-brand p-3 rounded-2xl shrink-0"><PlusSquare size={24} /></div>
                                <p className="text-sm font-bold text-gray-600">2. Sélectionnez <span className="text-gray-900 font-black">Ajouter à l'écran d'accueil</span>.</p>
                            </div>
                        </div>
                      </>
                  )}

                  <button 
                    onClick={() => setShowInstructions(false)} 
                    className="w-full bg-brand text-white font-black py-5 rounded-3xl mt-8 text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand/20 active:scale-95 transition"
                  >
                    J'ai compris
                  </button>
              </motion.div>
          </motion.div>
      )}
    </AnimatePresence>
  )
}