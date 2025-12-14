'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState<'loading' | 'form' | 'success'>('loading') // On commence en chargement

  useEffect(() => {
    // On écoute le changement d'état (C'est plus fiable que getSession pour le reset)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event)
      
      if (event === "PASSWORD_RECOVERY" || session) {
        setView('form') // C'est bon, on a le droit de changer le mot de passe
      } else if (event === "SIGNED_OUT") {
        // On attend un peu avant de dire que c'est fichu, car parfois SIGNED_OUT arrive avant la connexion
        setTimeout(() => {
            // Si toujours pas de session, alors erreur
            supabase.auth.getSession().then(({ data }) => {
                if (!data.session) {
                     toast.error("Lien invalide ou expiré.")
                     router.push('/publier')
                }
            })
        }, 1000)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
        toast.error("Erreur : " + error.message)
        setLoading(false)
    } else {
        setView('success')
        toast.success("Mot de passe mis à jour avec succès !")
        setTimeout(() => {
            router.push('/publier')
        }, 3000)
    }
  }

  // VUE CHARGEMENT (Pendant que Supabase vérifie le lien)
  if (view === 'loading') {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-brand" size={32} />
                <p className="text-gray-500 text-sm">Vérification du lien sécurisé...</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6">
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {view === 'success' ? (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Mot de passe modifié !</h2>
                <p className="text-gray-500 mt-2">Redirection vers la connexion...</p>
            </div>
        ) : (
            <>
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-3">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Nouveau mot de passe</h1>
                    <p className="text-xs text-gray-500 mt-1">Saisissez votre nouveau mot de passe pour sécuriser votre compte.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-700 mb-1">MOT DE PASSE</label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            minLength={6}
                            className="w-full p-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand/50 outline-none transition"
                            placeholder="••••••••" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-brand text-white font-bold py-3 rounded-lg hover:bg-brand-dark transition shadow-md flex justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Confirmer le changement"}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <Link href="/publier" className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 font-bold">
                        <ArrowLeft size={14} /> Retour à la connexion
                    </Link>
                </div>
            </>
        )}
      </div>
    </div>
  )
}