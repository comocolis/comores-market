'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // On vérifie si l'utilisateur est bien connecté (grâce au callback)
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            setIsReady(true) // C'est bon, on affiche le formulaire
        } else {
            // Si pas de session, le lien est invalide -> retour accueil
            toast.error("Lien expiré ou invalide.")
            router.push('/publier')
        }
    }
    checkSession()
  }, [supabase, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
        toast.error(error.message)
        setLoading(false)
    } else {
        toast.success("Mot de passe modifié avec succès !")
        // Déconnexion de sécurité ou redirection vers le compte
        setTimeout(() => {
            router.push('/compte')
        }, 2000)
    }
  }

  if (!isReady) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6">
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Réinitialisation</h1>
            <p className="text-sm text-gray-500 mt-2">Créez votre nouveau mot de passe.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nouveau mot de passe</label>
                <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    minLength={6}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-9 text-gray-400"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-dark transition flex justify-center"
            >
                {loading ? <Loader2 className="animate-spin" /> : "Enregistrer le mot de passe"}
            </button>
        </form>
      </div>
    </div>
  )
}