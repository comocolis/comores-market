'use client';

import { useEffect } from 'react';

export default function NativeFeatures() {
  useEffect(() => {
    // 1. Bloquer le menu contextuel (Appui long / Clic droit)
    const handleContextMenu = (e: MouseEvent) => {
      // On laisse passer le clic droit uniquement sur les champs de saisie
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault(); // STOPPE LE MENU
    };

    // 2. Bloquer le drag & drop des images (Fantôme de l'image)
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return null; // Ce composant n'affiche rien visuellement
}