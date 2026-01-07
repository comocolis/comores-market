'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share, PlusSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // 1. Vérifier si l'app est déjà installée (Mode Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return; // On ne montre rien si déjà installé

    // 2. Vérifier si on a déjà fermé la bannière dans cette session
    if (sessionStorage.getItem('installBannerDismissed')) return;

    // 3. Détection iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
        // Sur iOS, on affiche la bannière après 2 secondes (car pas d'événement système)
        setTimeout(() => setIsVisible(true), 2000);
    }

    // 4. Détection Android/Chrome (L'événement natif)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Empêche le mini-bandeau natif moche
      setDeferredPrompt(e);
      setIsVisible(true); // Affiche notre belle bannière
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
        // Sur iOS, on ne peut pas forcer l'install, on montre les instructions
        setShowInstructions(true);
    } else if (deferredPrompt) {
        // Sur Android, on déclenche le prompt natif
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    } else {
        // Cas rare (Navigateur PC ou non supporté)
        alert("Pour installer, cherchez l'option 'Ajouter à l'écran d'accueil' dans le menu de votre navigateur.");
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('installBannerDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {/* BANNIÈRE PRINCIPALE */}
      {isVisible && !showInstructions && (
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            // Positionnée au-dessus du BottomNav (environ 80px du bas)
            className="fixed bottom-24 left-4 right-4 z-40 bg-gray-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="bg-brand p-3 rounded-2xl text-white shadow-lg">
                <Download size={24} />
            </div>
            <div>
                <p className="font-black text-sm">Installer l'App</p>
                <p className="text-[10px] text-gray-400 font-medium">Plus rapide, accès hors ligne</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick} 
                className="bg-white text-gray-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition"
              >
                Installer
              </button>
              <button onClick={handleDismiss} className="p-2 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
          </div>
        </motion.div>
      )}

      {/* MODALE D'INSTRUCTIONS iOS */}
      {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end pb-10"
            onClick={() => setShowInstructions(false)}
          >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="bg-white rounded-t-[2.5rem] p-8 pb-12 relative"
                onClick={(e) => e.stopPropagation()}
              >
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                  
                  <h3 className="text-xl font-black text-center mb-6 text-gray-900">Installer sur iPhone</h3>
                  
                  <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl">
                          <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl">
                              <Share size={24} />
                          </div>
                          <p className="text-sm font-bold text-gray-600">1. Appuyez sur le bouton <span className="text-gray-900 font-black">Partager</span> en bas de Safari.</p>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl">
                          <div className="bg-gray-200 text-gray-600 p-3 rounded-2xl">
                              <PlusSquare size={24} />
                          </div>
                          <p className="text-sm font-bold text-gray-600">2. Cherchez et appuyez sur <span className="text-gray-900 font-black">Sur l'écran d'accueil</span>.</p>
                      </div>
                  </div>

                  <button 
                    onClick={() => setShowInstructions(false)} 
                    className="w-full bg-brand text-white font-black py-5 rounded-3xl mt-8 text-xs uppercase tracking-widest shadow-xl shadow-brand/20"
                  >
                    J'ai compris
                  </button>
              </motion.div>
          </motion.div>
      )}
    </AnimatePresence>
  )
}