'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie_consent')
    
    if (savedConsent) {
      if (savedConsent === 'granted') {
        enableAnalytics()
      }
      return 
    }

    checkCountryAndDecide()
  }, [])

  const checkCountryAndDecide = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      
      if (data.country_code === 'KM') {
        acceptCookies() 
      } else {
        setShowBanner(true)
      }
    } catch (error) {
      setShowBanner(true)
    }
  }

  const enableAnalytics = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      })
    }
  }

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'granted')
    enableAnalytics()
    setShowBanner(false)
  }

  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'denied')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    // CORRECTION ICI : Centrage + Positionnement au-dessus du menu du bas
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-88 bg-white p-5 rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 z-60 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="flex items-start gap-4">
        <div className="bg-brand/10 p-2.5 rounded-full shrink-0">
            <Cookie className="text-brand" size={24} />
        </div>
        <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1 text-sm">Cookies & Pubs</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Pour soutenir la plateforme, nous utilisons des cookies pour la publicité et les statistiques.
            </p>
            <div className="flex gap-2">
                <button 
                  onClick={acceptCookies} 
                  className="flex-1 bg-brand text-white text-xs font-bold py-2.5 rounded-xl hover:bg-brand-dark transition shadow-lg shadow-brand/20 active:scale-95"
                >
                  Accepter
                </button>
                <button 
                  onClick={declineCookies} 
                  className="flex-1 bg-gray-50 text-gray-600 text-xs font-bold py-2.5 rounded-xl hover:bg-gray-200 transition border border-gray-200 active:scale-95"
                >
                  Refuser
                </button>
            </div>
            <div className="mt-3 text-center">
                <Link href="/cgu" className="text-[10px] text-gray-500 underline hover:text-brand">En savoir plus</Link>
            </div>
        </div>
      </div>
    </div>
  )
}