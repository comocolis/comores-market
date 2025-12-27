'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, LogOut, Camera, Lock, Eye, EyeOff, Loader2, ShieldCheck, 
  PenSquare, X, LayoutDashboard, Pencil, Package, Heart, ChevronRight, Save,
  Facebook, Instagram, Crown, AlertTriangle, Trash2, Smartphone, Settings,
  Globe, ShieldAlert
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
  const [counts, setCounts] = useState({ products: 0, favorites: 0 })
  
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
    const getInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUser(user) 

      // Récupération simultanée du profil et des statistiques
      const [profRes, prodRes, favRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('products').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', user.id)
      ])

      if (profRes.data) {
        setProfile(profRes.data)
        setFormData({
            full_name: profRes.data.full_name || '',
            city: profRes.data.city || '',
            island: profRes.data.island || 'Ngazidja',
            phone_number: profRes.data.phone_number || '',
            facebook_url: profRes.data.facebook_url || '',
            instagram_url: profRes.data.instagram_url || '',
            description: profRes.data.description || '' 
        })
      }
      setCounts({ products: prodRes.count || 0, favorites: favRes.count || 0 })
      setLoading(false)
    }
    getInitialData()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const confirmDeleteAccount = async () => {
      if (deleteConfirmation !== 'SUPPRIMER') { toast.error("Mot-clé incorrect"); return }
      setDeleting(true)
      const { error } = await supabase.rpc('delete_own_account')
      if (error) { toast.error(error.message); setDeleting(false) } 
      else { toast.success("Compte supprimé."); await supabase.auth.signOut(); router.push('/') }
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setAvatarUploading(true)
    try {
        const fileName = `${user.id}-${Date.now()}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
        setProfile({ ...profile, avatar_url: publicUrl })
        toast.success("Photo mise à jour")
    } catch (e) { toast.error("Erreur d'envoi") } finally { setAvatarUploading(false) }
  }

  const handleUpdateProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ ...formData }).eq('id', user.id)
    if (error) toast.error("Erreur lors de la sauvegarde")
    else {
        toast.success("Profil mis à jour")
        setIsEditingInfo(false)
        setProfile({ ...profile, ...formData })
    }
    setSaving(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.warning("6 caractères minimum")
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else { toast.success("Mot de passe modifié"); setIsEditingPassword(false) }
    setPasswordLoading(false)
  }

  const daysRemaining = profile?.subscription_end_date 
    ? Math.ceil((new Date(profile.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : 0
  const isProActive = profile?.is_pro && daysRemaining > 0

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-brand" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24 font-sans text-gray-900">
      
      {/* HEADER : ÉLÉGANCE ET STATUT */}
      <div className="bg-white px-6 pt-16 pb-12 rounded-b-[3.5rem] shadow-sm border-b border-gray-100 relative">
        <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">Mon Espace</h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Tableau de bord personnel</p>
            </div>
            <button onClick={handleSignOut} className="p-3 bg-red-50 text-red-500 rounded-2xl active:scale-90 transition shadow-sm border border-red-100"><LogOut size={20} /></button>
        </div>

        <div className="flex items-center gap-6">
            <div className="relative group" onClick={() => isEditingInfo && fileInputRef.current?.click()}>
                <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 shadow-2xl transition-all duration-500 ${isEditingInfo ? 'border-brand scale-105' : 'border-white'}`}>
                    {avatarUploading ? <Loader2 className="animate-spin" /> : profile?.avatar_url ? <Image src={profile.avatar_url} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><User size={40} /></div>}
                    {isEditingInfo && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"><Camera size={28} className="text-white" /></div>}
                </div>
                {isEditingInfo && <div className="absolute -bottom-1 -right-1 p-2 bg-brand text-white rounded-xl border-4 border-white shadow-lg"><Pencil size={14} strokeWidth={3} /></div>}
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
            </div>
            
            <div className="flex-1">
                <h2 className="font-black text-2xl tracking-tight">{profile?.full_name || "Utilisateur"}</h2>
                <p className="text-sm text-gray-400 font-medium mb-3">{user?.email}</p>
                <div className="flex gap-2">
                    {!isEditingInfo && <button onClick={() => setIsEditingInfo(true)} className="px-4 py-2 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-200">Modifier</button>}
                    <Link href={`/profil/${user?.id}`} className="px-4 py-2 bg-white text-brand text-[10px] font-black uppercase tracking-widest rounded-lg border border-brand/20 shadow-sm">Voir Profil Public</Link>
                </div>
            </div>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-20 space-y-6">
        
        {/* CARTE DE MEMBRE PRO (STYLE GOLD/DARK) */}
        {isProActive ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/10 group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700"><Crown size={120} className="text-amber-500" /></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                        <Crown size={18} fill="currentColor" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Membre Prestige</span>
                    </div>
                    <p className="text-white font-black text-xl mb-1">Vendeur Professionnel</p>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Expire dans {daysRemaining} jours</p>
                </div>
            </motion.div>
        ) : (
            <Link href="/pro" className="block bg-white p-6 rounded-[2.5rem] shadow-sm border border-brand/20 relative group overflow-hidden">
                <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand/10 p-3 rounded-2xl text-brand"><Crown size={24} /></div>
                        <div>
                            <p className="font-black text-gray-900 uppercase text-[10px] tracking-widest mb-0.5">Offre Exclusive</p>
                            <p className="font-bold text-lg text-brand tracking-tight">Devenir Vendeur PRO</p>
                        </div>
                    </div>
                    <ChevronRight className="text-brand group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>
        )}

        {/* SECTION : ACTIVITÉ */}
        <div className="grid grid-cols-2 gap-4">
            <Link href="/mes-annonces" className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-white flex flex-col gap-4 active:scale-95 transition-all">
                <div className="flex justify-between items-start">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl"><Package size={24} /></div>
                    <span className="text-2xl font-black text-gray-900">{counts.products}</span>
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">Annonces</span>
            </Link>
            <Link href="/favoris" className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-white flex flex-col gap-4 active:scale-95 transition-all">
                <div className="flex justify-between items-start">
                    <div className="bg-pink-50 text-pink-500 p-3 rounded-2xl"><Heart size={24} /></div>
                    <span className="text-2xl font-black text-gray-900">{counts.favorites}</span>
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">Mes Favoris</span>
            </Link>
        </div>

        {/* SECTION : INFORMATIONS PUBLIQUES */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-white space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-300 border-b border-gray-50 pb-4 flex items-center gap-2"><Globe size={14} /> Identité Publique</h3>
            
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
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2">Description / Bio</label>
                    {isEditingInfo ? (
                        <div className="relative">
                            <textarea maxLength={500} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold outline-none border border-gray-100 min-h-32 resize-none focus:ring-4 focus:ring-brand/5 transition" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            <div className={`absolute bottom-3 right-4 text-[9px] font-black ${formData.description.length >= 500 ? 'text-red-500' : 'text-gray-300'}`}>{formData.description.length} / 500</div>
                        </div>
                    ) : (
                        <p className="p-5 bg-gray-50/50 rounded-2xl text-sm font-medium text-gray-600 italic leading-relaxed border border-gray-50">"{profile?.description || "Racontez votre histoire en quelques mots..."}"</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">Région</label>
                        {isEditingInfo ? (
                            <select className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border border-gray-100 outline-none" value={formData.island} onChange={e => setFormData({...formData, island: e.target.value})}>
                                <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option><option>La Réunion</option>
                            </select>
                        ) : ( <p className="p-4 bg-gray-50/50 rounded-2xl font-black text-sm">{profile?.island}</p> )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">Ville</label>
                        {isEditingInfo ? <input type="text" className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border border-gray-100 outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /> : <p className="p-4 bg-gray-50/50 rounded-2xl font-black text-sm">{profile?.city}</p>}
                    </div>
                </div>

                {/* RÉSEAUX SOCIAUX RESTAURÉS */}
                <div className="pt-4 border-t border-gray-50 space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 flex items-center gap-2 mb-2"><Facebook size={12} className="text-blue-600" /> Facebook</label>
                        {isEditingInfo ? (
                            <input type="url" placeholder="https://facebook.com/..." className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100" value={formData.facebook_url} onChange={e => setFormData({...formData, facebook_url: e.target.value})} />
                        ) : (
                            <p className="p-4 bg-gray-50/50 rounded-2xl text-xs font-bold text-blue-600 truncate">{profile?.facebook_url || "Non renseigné"}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 flex items-center gap-2 mb-2"><Instagram size={12} className="text-pink-600" /> Instagram</label>
                        {isEditingInfo ? (
                            <input type="url" placeholder="https://instagram.com/..." className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100" value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} />
                        ) : (
                            <p className="p-4 bg-gray-50/50 rounded-2xl text-xs font-bold text-pink-600 truncate">{profile?.instagram_url || "Non renseigné"}</p>
                        )}
                    </div>
                </div>
            </div>

            {isEditingInfo && (
                <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsEditingInfo(false)} className="flex-1 bg-gray-50 text-gray-400 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition">Annuler</button>
                    <button onClick={handleUpdateProfile} disabled={saving} className="flex-1 bg-brand text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-brand/20 transition flex items-center justify-center gap-2">{saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Enregistrer</>}</button>
                </div>
            )}
        </div>

        {/* SECTION : SÉCURITÉ PRIVÉE */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-white space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-300 border-b border-gray-50 pb-4 flex items-center gap-2"><Lock size={14} /> Sécurité</h3>
            {!isEditingPassword ? (
                <button onClick={() => setIsEditingPassword(true)} className="w-full flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl border border-gray-100"><Lock size={16} className="text-gray-400" /></div>
                        <span className="font-bold text-sm text-gray-700">Changer de mot de passe</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>
            ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4 animate-in fade-in">
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Nouveau mot de passe" className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold pr-12 border border-gray-100 focus:ring-4 focus:ring-brand/5" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400 active:scale-90 transition">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsEditingPassword(false)} className="flex-1 bg-gray-50 text-gray-400 font-black py-4 rounded-2xl text-xs">Annuler</button>
                        <button type="submit" disabled={passwordLoading} className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest">{passwordLoading ? <Loader2 className="animate-spin" /> : "Confirmer"}</button>
                    </div>
                </form>
            )}
        </div>

        {/* SECTION : ZONE DANGER */}
        <div className="bg-red-50 p-8 rounded-[3rem] shadow-inner border border-red-100 space-y-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
                <ShieldAlert size={18} />
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em]">Zone Critique</h3>
            </div>
            <p className="text-[11px] text-red-400 font-medium leading-relaxed px-1">La suppression de votre compte est définitive. Toutes vos annonces et données seront effacées immédiatement.</p>
            <button onClick={() => setShowDeleteModal(true)} className="w-full bg-white border-2 border-red-100 text-red-600 font-black py-5 rounded-[1.8rem] text-xs uppercase tracking-widest active:scale-95 transition shadow-sm hover:bg-red-600 hover:text-white flex items-center justify-center gap-2">
              <Trash2 size={16} /> Supprimer le compte
            </button>
        </div>

        {/* ADMIN SHORTCUT */}
        {user?.email === ADMIN_EMAIL && (
             <Link href="/admin" className="w-full bg-gray-900 text-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl active:scale-95 transition border border-white/10 group">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-brand/20 transition-colors"><LayoutDashboard size={24} className="text-brand" /></div>
                    <div><p className="font-black text-lg leading-tight tracking-tight">Administration</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gérer la plateforme</p></div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:translate-x-1 transition-transform" />
             </Link>
        )}

      </div>

      {/* MODALE DE SUPPRESSION (UPGRADED) */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowDeleteModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] p-10 space-y-6 text-center shadow-2xl border border-white" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner"><AlertTriangle size={40} /></div>
                  <h3 className="font-black text-2xl tracking-tight">Suppression</h3>
                  <p className="text-sm text-gray-400 font-medium">Tapez <span className="text-red-600 font-black">SUPPRIMER</span> pour confirmer la clôture définitive de votre espace.</p>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-black text-center outline-none focus:ring-4 focus:ring-red-100 uppercase" placeholder="Mot-clé" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())} />
                  <div className="flex flex-col gap-3 pt-4">
                      <button onClick={confirmDeleteAccount} disabled={deleting || deleteConfirmation !== 'SUPPRIMER'} className="w-full py-5 rounded-[1.5rem] font-black text-white bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 uppercase text-xs tracking-widest disabled:opacity-30">Confirmer la suppression</button>
                      <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 rounded-[1.5rem] font-black text-gray-400 bg-gray-50 active:scale-95 transition uppercase text-xs tracking-widest">Annuler</button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}