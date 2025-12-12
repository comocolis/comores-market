'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2, Save } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/publier')
    }
    checkSession()
  }, [supabase, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage(null)
    if (password.length < 6) { setMessage("Le mot de passe doit faire au moins 6 caractères."); setLoading(false); return }
    try {
      const { error } = await supabase.auth.updateUser({ password: password })
      if (error) throw error
      alert("Mot de passe modifié avec succès !"); router.push('/')
    } catch (error: any) { setMessage("Erreur : " + error.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Nouveau mot de passe</h1>
        <p className="text-gray-500 text-sm mb-6 text-center">Entrez votre nouveau mot de passe sécurisé.</p>
        {message && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{message}</div>}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative"><label className="block text-sm font-bold text-gray-700 mb-1">Nouveau mot de passe</label><input type={showPassword ? "text" : "password"} required minLength={6} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 outline-none focus:border-brand" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
            <button type="submit" disabled={loading} className="w-full bg-brand text-white font-bold py-3 rounded-lg hover:bg-brand-dark transition shadow-md flex justify-center items-center gap-2">{loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Enregistrer</>}</button>
        </form>
      </div>
    </div>
  )
}