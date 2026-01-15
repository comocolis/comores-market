'use client'

// 1. Force le mode dynamique (IMPORTANT pour le build)
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
        // On vérifie que le callback a bien fait son travail (connecter l'user)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
            setIsReady(true) 
        } else {
            // Si pas de session, le lien est invalide ou expiré
            toast.error("Lien expiré ou invalide.")
            router.push('/auth')
        }
    }
    checkSession()
  }, [supabase, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password.length < 6) {
        toast.error("Le mot de passe doit faire 6 caractères minimum")
        setLoading(false)
        return
    }

    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
        toast.error("Erreur : " + error.message)
        setLoading(false)
    } else {
        toast.success("Mot de passe mis à jour !")
        setTimeout(() => {
            router.push('/compte')
        }, 1500)
    }
  }

  if (!isReady) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-brand" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center p-6 font-sans">
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-4xl shadow-xl border border-gray-100">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                <Lock size={32} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Réinitialisation</h1>
            <p className="text-sm font-medium text-gray-400 mt-2">Créez votre nouveau mot de passe sécurisé.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Nouveau mot de passe</label>
                <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    minLength={6}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition font-medium text-gray-900"
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 transition"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-dark active:scale-95 transition flex justify-center items-center gap-2 uppercase tracking-wide text-xs"
            >
                {loading ? <Loader2 className="animate-spin" /> : "Enregistrer le nouveau mot de passe"}
            </button>
        </form>
      </div>
    </div>
  )
}