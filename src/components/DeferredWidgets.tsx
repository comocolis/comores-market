'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Widgets non critiques : charges apres l'hydratation, hors du bundle initial de chaque page.
const EliteAssistant = dynamic(() => import('@/components/EliteAssistant'), { ssr: false })
const NativeFeatures = dynamic(() => import('@/components/NativeFeatures'), { ssr: false })
const CookieBanner = dynamic(() => import('@/components/CookieBanner'), { ssr: false })
const ToastProvider = dynamic(() => import('@/components/ToastProvider').then((m) => m.ToastProvider), { ssr: false })

// Monte le widget a la premiere interaction (scroll, toucher, clic, clavier) ou apres `fallbackMs`.
// Evite que des bibliotheques lourdes (framer-motion, react-markdown...) concurrencent l'affichage initial.
function useDeferredMount(fallbackMs: number) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const events = ['pointerdown', 'scroll', 'keydown', 'touchstart'] as const
    const start = () => setReady(true)
    const timer = setTimeout(start, fallbackMs)

    events.forEach((name) => window.addEventListener(name, start, { once: true, passive: true }))
    return () => {
      clearTimeout(timer)
      events.forEach((name) => window.removeEventListener(name, start))
    }
  }, [fallbackMs])

  return ready
}

export function DeferredAssistant() {
  const ready = useDeferredMount(5000)
  return ready ? <EliteAssistant /> : null
}

export function DeferredNativeFeatures() {
  return <NativeFeatures />
}

export function DeferredCookieBanner() {
  return <CookieBanner />
}

export function DeferredToaster() {
  return <ToastProvider />
}