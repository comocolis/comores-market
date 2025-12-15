'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Search, MessageCircle, User, LogOut, Settings, Camera, Save, Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function ComptePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // États pour le changement de mot de passe
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // États formulaire profil
  const [formData, setFormData] = useState({
    full_name: '',
    city: '',
    island: 'Ngazidja',
    phone_number: ''
  })

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/publier')
        return
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      if (data) {
        setFormData({
            full_name: data.full_name || '',
            city: data.city || '',
            island: data.island || 'Ngazidja',
            phone_number: data.phone_number || ''
        })
      }
      setLoading(false)
    }
    getProfile()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/publier')
    router.refresh()
  }

  const handleUpdateProfile = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        city: formData.city,
        island: formData.island,
        phone_number: formData.phone_number
    }).eq('id', profile.id)

    if (error) toast.error("Erreur lors de la mise à jour")
    else toast.success("Profil mis à jour !")
    setSaving(false)
  }

  // NOUVEAU : Fonction pour changer le mot de passe depuis le compte
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
        toast.warning("Le mot de passe doit faire 6 caractères minimum")
        return
    }
    setPasswordLoading(true)
    
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
        toast.error("Erreur : " + error.message)
    } else {
        toast.success("Mot de passe modifié avec succès !")
        setNewPassword('') // On vide le champ
    }
    setPasswordLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* HEADER PROFIL */}
      <div className="bg-white p-6 pb-8 rounded-b-4xl shadow-sm relative z-10">
        <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mon Compte</h1>
            <button onClick={handleSignOut} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition">
                <LogOut size={20} />
            </button>
        </div>

        <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center text-brand text-2xl font-bold relative overflow-hidden border-2 border-white shadow-md">
                {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
                ) : (
                    profile?.full_name?.[0]?.toUpperCase() || <User size={32} />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer">
                    <Camera size={20} className="text-white" />
                </div>
            </div>
            <div>
                <h2 className="font-bold text-lg text-gray-900">{profile?.full_name}</h2>
                <p className="text-sm text-gray-500">{profile?.email}</p>
                {profile?.is_pro ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded mt-1">
                        <ShieldCheck size={10} /> VENDEUR PRO
                    </span>
                ) : (
                    <Link href="/pro" className="inline-flex items-center gap-1 bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full mt-1 hover:bg-brand transition shadow-sm animate-pulse">
                        DEVENIR PRO
                    </Link>
                )}
            </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-0 space-y-6 pt-8">
        
        {/* FORMULAIRE INFOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><User size={18} /> Informations</h3>
            
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">Île</label>
                    <select 
                        className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition"
                        value={formData.island}
                        onChange={e => setFormData({...formData, island: e.target.value})}
                    >
                        <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">Ville</label>
                    <input 
                        type="text" 
                        className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 ml-1">WhatsApp</label>
                <input 
                    type="tel" 
                    className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition"
                    value={formData.phone_number}
                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                />
            </div>

            <button 
                onClick={handleUpdateProfile} 
                disabled={saving}
                className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl text-sm hover:bg-brand transition flex items-center justify-center gap-2"
            >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Enregistrer</>}
            </button>
        </div>

        {/* NOUVEAU : ZONE SÉCURITÉ / MOT DE PASSE */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Lock size={18} /> Sécurité</h3>
            
            <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">Nouveau mot de passe</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Minimum 6 caractères"
                            className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition pr-10"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={passwordLoading || !newPassword}
                    className="w-full bg-white border-2 border-brand text-brand font-bold py-3 rounded-xl text-sm hover:bg-brand hover:text-white transition disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-brand"
                >
                    {passwordLoading ? "Modification..." : "Modifier le mot de passe"}
                </button>
            </form>
        </div>

        {/* Accès Admin (Seulement si email correspond) */}
        {profile?.email === "votre-email-admin@gmail.com" && (
             <Link href="/admin" className="block bg-gray-800 text-white p-4 rounded-xl text-center font-bold shadow-lg">
                Accéder au Back-Office Admin
             </Link>
        )}

        <div className="pt-4 pb-8 text-center">
            <Link href="/cgu" className="text-xs text-gray-400 hover:text-gray-600 underline">Mentions légales & CGU</Link>
        </div>

      </div>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand transition"><Home size={24} /><span className="text-[9px] font-bold">Accueil</span></Link>
          <Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand transition"><Search size={24} /><span className="text-[9px] font-bold">Recherche</span></Link>
          <div className="flex justify-center relative -top-6">
            <Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 border-4 border-white hover:scale-105 transition"><Plus strokeWidth={3} size={28} /></Link>
          </div>
          <Link href="/messages" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand transition"><MessageCircle size={24} /><span className="text-[9px] font-bold">Messages</span></Link>
          <Link href="/compte" className="flex flex-col items-center justify-center gap-1 h-full text-brand"><User size={24} /><span className="text-[9px] font-bold">Compte</span></Link>
        </div>
      </nav>
    </div>
  )
}