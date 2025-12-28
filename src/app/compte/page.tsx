'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, LogOut, Camera, Lock, Eye, EyeOff, Loader2, ShieldCheck, 
  Pencil, Package, Heart, ChevronRight, Save,
  Facebook, Instagram, Crown, AlertTriangle, Trash2,
  Smartphone, ExternalLink, LayoutDashboard, MapPin // Imports vérifiés ici
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
      if (!user) {
        router.push('/auth')
        return 
      }
      
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
        toast.info("Activez le mode 'Modifier' pour changer votre photo.")
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
        toast.error("Erreur d'envoi")
    } finally {
        setAvatarUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ ...formData }).eq('id', user.id)
    if (error) toast.error("Erreur de sauvegarde")
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
    if (newPassword.length < 6) return toast.warning("6 caractères minimum")
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><Loader2 className="animate-spin text-brand" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 font-sans text-gray-900">
      
      {/* MODALE SUPPRESSION */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowDeleteModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 space-y-6 text-center border border-white" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner"><AlertTriangle size={40} /></div>
                  <h3 className="font-black text-xl">Désactiver le compte ?</h3>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed">Tapez <span className="text-red-600 font-black">SUPPRIMER</span> pour confirmer la clôture de votre espace.</p>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-black text-center outline-none focus:ring-4 focus:ring-red-100 uppercase" placeholder="Confirmation" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())} />
                  <div className="flex flex-col gap-3 pt-4">
                      <button onClick={confirmDeleteAccount} disabled={deleting || deleteConfirmation !== 'SUPPRIMER'} className="w-full py-5 rounded-[1.5rem] font-black text-white bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 uppercase text-xs tracking-widest disabled:opacity-30">Supprimer définitivement</button>
                      <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 rounded-[1.5rem] font-black text-gray-400 bg-gray-50 active:scale-95 transition uppercase text-xs tracking-widest">Garder mon compte</button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER PRESTIGE */}
      <div className="bg-white p-6 pb-12 rounded-b-[3.5rem] shadow-sm relative z-10 border-b border-gray-100">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black tracking-tight">Mon Compte</h1>
            <div className="flex gap-2">
              {/* LIEN VERS PROFIL PUBLIC */}
              <Link href={`/profil/${user?.id}`} className="bg-brand/5 p-3 rounded-2xl text-brand hover:bg-brand/10 transition shadow-sm border border-brand/5 active:scale-90 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Mon Profil</span>
                <ExternalLink size={20} />
              </Link>
              <button onClick={handleSignOut} className="bg-gray-50 p-3 rounded-2xl text-gray-400 hover:text-red-500 transition shadow-sm border border-white active:scale-90"><LogOut size={20} /></button>
            </div>
        </div>

        <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <div className={`w-24 h-24 bg-brand/5 rounded-[2.2rem] flex items-center justify-center text-brand text-3xl font-black overflow-hidden border-4 shadow-xl relative transition-all duration-500 ${isEditingInfo ? 'border-brand scale-105' : 'border-white'}`}>
                    {avatarUploading ? <Loader2 className="animate-spin" /> : profile?.avatar_url ? <Image src={profile.avatar_url} alt="" fill className="object-cover" /> : profile?.full_name?.[0]?.toUpperCase() || <User size={32} />}
                    {isEditingInfo && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"><Camera size={28} className="text-white" /></div>}
                </div>
                <div className={`absolute -bottom-1 -right-1 p-2 rounded-xl border-4 border-white shadow-lg transition-colors ${isEditingInfo ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Pencil size={14} strokeWidth={3} />
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
            </div>
            
            <div className="flex-1 min-w-0">
                <h2 className="font-black text-xl truncate tracking-tight">{profile?.full_name || "Utilisateur"}</h2>
                <p className="text-xs text-gray-400 font-bold truncate mb-2 uppercase tracking-widest">{user?.email}</p>
                {isProActive ? (
                    <div className="inline-flex flex-col items-start bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 shadow-sm">
                        <span className="flex items-center gap-1.5 text-amber-600 text-[10px] font-black uppercase tracking-widest"><Crown size={12} fill="currentColor" /> Membre PRO</span>
                        <span className="text-[10px] text-amber-500/70 font-bold mt-0.5">{daysRemaining} jours restants</span>
                    </div>
                ) : (
                    <Link href="/pro" className="inline-flex items-center gap-2 bg-gray-900 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg active:scale-95 transition-transform uppercase tracking-widest">DEVENIR PRO <ChevronRight size={12} /></Link>
                )}
            </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-20 space-y-6">
        
        {/* ADMIN SHORTCUT */}
        {user?.email === ADMIN_EMAIL && (
             <Link href="/admin" className="w-full bg-gray-900 text-white p-5 rounded-[2.2rem] flex items-center justify-between shadow-xl active:scale-95 transition border border-white/10 group">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-brand/20 transition-colors"><LayoutDashboard size={24} className="text-brand" /></div>
                    <div><p className="font-black text-lg leading-tight tracking-tight">Administration</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gérer la plateforme</p></div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:translate-x-1 transition-transform" />
             </Link>
        )}

        {/* QUICK LINKS */}
        <div className="grid grid-cols-2 gap-4">
            <Link href="/mes-annonces" className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-white flex flex-col gap-4 active:scale-95 transition hover:shadow-md">
                <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl w-fit"><Package size={24} /></div>
                <span className="font-black text-xs uppercase tracking-widest text-gray-400">Mes Annonces</span>
            </Link>
            <Link href="/favoris" className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-white flex flex-col gap-4 active:scale-95 transition hover:shadow-md">
                <div className="bg-pink-50 text-pink-500 p-3 rounded-2xl w-fit"><Heart size={24} /></div>
                <span className="font-black text-xs uppercase tracking-widest text-gray-400">Mes Favoris</span>
            </Link>
        </div>

        {/* INFORMATIONS */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-white space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2"><User size={16} /> Identité & Social</h3>
                {!isEditingInfo && (
                  <button onClick={() => setIsEditingInfo(true)} className="text-[10px] font-black text-brand bg-brand/10 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-brand/20 transition">
                    Modifier le profil
                  </button>
                )}
            </div>
            
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2">Nom du Showroom</label>
                    {isEditingInfo ? (
                      <input type="text" className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold outline-none border border-gray-100 focus:ring-4 focus:ring-brand/5 transition" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    ) : (
                      <p className="p-4 bg-[#F9FAFB] rounded-2xl font-black text-sm border border-transparent">{profile?.full_name}</p>
                    )}
                </div>

                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2">Bio / Description</label>
                    {isEditingInfo ? (
                        <div className="relative">
                            <textarea maxLength={500} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold outline-none border border-gray-100 min-h-32 resize-none focus:ring-4 focus:ring-brand/5 transition" placeholder="Présentez votre boutique..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            <div className={`absolute bottom-3 right-4 text-[9px] font-black ${formData.description.length >= 500 ? 'text-red-500' : 'text-gray-300'}`}>{formData.description.length} / 500</div>
                        </div>
                    ) : (
                        <p className="p-4 bg-[#F9FAFB] rounded-2xl text-sm font-medium text-gray-600 leading-relaxed italic">"{profile?.description || "Aucune description renseignée."}"</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2">Île</label>
                        {isEditingInfo ? (
                            <select className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border border-gray-100 outline-none focus:ring-4 focus:ring-brand/5 transition appearance-none" value={formData.island} onChange={e => setFormData({...formData, island: e.target.value})}>
                                <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option><option>La Réunion</option>
                            </select>
                        ) : ( <p className="p-4 bg-[#F9FAFB] rounded-2xl font-black text-sm">{profile?.island}</p> )}
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2">Ville</label>
                        {isEditingInfo ? <input type="text" className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border border-gray-100 outline-none focus:ring-4 focus:ring-brand/5 transition" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /> : <p className="p-4 bg-[#F9FAFB] rounded-2xl font-black text-sm">{profile?.city}</p>}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2">WhatsApp / Contact</label>
                    {isEditingInfo ? (
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-4 text-gray-300" size={18} />
                        <input type="tel" className="w-full bg-gray-50 p-4 pl-12 rounded-2xl text-sm font-bold border border-gray-100 outline-none focus:ring-4 focus:ring-brand/5 transition" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                      </div>
                    ) : ( <p className="p-4 bg-[#F9FAFB] rounded-2xl font-black text-sm tracking-widest">{profile?.phone_number || "Non renseigné"}</p> )}
                </div>

                {/* SOCIALS */}
                <div className="pt-4 border-t border-gray-50 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2 flex items-center gap-2"><Facebook size={12} className="text-blue-600" /> Facebook</label>
                        {isEditingInfo ? (
                            <input type="url" placeholder="https://facebook.com/..." className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100 outline-none focus:ring-4 focus:ring-brand/5 transition" value={formData.facebook_url} onChange={e => setFormData({...formData, facebook_url: e.target.value})} />
                        ) : (
                            <p className="p-4 bg-[#F9FAFB] rounded-2xl font-bold text-xs text-blue-600 truncate">{profile?.facebook_url || "Non configuré"}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2 flex items-center gap-2"><Instagram size={12} className="text-pink-600" /> Instagram</label>
                        {isEditingInfo ? (
                            <input type="url" placeholder="https://instagram.com/..." className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100 outline-none focus:ring-4 focus:ring-brand/5 transition" value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} />
                        ) : (
                            <p className="p-4 bg-[#F9FAFB] rounded-2xl font-bold text-xs text-pink-600 truncate">{profile?.instagram_url || "Non configuré"}</p>
                        )}
                    </div>
                </div>
            </div>

            {isEditingInfo && (
                <div className="flex gap-3 pt-4 animate-in slide-in-from-bottom-2">
                    <button onClick={cancelEditInfo} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-[1.5rem] text-xs uppercase tracking-widest active:scale-95 transition">Annuler</button>
                    <button onClick={handleUpdateProfile} disabled={saving} className="flex-1 bg-brand text-white font-black py-4 rounded-[1.5rem] text-xs uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Enregistrer</>}
                    </button>
                </div>
            )}
        </div>

        {/* SÉCURITÉ */}
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-white space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2"><Lock size={16} /> Sécurité</h3>
                {!isEditingPassword && <button onClick={() => setIsEditingPassword(true)} className="text-[10px] font-black text-brand bg-brand/5 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-brand/10 transition">Modifier</button>}
            </div>
            {isEditingPassword ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4 animate-in fade-in">
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Nouveau mot de passe" className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold pr-12 border border-gray-100 outline-none focus:ring-4 focus:ring-brand/5 transition" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400 active:scale-90 transition">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsEditingPassword(false)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-[1.5rem] text-xs uppercase tracking-widest">Annuler</button>
                        <button type="submit" disabled={passwordLoading} className="flex-1 bg-gray-900 text-white font-black py-4 rounded-[1.5rem] text-xs uppercase tracking-widest shadow-lg active:scale-95 transition">Confirmer</button>
                    </div>
                </form>
            ) : ( <p className="p-4 bg-[#F9FAFB] rounded-2xl text-gray-400 text-sm tracking-[0.5em] font-black">••••••••</p> )}
        </div>

        {/* DANGER ZONE */}
        <div className="bg-red-50 p-7 rounded-[2.5rem] shadow-sm border border-red-100 space-y-5">
            <h3 className="font-black text-xs text-red-600 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={18} /> Zone de Danger</h3>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest px-1">Attention : La suppression du compte est irréversible.</p>
            <button onClick={() => setShowDeleteModal(true)} className="w-full bg-white border-2 border-red-100 text-red-600 font-black py-5 rounded-[1.8rem] text-xs uppercase tracking-widest active:scale-95 transition shadow-sm hover:bg-red-600 hover:text-white flex items-center justify-center gap-2">
              <Trash2 size={16} /> Supprimer mon compte
            </button>
        </div>
      </div>
    </div>
  )
}