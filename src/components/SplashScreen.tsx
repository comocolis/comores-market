'use client'

import { useEffect } from 'react'

export default function SplashScreen() {
  
  useEffect(() => {
    // Le splashscreen statique est déjà affiché dans le HTML (layout.tsx)
    // On attend 2.5 secondes avant de le cacher avec une transition fluide
    const timer = setTimeout(() => {
      const splash = document.getElementById('static-splash')
      if (splash) {
        // Transition CSS pour un fade-out propre
        splash.style.transition = 'opacity 0.5s ease-out'
        splash.style.opacity = '0'
        splash.style.pointerEvents = 'none'

        // Suppression du DOM une fois la transition terminée
        setTimeout(() => {
          splash.remove()
        }, 500)
      }
    }, 2500)

    // Nettoyage au cas où le composant est démonté avant la fin
    return () => {
      clearTimeout(timer)
      const splash = document.getElementById('static-splash')
      if (splash && splash.style.opacity !== '0') {
         splash.remove()
      }
    }
  }, [])

  return null // Le rendu est géré par le HTML statique dans layout.tsx
}