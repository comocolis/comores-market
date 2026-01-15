'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotFoundContent() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
      
      {/* ILLUSTRATION 404 */}
      <div className="relative mb-8">
        <h1 className="text-[150px] font-black text-gray-200 leading-none select-none">404</h1>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 animate-in zoom-in duration-500">
                <Search size={48} className="text-brand" />
            </div>
        </div>
      </div>

      {/* TEXTE */}
      <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
        Page introuvable
      </h2>
      <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">
        Oups ! Cette page semble avoir disparu ou n'a jamais existé sur le marché.
      </p>

      {/* BOUTONS */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button 
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl active:scale-95 transition shadow-sm hover:bg-gray-50"
        >
            <ArrowLeft size={18} />
            Retour
        </button>
        
        <Link 
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-brand text-white font-bold rounded-2xl shadow-lg shadow-brand/20 active:scale-95 transition hover:bg-brand-dark"
        >
            <Home size={18} />
            Accueil
        </Link>
      </div>

    </div>
  )
}