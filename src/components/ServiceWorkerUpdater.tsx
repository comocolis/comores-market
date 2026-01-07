'use client';

import { useEffect } from 'react';

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 1. On demande au navigateur de vérifier s'il y a une mise à jour
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });

      // 2. FORCE BRUTE : Si on est désespéré, on désenregistre tout pour repartir à zéro
      // Décommentez les lignes ci-dessous si la ligne verte persiste encore après cet essai
      /*
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
          console.log("Service Worker tué 💀");
        }
        // On recharge la page une seule fois pour prendre le nouveau code
        if (!sessionStorage.getItem('reloaded')) {
            sessionStorage.setItem('reloaded', 'true');
            window.location.reload();
        }
      });
      */
    }
  }, []);

  return null;
}