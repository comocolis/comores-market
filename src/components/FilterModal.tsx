'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface FilterModalProps {
  onClose: () => void
  priceMin: string
  setPriceMin: (value: string) => void
  priceMax: string
  setPriceMax: (value: string) => void
}

export default function FilterModal({ onClose, priceMin, setPriceMin, priceMax, setPriceMax }: FilterModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }

  const handleReset = () => {
    setPriceMin('')
    setPriceMax('')
  }

  return (
    // CORRECTION: z-[100] (avec crochets) pour la valeur arbitraire
    <div className={`fixed inset-0 z-100 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Fond sombre flouté */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={handleClose}
      />

      {/* Contenu de la modale */}
      <div className={`relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all duration-300 scale-95 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-extrabold text-gray-900">Filtres</h3>
          <button 
            onClick={handleClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition active:scale-95"
            aria-label="Fermer"
            title="Fermer"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Section Prix */}
        <div className="space-y-4 mb-8">
          <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">Budget (KMF)</p>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="min-price" className="text-xs font-semibold text-gray-500 mb-1.5 block">Minimum</label>
              <input 
                id="min-price"
                type="number" 
                placeholder="0" 
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="max-price" className="text-xs font-semibold text-gray-500 mb-1.5 block">Maximum</label>
              <input 
                id="max-price"
                type="number" 
                placeholder="illimité" 
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition active:scale-95"
          >
            Réinitialiser
          </button>
          <button 
            onClick={handleClose}
            // CORRECTION: flex-[2] (avec crochets) pour le ratio flex
            className="flex-2 py-3.5 rounded-xl font-bold text-white bg-brand hover:bg-brand-dark shadow-lg shadow-brand/20 transition active:scale-95"
          >
            Voir les résultats
          </button>
        </div>

      </div>
    </div>
  )
}