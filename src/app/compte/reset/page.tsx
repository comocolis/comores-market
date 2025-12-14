'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState<'loading' | 'form' | 'success'>('loading')

  useEffect(() => {
    // 1. On vérifie immédiatement si on a un hash dans l'URL (le token de reset)
    // Cela permet d'afficher le formulaire tout de suite sans attendre Supabase
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
        setView('form')
    }

    // 2. On écoute quand même l'état de la session pour sécuriser l'envoi
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setView('form')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Mise à jour du mot de passe
    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
        toast.error("Erreur : " + error.message)
        setLoading(false)
    } else {
        setView('success')
        toast.success("Mot de passe mis à jour !")
        // Redirection après 3 secondes
        setTimeout(() => {
            router.push('/publier')
        }, 3000)
    }
  }

  // --- VUE CHARGEMENT ---
  if (view === 'loading') {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
              <Loader2 className="animate-spin text-brand mb-4" size={40} />
              <h2 className="text-xl font-bold text-gray-900">Vérification de sécurité...</h2>
              <p className="text-gray-500 text-sm mt-2">Nous analysons votre lien de récupération.</p>
              
              {/* Bouton de secours si ça tourne trop longtemps */}
              <button onClick={() => router.push('/publier')} className="mt-8 text-gray-400 text-xs underline">
                Annuler et revenir à l'accueil
              </button>
          </div>
      )
  }

  // --- VUE SUCCÈS ---
  if (view === 'success') {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                <CheckCircle size={40} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Mot de passe modifié !</h1>
            <p className="text-gray-500 mt-2 mb-8">Votre compte est sécurisé. Vous allez être redirigé...</p>
            <Link href="/publier" className="bg-brand text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-dark transition">
                Se connecter maintenant
            </Link>
        </div>
    )
  }

  // --- VUE FORMULAIRE ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-3xl shadow-xl shadow-brand/5 border border-white">
        
        <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                <Lock size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Nouveau mot de passe</h1>
            <p className="text-sm text-gray-500 mt-2 px-4">Choisissez un mot de passe fort pour protéger votre compte Comores Market.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 uppercase tracking-wider">Mot de passe</label>
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required 
                        minLength={6}
                        className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-brand/50 focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium text-gray-900"
                        placeholder="••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
                    >
                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-dark hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : "Confirmer le changement"}
            </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <Link href="/publier" className="text-sm text-gray-500 hover:text-brand font-bold inline-flex items-center gap-2 transition">
                <ArrowLeft size={16} /> Retour à la connexion
            </Link>
        </div>

      </div>
      
      <div className="text-center mt-8">
        <p className="text-xs text-gray-400">© 2025 Comores Market</p>
      </div>
    </div>
  )
}