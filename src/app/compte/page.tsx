'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, LogOut, Camera, Lock, Eye, EyeOff, Loader2, ShieldCheck, 
  PenSquare, X, LayoutDashboard, Pencil, Package, Heart, ChevronRight, Save 
} from 'lucide-react'
import { toast } from 'sonner'

export default function ComptePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const ADMIN_EMAIL = "abdesisco1@gmail.com"

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    city: '',
    island: 'Ngazidja',
    phone_number: ''
  })

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) { 
            // Si pas connecté, on redirige vers l'auth
            router.push('/auth')
            return 
        }
        
        setUser(user) 

        // Récupération du profil
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        
        if (error) {
            console.error("Erreur profil:", error)
            // Si erreur (ex: pas de profil), on ne bloque pas tout
        }

        setProfile(data)
        
        if (data) {
            setFormData({
                full_name: data.full_name || '',
                city: data.city || '',
                island: data.island || 'Ngazidja',
                phone_number: data.phone_number || ''
            })
        }
      } catch (error) {
        console.error("Erreur générale:", error)
      } finally {
        // QUOI QU'IL ARRIVE, on arrête le chargement
        setLoading(false)
      }
    }
    getProfile()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success("Déconnecté avec succès")
    router.push('/auth') // Redirection vers auth
    router.refresh()
  }

  const handleAvatarClick = () => {
    if (!isEditingInfo) {
        toast.info("Cliquez sur le bouton 'Modifier' pour changer votre photo.")
        return
    }
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setAvatarUploading(true)

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        
        const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
        if (updateError) throw updateError
        
        setProfile({ ...profile, avatar_url: publicUrl })
        toast.success("Photo mise à jour !")
    } catch (error: any) {
        toast.error("Erreur upload : " + error.message)
    } finally {
        setAvatarUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ ...formData }).eq('id', user.id)
    if (error) toast.error("Erreur mise à jour")
    else {
        toast.success("Profil mis à jour !")
        setIsEditingInfo(false)
        setProfile({ ...profile, ...formData })
    }
    setSaving(false)
  }

  const cancelEditInfo = () => {
    setFormData({
        full_name: profile?.full_name || '',
        city: profile?.city || '',
        island: profile?.island || 'Ngazidja',
        phone_number: profile?.phone_number || ''
    })
    setIsEditingInfo(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.warning("Minimum 6 caractères")
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else {
        toast.success("Mot de passe modifié !")
        setNewPassword('')
        setIsEditingPassword(false)
    }
    setPasswordLoading(false)
  }

  // Calcul jours restants PRO
  const daysRemaining = profile?.subscription_end_date 
    ? Math.ceil((new Date(profile.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : 0
  const isProActive = profile?.is_pro && daysRemaining > 0

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* HEADER */}
      <div className="bg-white p-6 pb-8 rounded-b-4xl shadow-sm relative z-10">
        <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mon Compte</h1>
            <button onClick={handleSignOut} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition" title="Se déconnecter"><LogOut size={20} /></button>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <div className={`w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center text-brand text-2xl font-bold overflow-hidden border-2 shadow-md relative transition-all ${isEditingInfo ? 'border-brand' : 'border-white'}`}>
                    {avatarUploading ? <Loader2 className="animate-spin" /> : profile?.avatar_url ? <Image src={profile.avatar_url} alt="" fill className="object-cover" /> : profile?.full_name?.[0]?.toUpperCase() || <User size={32} />}
                    {isEditingInfo && <div className="absolute inset-0 bg-black/30 flex items-center justify-center animate-in fade-in"><Camera size={24} className="text-white" /></div>}
                </div>
                <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-white shadow-sm transition-colors ${isEditingInfo ? 'bg-brand text-white scale-110' : 'bg-gray-100 text-gray-400'}`}>
                    <Pencil size={12} strokeWidth={isEditingInfo ? 3 : 2} />
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
            </div>
            
            <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-gray-900 truncate">{profile?.full_name || "Utilisateur"}</h2>
                <p className="text-sm text-gray-500 truncate mb-1">{user?.email}</p>
                
                {isProActive ? (
                    <div className="inline-flex flex-col items-start bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                        <span className="flex items-center gap-1 text-green-700 text-[10px] font-bold uppercase"><ShieldCheck size={10} /> Vendeur PRO</span>
                        <span className="text-[10px] text-green-600 font-medium mt-0.5">Expire dans {daysRemaining} jours</span>
                    </div>
                ) : (
                    <Link href="/pro" className="inline-flex items-center gap-1 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm animate-pulse hover:bg-brand transition">
                        DEVENIR PRO
                    </Link>
                )}
            </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-0 space-y-5 pt-8">
        
        {/* BOUTON ADMIN */}
        {user?.email === ADMIN_EMAIL && (
             <Link href="/admin" className="w-full bg-gray-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-gray-900/20 active:scale-95 transition border border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg"><LayoutDashboard size={24} className="text-brand" /></div>
                    <div><p className="font-bold text-lg leading-none">Administration</p><p className="text-xs text-gray-400 mt-1">Accès réservé</p></div>
                </div>
                <ChevronRight className="text-gray-500" />
             </Link>
        )}

        {/* MENU NAVIGATION PERSONNEL */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <Link href="/mes-annonces" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl group-hover:scale-110 transition"><Package size={20} /></div>
                    <span className="font-bold text-gray-700">Mes Annonces</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
            </Link>
            <div className="h-px bg-gray-50 mx-4" />
            <Link href="/favoris" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group">
                <div className="flex items-center gap-4">
                    <div className="bg-pink-50 text-pink-500 p-2.5 rounded-xl group-hover:scale-110 transition"><Heart size={20} /></div>
                    <span className="font-bold text-gray-700">Mes Favoris</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
            </Link>
        </div>

        {/* BLOC INFORMATIONS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><User size={18} /> Informations</h3>
                {!isEditingInfo && <button onClick={() => setIsEditingInfo(true)} className="text-xs font-bold text-brand bg-brand/10 px-3 py-1.5 rounded-full hover:bg-brand hover:text-white transition flex items-center gap-1"><PenSquare size={12} /> Modifier</button>}
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nom complet</label>
                    {isEditingInfo ? <input type="text" className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition border border-gray-200" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /> : <p className="p-3 text-gray-900 font-medium text-sm border-b border-gray-50">{profile?.full_name}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Île</label>
                        {isEditingInfo ? (
                            <select className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition border border-gray-200" value={formData.island} onChange={e => setFormData({...formData, island: e.target.value})}>
                                <option>Ngazidja</option>
                                <option>Ndzouani</option>
                                <option>Mwali</option>
                                <option>Maore</option>
                                <option>La Réunion</option>
                            </select>
                        ) : (
                            <p className="p-3 text-gray-900 font-medium text-sm border-b border-gray-50">{profile?.island}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Ville</label>
                        {isEditingInfo ? <input type="text" className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition border border-gray-200" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /> : <p className="p-3 text-gray-900 font-medium text-sm border-b border-gray-50">{profile?.city}</p>}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">WhatsApp</label>
                    {isEditingInfo ? <input type="tel" className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition border border-gray-200" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /> : <p className="p-3 text-gray-900 font-medium text-sm border-b border-gray-50 tracking-wide">{profile?.phone_number || <span className="text-gray-400 italic">Non renseigné</span>}</p>}
                </div>
            </div>
            
            {isEditingInfo && (
                <div className="flex gap-2 pt-2 animate-in fade-in">
                    <button onClick={cancelEditInfo} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"><X size={16} /> Annuler</button>
                    <button onClick={handleUpdateProfile} disabled={saving} className="flex-1 bg-brand text-white font-bold py-3 rounded-xl text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2 shadow-lg shadow-brand/20">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Enregistrer</>}
                    </button>
                </div>
            )}
        </div>

        {/* BLOC SÉCURITÉ */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Lock size={18} /> Sécurité</h3>
                {!isEditingPassword && <button onClick={() => setIsEditingPassword(true)} className="text-xs font-bold text-brand bg-brand/10 px-3 py-1.5 rounded-full hover:bg-brand hover:text-white transition flex items-center gap-1"><PenSquare size={12} /> Modifier</button>}
            </div>
            
            {!isEditingPassword ? (
                <div className="p-3 text-gray-500 text-sm italic border-b border-gray-50">Mot de passe masqué ••••••••</div>
            ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-3 animate-in fade-in">
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Minimum 6 caractères" className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition pr-10 border border-gray-200" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => {setIsEditingPassword(false); setNewPassword('')}} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-sm hover:bg-gray-200 transition">Annuler</button>
                        <button type="submit" disabled={passwordLoading || !newPassword} className="flex-1 bg-brand text-white font-bold py-3 rounded-xl text-sm hover:bg-brand-dark transition disabled:opacity-50">
                            {passwordLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Confirmer"}
                        </button>
                    </div>
                </form>
            )}
        </div>

        <div className="pt-4 pb-8 text-center">
            <Link href="/cgu" className="text-xs text-gray-400 hover:text-gray-600 underline">Mentions légales & CGU</Link>
        </div>

      </div>
    </div>
  )
}