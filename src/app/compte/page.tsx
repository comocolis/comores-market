'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, LogOut, Camera, Lock, Eye, EyeOff, Loader2, ShieldCheck, 
  PenSquare, X, LayoutDashboard, Pencil, Package, Heart, ChevronRight, Save,
  Facebook, Instagram, Crown, AlertTriangle, Trash2 
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
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  
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
    phone_number: '',
    facebook_url: '',
    instagram_url: '',
    description: '' 
  })

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 
      
      setUser(user) 

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      
      if (data) {
        setFormData({
            full_name: data.full_name || '',
            city: data.city || '',
            island: data.island || 'Ngazidja',
            phone_number: data.phone_number || '',
            facebook_url: data.facebook_url || '',
            instagram_url: data.instagram_url || '',
            description: data.description || '' 
        })
      }
      setLoading(false)
    }
    getProfile()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const confirmDeleteAccount = async () => {
      if (deleteConfirmation !== 'SUPPRIMER') {
          toast.error("Mot-clé incorrect")
          return
      }
      setDeleting(true)
      const { error } = await supabase.rpc('delete_own_account')
      if (error) {
          toast.error("Erreur : " + error.message)
          setDeleting(false)
      } else {
          toast.success("Votre compte a été supprimé.")
          await supabase.auth.signOut()
          router.push('/')
          router.refresh()
      }
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
        toast.error("Erreur upload")
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
        phone_number: profile?.phone_number || '',
        facebook_url: profile?.facebook_url || '',
        instagram_url: profile?.instagram_url || '',
        description: profile?.description || ''
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

  const daysRemaining = profile?.subscription_end_date 
    ? Math.ceil((new Date(profile.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : 0
  const isProActive = profile?.is_pro && daysRemaining > 0

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      
      {/* MODALE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-110 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 border-t-4 border-red-600">
                <div className="text-center">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><AlertTriangle size={32} /></div>
                    <h3 className="font-extrabold text-xl">Êtes-vous sûr ?</h3>
                    <p className="text-sm text-gray-500">Action irréversible. Vos données seront effacées.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block text-center">Tapez "SUPPRIMER"</label>
                    <input type="text" className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-bold text-center outline-none uppercase" placeholder="SUPPRIMER" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())} />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100">Annuler</button>
                    <button onClick={confirmDeleteAccount} disabled={deleting || deleteConfirmation !== 'SUPPRIMER'} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 disabled:opacity-50">Confirmer</button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-6 pb-8 rounded-b-4xl shadow-sm relative z-10">
        <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold">Mon Compte</h1>
            <button onClick={handleSignOut} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-red-500 transition"><LogOut size={20} /></button>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <div className={`w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center text-brand text-2xl font-bold overflow-hidden border-2 shadow-md relative transition-all ${isEditingInfo ? 'border-brand' : 'border-white'}`}>
                    {avatarUploading ? <Loader2 className="animate-spin" /> : profile?.avatar_url ? <Image src={profile.avatar_url} alt="" fill className="object-cover" /> : profile?.full_name?.[0]?.toUpperCase() || <User size={32} />}
                    {isEditingInfo && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Camera size={24} className="text-white" /></div>}
                </div>
                <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-white shadow-sm ${isEditingInfo ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Pencil size={12} strokeWidth={3} />
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
            </div>
            
            <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg truncate">{profile?.full_name || "Utilisateur"}</h2>
                <p className="text-sm text-gray-500 truncate mb-1">{user?.email}</p>
                {isProActive ? (
                    <div className="inline-flex flex-col items-start bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                        <span className="flex items-center gap-1 text-green-700 text-[10px] font-bold uppercase"><ShieldCheck size={10} /> Vendeur PRO</span>
                        <span className="text-[10px] text-green-600 font-medium mt-0.5">Expire dans {daysRemaining} jours</span>
                    </div>
                ) : (
                    <Link href="/pro" className="inline-flex items-center gap-1 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">DEVENIR PRO</Link>
                )}
            </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-0 space-y-5 pt-8">
        {user?.email === ADMIN_EMAIL && (
             <Link href="/admin" className="w-full bg-gray-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg active:scale-95 transition border border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg"><LayoutDashboard size={24} className="text-brand" /></div>
                    <div><p className="font-bold text-lg leading-tight">Administration</p><p className="text-xs text-gray-400">Accès réservé</p></div>
                </div>
                <ChevronRight className="text-gray-500" />
             </Link>
        )}

        {/* Liens rapides */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <Link href="/mes-annonces" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl"><Package size={20} /></div>
                    <span className="font-bold text-gray-700">Mes Annonces</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
            </Link>
            <div className="h-px bg-gray-50 mx-4" />
            <Link href="/favoris" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group">
                <div className="flex items-center gap-4">
                    <div className="bg-pink-50 text-pink-500 p-2.5 rounded-xl"><Heart size={20} /></div>
                    <span className="font-bold text-gray-700">Mes Favoris</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
            </Link>
        </div>

        {/* Formulaire Informations */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                <h3 className="font-bold flex items-center gap-2"><User size={18} /> Informations</h3>
                {!isEditingInfo && <button onClick={() => setIsEditingInfo(true)} className="text-xs font-bold text-brand bg-brand/10 px-3 py-1.5 rounded-full">Modifier</button>}
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Nom complet</label>
                    {isEditingInfo ? <input type="text" className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none border border-gray-200" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /> : <p className="p-3 font-medium text-sm">{profile?.full_name}</p>}
                </div>

                {/* CHAMP DESCRIPTION AVEC LIMITE 500 */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">À propos / Description</label>
                    {isEditingInfo ? (
                        <div className="relative">
                            <textarea 
                                maxLength={500}
                                className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none border border-gray-200 min-h-32 resize-none" 
                                placeholder="Présentez-vous ou votre société..." 
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                            />
                            <div className={`absolute bottom-2 right-3 text-[10px] font-bold ${formData.description.length >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                                {formData.description.length} / 500
                            </div>
                        </div>
                    ) : (
                        <p className="p-3 text-sm whitespace-pre-line text-gray-700">{profile?.description || "Aucune description"}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Île</label>
                        {isEditingInfo ? (
                            <select className="w-full bg-gray-50 p-3 rounded-xl text-sm border border-gray-200" value={formData.island} onChange={e => setFormData({...formData, island: e.target.value})}>
                                <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option><option>La Réunion</option>
                            </select>
                        ) : ( <p className="p-3 text-sm">{profile?.island}</p> )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Ville</label>
                        {isEditingInfo ? <input type="text" className="w-full bg-gray-50 p-3 rounded-xl text-sm border border-gray-200" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /> : <p className="p-3 text-sm">{profile?.city}</p>}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">WhatsApp</label>
                    {isEditingInfo ? <input type="tel" className="w-full bg-gray-50 p-3 rounded-xl text-sm border border-gray-200" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /> : <p className="p-3 text-sm tracking-wide">{profile?.phone_number || "-"}</p>}
                </div>
            </div>
            {isEditingInfo && (
                <div className="flex gap-2 pt-2 animate-in fade-in">
                    <button onClick={cancelEditInfo} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-sm">Annuler</button>
                    <button onClick={handleUpdateProfile} disabled={saving} className="flex-1 bg-brand text-white font-bold py-3 rounded-xl text-sm shadow-brand/20">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
                    </button>
                </div>
            )}
        </div>

        {/* Sécurité */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                <h3 className="font-bold flex items-center gap-2"><Lock size={18} /> Sécurité</h3>
                {!isEditingPassword && <button onClick={() => setIsEditingPassword(true)} className="text-xs font-bold text-brand bg-brand/10 px-3 py-1.5 rounded-full">Modifier</button>}
            </div>
            {isEditingPassword ? (
                <form onSubmit={handleUpdatePassword} className="space-y-3 animate-in fade-in">
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Nouveau mot de passe" className="w-full bg-gray-50 p-3 rounded-xl text-sm pr-10 border border-gray-200" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setIsEditingPassword(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-sm">Annuler</button>
                        <button type="submit" disabled={passwordLoading} className="flex-1 bg-brand text-white font-bold py-3 rounded-xl text-sm">Confirmer</button>
                    </div>
                </form>
            ) : ( <p className="p-3 text-gray-500 text-sm italic">••••••••</p> )}
        </div>

        {/* Zone de Danger */}
        <div className="bg-red-50 p-5 rounded-2xl shadow-sm border border-red-100 space-y-4">
            <h3 className="font-bold text-sm text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> Zone de Danger</h3>
            <button onClick={() => setShowDeleteModal(true)} className="w-full bg-white border border-red-200 text-red-600 font-bold py-3 rounded-xl text-sm hover:bg-red-600 hover:text-white transition">Supprimer mon compte</button>
        </div>
      </div>
    </div>
  )
}