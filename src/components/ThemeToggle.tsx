'use client'

import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 animate-pulse ${className}`} />
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode Sombre actif (Cliquer pour Mode Clair)" : "Mode Clair actif (Cliquer pour Mode Sombre)"}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm border border-gray-200/50 dark:border-slate-700/50 ${className}`}
    >
      {isDark ? (
        <Moon size={18} className="text-amber-300 fill-amber-300/30 transition-transform hover:-rotate-12" />
      ) : (
        <Sun size={18} className="text-amber-500 fill-amber-500/20 transition-transform hover:rotate-45" />
      )}
    </button>
  )
}
