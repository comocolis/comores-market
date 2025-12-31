'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, ChangeEvent, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, LogOut, Camera, Lock, Eye, EyeOff, Loader2, ShieldCheck, 
  Pencil, Package, Heart, ChevronRight, Save, Bell,
  Facebook, Instagram, Crown, AlertTriangle, Trash2,
  Smartphone, ExternalLink, LayoutDashboard
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// --- UTILITAIRE DE REDIMENSIONNEMENT ÉLITE ---
const getOptimizedAvatar = (url: string | null, size = 200) => {
  if (!url) return null;
  if (url.includes('supabase.co')) {
    return `${url}?width=${size}&quality=80&resize=contain`;
  }
  return url;
};

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

  // RÉCUPÉRATION CHIRURGICALE DES DONNÉES
  const getProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return 
    }
    
    setUser(user) 

    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, city, island, phone_number, facebook_url, instagram_url, description, is_pro, subscription_end_date')
        .eq('id', user.id)
        .single()

    if (error) {
        toast.error("Erreur de chargement du profil");
    } else if (data) {
      setProfile(data)
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
  }, [router, supabase])

  useEffect(() => {
    getProfile()
  }, [getProfile])

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
          await handleSignOut()
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
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-brand" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans text-gray-900">
      
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowDeleteModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-600"><AlertTriangle size={32} /></div>
                  <h3 className="font-black text-xl mb-2">Clôturer le compte ?</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6 leading-relaxed">Tapez <span className="text-red-600 font-black">SUPPRIMER</span> pour confirmer</p>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-black text-center outline-none focus:ring-4 focus:ring-red-50 uppercase mb-6" placeholder="Validation" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())} />
                  <div className="flex flex-col gap-3">
                      <button onClick={confirmDeleteAccount} disabled={deleting || deleteConfirmation !== 'SUPPRIMER'} className="w-full py-4 rounded-2xl font-black text-white bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 text-[10px] uppercase tracking-widest disabled:opacity-20">Confirmer la suppression</button>
                      <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 rounded-2xl font-black text-gray-400 bg-gray-50 active:scale-95 text-[10px] uppercase tracking-widest">Annuler</button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white p-8 pb-12 rounded-b-[3.5rem] shadow-sm relative z-10 border-b border-gray-100">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black tracking-tighter">Réglages</h1>
            <div className="flex gap-2">
              <Link href={`/profil/${user?.id}`} className="bg-gray-50 p-3 rounded-2xl text-gray-400 hover:text-brand transition active:scale-90 border border-white">
                <ExternalLink size={20} />
              </Link>
              <button onClick={handleSignOut} className="bg-gray-50 p-3 rounded-2xl text-gray-400 hover:text-red-500 transition active:scale-90 border border-white">
                <LogOut size={20} />
              </button>
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                <div className={`w-24 h-24 bg-gray-100 rounded-[2.5rem] flex items-center justify-center text-brand text-3xl font-black overflow-hidden border-4 shadow-xl transition-all duration-500 ${isEditingInfo ? 'border-brand scale-105' : 'border-white'}`}>
                    {avatarUploading ? <Loader2 className="animate-spin" /> : profile?.avatar_url ? (
                      <Image 
                        src={getOptimizedAvatar(profile.avatar_url) || '/placeholder.jpg'} 
                        alt="" 
                        fill 
                        priority 
                        className="object-cover" 
                      />
                    ) : (
                      <span className="text-gray-300 font-black">{profile?.full_name?.[0] || <User size={32} />}</span>
                    )}
                    {isEditingInfo && <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center"><Camera size={24} className="text-white" /></div>}
                </div>
                <div className={`absolute -bottom-1 -right-1 p-2 rounded-xl border-4 border-white shadow-lg ${isEditingInfo ? 'bg-brand text-white' : 'bg-gray-50 text-gray-400'}`}>
                    <Pencil size={12} strokeWidth={4} />
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
            </div>
            
            <div className="flex-1 min-w-0">
                {/* ZÉRO TRANSFORMATION : Suppression de 'uppercase' */}
                <h2 className="font-black text-xl truncate tracking-tight leading-none mb-2">{profile?.full_name || "Nom du Showroom"}</h2>
                {/* ZÉRO TRANSFORMATION : Suppression de 'uppercase' */}
                <p className="text-[10px] text-gray-400 font-black truncate tracking-widest mb-3">{user?.email}</p>
                {isProActive ? (
                    <div className="inline-flex flex-col items-start bg-amber-500 text-white px-4 py-1.5 rounded-xl shadow-lg shadow-amber-500/20">
                        <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest"><Crown size={10} fill="currentColor" /> Expert Pro</span>
                    </div>
                ) : (
                    <Link href="/pro" className="inline-flex items-center gap-2 bg-gray-900 text-white text-[9px] font-black px-5 py-2.5 rounded-xl shadow-lg active:scale-95 transition uppercase tracking-[0.1em]">Prestige Pro <ChevronRight size={12} /></Link>
                )}
            </div>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-20 space-y-6">
        
        <div className="flex flex-col gap-4">
          {user?.email === ADMIN_EMAIL && (
               <Link href="/admin" className="w-full bg-gray-900 text-white p-6 rounded-[2.2rem] flex items-center justify-between shadow-2xl border border-white/10 active:scale-95 transition">
                  <div className="flex items-center gap-4">
                      <div className="bg-brand/20 p-3 rounded-2xl text-brand"><LayoutDashboard size={24} /></div>
                      <div><p className="font-black text-sm uppercase tracking-widest leading-none mb-1">Panneau Admin</p><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Gestion Plateforme</p></div>
                  </div>
                  <ChevronRight className="text-gray-600" />
               </Link>
          )}

          <Link href="/compte/notifications" className="bg-white p-6 rounded-[2.2rem] flex items-center justify-between shadow-sm border border-white active:scale-95 transition">
              <div className="flex items-center gap-4">
                  <div className="bg-amber-50 p-3 rounded-2xl text-amber-500"><Bell size={24} /></div>
                  <div><p className="font-black text-sm uppercase tracking-widest leading-none mb-1">Notifications</p><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Alertes & Messages</p></div>
              </div>
              <ChevronRight className="text-gray-200" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Link href="/mes-annonces" className="bg-white p-7 rounded-[2.2rem] shadow-sm border border-white flex flex-col gap-3 active:scale-95 transition">
                <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl w-fit"><Package size={22} /></div>
                <span className="font-black text-[9px] uppercase tracking-widest text-gray-400">Annonces</span>
            </Link>
            <Link href="/favoris" className="bg-white p-7 rounded-[2.2rem] shadow-sm border border-white flex flex-col gap-3 active:scale-95 transition">
                <div className="bg-pink-50 text-pink-500 p-3 rounded-2xl w-fit"><Heart size={22} /></div>
                <span className="font-black text-[9px] uppercase tracking-widest text-gray-400">Coups de cœur</span>
            </Link>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white space-y-8">
            <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-300">Mon Showroom</h3>
                {!isEditingInfo && (
                  <button onClick={() => setIsEditingInfo(true)} className="text-[8px] font-black text-brand bg-brand/5 px-4 py-2 rounded-full uppercase tracking-widest active:scale-90 transition">Modifier</button>
                )}
            </div>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-1">Nom public</label>
                    {isEditingInfo ? (
                      <input type="text" className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-black outline-none border border-gray-100 focus:ring-4 focus:ring-brand/5 transition" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    ) : (
                      /* ZÉRO TRANSFORMATION : Suppression de 'uppercase' */
                      <p className="p-5 bg-gray-50/50 rounded-2xl font-black text-xs tracking-tight">{profile?.full_name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-1">Bio / Slogan</label>
                    {isEditingInfo ? (
                        <textarea className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold outline-none border border-gray-100 min-h-24 resize-none" placeholder="Présentez-vous..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    ) : (
                        /* DÉJÀ SANS TRANSFORMATION */
                        <p className="p-5 bg-gray-50/50 rounded-2xl text-xs font-medium text-gray-500 leading-relaxed italic">"{profile?.description || "Aucune bio..."}"</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Île</label>
                        {isEditingInfo ? (
                            <select className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-black border border-gray-100 outline-none" value={formData.island} onChange={e => setFormData({...formData, island: e.target.value})}>
                                {['Ngazidja', 'Ndzouani', 'Mwali', 'Maore', 'La Réunion'].map(i => <option key={i}>{i}</option>)}
                            </select>
                        ) : ( 
                          /* ZÉRO TRANSFORMATION : Suppression de 'uppercase' */
                          <p className="p-4 bg-gray-50/50 rounded-2xl font-black text-[10px]">{profile?.island}</p> 
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Ville</label>
                        {isEditingInfo ? (
                          <input type="text" className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-black border border-gray-100" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                        ) : ( 
                          /* ZÉRO TRANSFORMATION : Suppression de 'uppercase' */
                          <p className="p-4 bg-gray-50/50 rounded-2xl font-black text-[10px]">{profile?.city}</p> 
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-1">WhatsApp</label>
                    {isEditingInfo ? (
                        <div className="relative">
                          <Smartphone className="absolute left-4 top-4 text-gray-300" size={16} />
                          <input type="tel" className="w-full bg-gray-50 p-4 pl-12 rounded-2xl text-xs font-black border border-gray-100" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                        </div>
                    ) : ( 
                      /* DÉJÀ SANS TRANSFORMATION */
                      <p className="p-5 bg-gray-50/50 rounded-2xl font-black text-xs tracking-[0.2em]">{profile?.phone_number || "Non renseigné"}</p> 
                    )}
                </div>
            </div>

            {isEditingInfo && (
                <div className="flex gap-3 pt-4">
                    <button onClick={cancelEditInfo} className="flex-1 bg-gray-100 text-gray-400 font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest transition">Annuler</button>
                    <button onClick={handleUpdateProfile} disabled={saving} className="flex-1 bg-brand text-white font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest shadow-xl shadow-brand/20 flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Sauvegarder</>}
                    </button>
                </div>
            )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-300 flex items-center gap-2"><Lock size={16} /> Sécurité</h3>
            {isEditingPassword ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Nouveau code secret" className="w-full bg-gray-50 p-5 rounded-2xl text-xs font-black border border-gray-100 outline-none" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-5 text-gray-300">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsEditingPassword(false)} className="flex-1 bg-gray-50 text-gray-400 font-black py-4 rounded-2xl text-[9px] uppercase">Annuler</button>
                        <button type="submit" disabled={passwordLoading} className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl text-[9px] uppercase">Mettre à jour</button>
                    </div>
                </form>
            ) : ( 
              <div className="flex justify-between items-center bg-gray-50/50 p-5 rounded-2xl border border-transparent">
                <p className="text-gray-300 tracking-[0.8em] font-black text-xs">••••••••</p>
                <button onClick={() => setIsEditingPassword(true)} className="text-[8px] font-black text-brand uppercase tracking-widest">Changer</button>
              </div>
            )}
        </div>

        <div className="bg-red-50 p-8 rounded-[2.5rem] shadow-sm border border-red-100 space-y-5">
            <h3 className="font-black text-[10px] text-red-600 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={16} /> Zone Critique</h3>
            <button onClick={() => setShowDeleteModal(true)} className="w-full bg-white border border-red-200 text-red-600 font-black py-5 rounded-[1.8rem] text-[9px] uppercase tracking-widest active:scale-95 transition shadow-sm flex items-center justify-center gap-2">
              <Trash2 size={14} /> Supprimer mon espace
            </button>
        </div>
      </div>
    </div>
  )
}