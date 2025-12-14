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
  const [view, setView] = useState<'loading' | 'form' | 'success'>('form')

  // Vérifier si on a bien une session de récupération
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Si pas de session, c'est que le lien est invalide ou expiré
        toast.error("Lien invalide ou expiré.")
        router.push('/publier')
      }
    }
    checkSession()
  }, [router, supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
        toast.error(error.message)
        setLoading(false)
    } else {
        setView('success')
        toast.success("Mot de passe mis à jour avec succès !")
        // On redirige après 2 secondes
        setTimeout(() => {
            router.push('/publier')
        }, 2000)
    }
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
                <p className="text-gray-500 mt-2">Vous allez être redirigé vers la connexion...</p>
            </div>
        ) : (
            <>
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
                    <p className="text-sm text-gray-500 mt-1">Entrez votre nouveau mot de passe sécurisé.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            minLength={6}
                            className="w-full p-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand/50 outline-none"
                            placeholder="••••••••" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
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
                    <Link href="/publier" className="text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1">
                        <ArrowLeft size={14} /> Retour
                    </Link>
                </div>
            </>
        )}
      </div>
    </div>
  )
}