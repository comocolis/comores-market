'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, LogOut, Camera, Lock, Eye, EyeOff, Loader2, ShieldCheck, 
  Pencil, Package, Heart, ChevronRight, Save,
  Facebook, Instagram, Crown, AlertTriangle, Trash2, Smartphone, 
  Globe, ShieldAlert, MapPin, Hash
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
            phone_number: profRes.data.phone_number || '', // RESTAURÉ
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
    if (error) toast.error("Erreur")
    else {
        toast.success("Modifications enregistrées")
        setIsEditingInfo(false)
        setProfile({ ...profile, ...formData })
    }
    setSaving(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.warning("6 caractères min.")
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else { toast.success("Mot de passe sécurisé"); setIsEditingPassword(false) }
    setPasswordLoading(false)
  }

  const daysRemaining = profile?.subscription_end_date 
    ? Math.ceil((new Date(profile.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : 0
  const isProActive = profile?.is_pro && daysRemaining > 0

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-brand" size={32} /></div>

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-32 font-sans text-gray-900">
      
      {/* HEADER LUXE */}
      <div className="bg-white px-8 pt-20 pb-16 rounded-b-[4rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="flex justify-between items-center mb-10 relative z-10">
            <h1 className="text-4xl font-black tracking-tighter">Profil</h1>
            <button onClick={handleSignOut} className="p-4 bg-gray-50 text-gray-400 rounded-[1.5rem] active:scale-90 transition border border-gray-100"><LogOut size={22} /></button>
        </div>

        <div className="flex flex-col items-center text-center relative z-10">
            <div className="relative mb-6" onClick={() => isEditingInfo && fileInputRef.current?.click()}>
                <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center overflow-hidden border-[6px] shadow-2xl transition-all duration-700 ${isEditingInfo ? 'border-brand scale-105' : 'border-white'}`}>
                    {avatarUploading ? <Loader2 className="animate-spin" /> : profile?.avatar_url ? <Image src={profile.avatar_url} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><User size={48} /></div>}
                    {isEditingInfo && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"><Camera size={32} className="text-white" /></div>}
                </div>
                {isEditingInfo && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -bottom-1 -right-1 p-3 bg-brand text-white rounded-2xl border-4 border-white shadow-xl"><Pencil size={16} strokeWidth={3} /></motion.div>}
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
            </div>
            
            <h2 className="font-black text-2xl tracking-tight mb-1">{profile?.full_name || "Utilisateur"}</h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mb-6">{user?.email}</p>
            
            <div className="flex gap-3">
                {!isEditingInfo && <button onClick={() => setIsEditingInfo(true)} className="px-6 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition">Modifier le compte</button>}
                <Link href={`/profil/${user?.id}`} className="px-6 py-3 bg-white text-brand text-[10px] font-black uppercase tracking-widest rounded-2xl border border-brand/20 shadow-sm active:scale-95 transition">Aperçu Public</Link>
            </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-8">
        
        {/* CARTE PRO : BLACK & GOLD EDITION */}
        {isProActive ? (
            <div className="bg-neutral-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10 group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Crown size={140} className="text-amber-500" /></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                        <Crown size={20} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Prestige Member</span>
                    </div>
                    <p className="text-white font-black text-2xl mb-1 tracking-tight">Vendeur Professionnel</p>
                    <div className="inline-block bg-white/5 px-3 py-1 rounded-lg border border-white/10 mt-2">
                       <p className="text-amber-500/80 text-[10px] font-bold uppercase tracking-widest">{daysRemaining} jours restants</p>
                    </div>
                </div>
            </div>
        ) : (
            <Link href="/pro" className="block bg-white p-8 rounded-[3rem] shadow-sm border border-brand/10 relative group transition-all hover:shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="bg-brand/10 p-4 rounded-[1.5rem] text-brand"><Crown size={28} /></div>
                        <div>
                            <p className="font-black text-gray-400 uppercase text-[9px] tracking-widest mb-1">Accès illimité</p>
                            <p className="font-black text-xl text-brand tracking-tight">Passer au Statut PRO</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-brand/5 rounded-full flex items-center justify-center text-brand group-hover:translate-x-1 transition-transform"><ChevronRight size={20} /></div>
                </div>
            </Link>
        )}

        {/* DASHBOARD ANALYTICS */}
        <div className="grid grid-cols-2 gap-5">
            <Link href="/mes-annonces" className="bg-white p-7 rounded-[3rem] shadow-sm border border-white flex flex-col gap-5 group active:scale-95 transition-all">
                <div className="flex justify-between items-center">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl group-hover:scale-110 transition-transform"><Package size={24} /></div>
                    <span className="text-3xl font-black text-gray-900 tracking-tighter">{counts.products}</span>
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">Annonces actives</span>
            </Link>
            <Link href="/favoris" className="bg-white p-7 rounded-[3rem] shadow-sm border border-white flex flex-col gap-5 group active:scale-95 transition-all">
                <div className="flex justify-between items-center">
                    <div className="bg-pink-50 text-pink-500 p-3 rounded-2xl group-hover:scale-110 transition-transform"><Heart size={24} /></div>
                    <span className="text-3xl font-black text-gray-900 tracking-tighter">{counts.favorites}</span>
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">Mes Favoris</span>
            </Link>
        </div>

        {/* SECTION : CARTE D'IDENTITÉ & CONTACT */}
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-white space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-300 flex items-center gap-3"><Globe size={14} /> Identité & Showroom</h3>
                {isEditingInfo && <span className="bg-brand/10 text-brand text-[8px] font-black px-2 py-1 rounded-full uppercase">Édition active</span>}
            </div>
            
            <div className="space-y-6">
                {/* NOM */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Dénomination</label>
                    {isEditingInfo ? (
                      <input type="text" className="w-full bg-gray-50 p-5 rounded-2xl text-sm font-bold outline-none border border-transparent focus:bg-white focus:border-brand/20 transition-all" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    ) : (
                      <div className="p-5 bg-gray-50/50 rounded-2xl font-black text-sm text-gray-800">{profile?.full_name}</div>
                    )}
                </div>

                {/* WHATSAPP (RESTAURÉ) */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Contact WhatsApp</label>
                    {isEditingInfo ? (
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-5 text-gray-300" size={18} />
                        <input type="tel" className="w-full bg-gray-50 p-5 pl-12 rounded-2xl text-sm font-bold border border-transparent focus:bg-white focus:border-brand/20 transition-all" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                      </div>
                    ) : (
                      <div className="p-5 bg-gray-50/50 rounded-2xl font-black text-sm text-gray-800 flex items-center gap-3">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                         {profile?.phone_number || "Aucun numéro"}
                      </div>
                    )}
                </div>

                {/* BIO */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Description Showroom</label>
                    {isEditingInfo ? (
                        <div className="relative">
                            <textarea maxLength={500} className="w-full bg-gray-50 p-5 rounded-2xl text-sm font-bold outline-none border border-transparent focus:bg-white focus:border-brand/20 min-h-32 resize-none transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            <div className="absolute bottom-3 right-4 text-[9px] font-black text-gray-300">{formData.description.length}/500</div>
                        </div>
                    ) : (
                        <p className="p-6 bg-gray-50/50 rounded-2xl text-sm font-medium text-gray-500 italic leading-relaxed border border-gray-100">"{profile?.description || "Ajoutez une description pour inspirer confiance à vos acheteurs..."}"</p>
                    )}
                </div>

                {/* RÉGION & VILLE */}
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Île</label>
                        {isEditingInfo ? (
                            <select className="w-full bg-gray-50 p-5 rounded-2xl text-sm font-bold border border-transparent focus:bg-white focus:border-brand/20 outline-none appearance-none" value={formData.island} onChange={e => setFormData({...formData, island: e.target.value})}>
                                <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option><option>La Réunion</option>
                            </select>
                        ) : ( <div className="p-5 bg-gray-50/50 rounded-2xl font-black text-sm text-gray-800 flex items-center gap-2"><MapPin size={14} className="text-brand" /> {profile?.island}</div> )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Ville</label>
                        {isEditingInfo ? <input type="text" className="w-full bg-gray-50 p-5 rounded-2xl text-sm font-bold border border-transparent focus:bg-white focus:border-brand/20 outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /> : <div className="p-5 bg-gray-50/50 rounded-2xl font-black text-sm text-gray-800">{profile?.city}</div>}
                    </div>
                </div>

                {/* SOCIALS */}
                <div className="pt-6 border-t border-gray-50 space-y-5">
                    <h4 className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Connectivité</h4>
                    <div>
                        <div className="flex items-center gap-2 mb-2 ml-1">
                            <Facebook size={14} className="text-blue-600" />
                            <span className="text-[10px] font-black text-gray-400 uppercase">Page Facebook</span>
                        </div>
                        {isEditingInfo ? (
                            <input type="url" placeholder="Lien..." className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:bg-white focus:border-brand/20 outline-none" value={formData.facebook_url} onChange={e => setFormData({...formData, facebook_url: e.target.value})} />
                        ) : (
                            <div className="p-4 bg-gray-50/50 rounded-2xl text-xs font-bold text-blue-600 truncate">{profile?.facebook_url || "Non configuré"}</div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2 ml-1">
                            <Instagram size={14} className="text-pink-600" />
                            <span className="text-[10px] font-black text-gray-400 uppercase">Compte Instagram</span>
                        </div>
                        {isEditingInfo ? (
                            <input type="url" placeholder="Lien..." className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:bg-white focus:border-brand/20 outline-none" value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} />
                        ) : (
                            <div className="p-4 bg-gray-50/50 rounded-2xl text-xs font-bold text-pink-600 truncate">{profile?.instagram_url || "Non configuré"}</div>
                        )}
                    </div>
                </div>
            </div>

            {isEditingInfo && (
                <div className="flex gap-4 pt-4 animate-in slide-in-from-bottom-2">
                    <button onClick={() => setIsEditingInfo(false)} className="flex-1 bg-gray-100 text-gray-500 font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest active:scale-95 transition">Annuler</button>
                    <button onClick={handleUpdateProfile} disabled={saving} className="flex-1 bg-brand text-white font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest shadow-2xl shadow-brand/30 active:scale-95 transition flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Enregistrer</>}
                    </button>
                </div>
            )}
        </div>

        {/* SECTION : SÉCURITÉ */}
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-white space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-300 flex items-center gap-3"><Lock size={14} /> Accès Privé</h3>
            {!isEditingPassword ? (
                <button onClick={() => setIsEditingPassword(true)} className="w-full flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl border border-gray-100 group active:scale-95 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm"><Lock size={18} className="text-gray-400" /></div>
                        <span className="font-black text-sm text-gray-700">Sécurité du mot de passe</span>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>
            ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4 animate-in fade-in">
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Nouveau mot de passe" className="w-full bg-gray-50 p-5 rounded-2xl text-sm font-bold pr-14 border border-transparent focus:bg-white focus:border-brand/20 transition-all" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-5 text-gray-400 active:scale-90 transition">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsEditingPassword(false)} className="flex-1 bg-gray-50 text-gray-400 font-black py-4 rounded-2xl text-xs">Annuler</button>
                        <button type="submit" disabled={passwordLoading} className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest">{passwordLoading ? <Loader2 className="animate-spin" /> : "Confirmer"}</button>
                    </div>
                </form>
            )}
        </div>

        {/* ADMIN SHORTCUT (Luxe Style) */}
        {user?.email === ADMIN_EMAIL && (
             <Link href="/admin" className="w-full bg-gradient-to-r from-gray-900 to-black text-white p-7 rounded-[3rem] flex items-center justify-between shadow-2xl active:scale-95 transition-all group border border-white/5">
                <div className="flex items-center gap-5">
                    <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-brand/20 transition-colors"><LayoutDashboard size={28} className="text-brand" /></div>
                    <div>
                      <p className="font-black text-lg tracking-tight leading-none">Console Admin</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">Gestion Globale</p>
                    </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:translate-x-2 transition-transform duration-500" />
             </Link>
        )}

        {/* DANGER ZONE */}
        <div className="bg-red-50 p-8 rounded-[3.5rem] shadow-inner border border-red-100 space-y-5">
            <div className="flex items-center gap-2 text-red-600 mb-2">
                <ShieldAlert size={20} />
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em]">Zone Critique</h3>
            </div>
            <p className="text-[11px] text-red-400/80 font-bold leading-relaxed px-1">La suppression est définitive. Vous perdrez l'accès à vos annonces, messages et statistiques PRO.</p>
            <button onClick={() => setShowDeleteModal(true)} className="w-full bg-white border-2 border-red-100 text-red-600 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-[0.2em] active:scale-95 transition shadow-sm hover:bg-red-600 hover:text-white flex items-center justify-center gap-2">
              <Trash2 size={16} /> Supprimer mon compte
            </button>
        </div>

      </div>

      {/* MODALE DE SUPPRESSION */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowDeleteModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3.5rem] p-12 space-y-8 text-center shadow-2xl border border-white" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner"><AlertTriangle size={48} /></div>
                  <h3 className="font-black text-2xl tracking-tighter">Confirmation</h3>
                  <p className="text-sm text-gray-400 font-medium">Pour valider la clôture, tapez <span className="text-red-600 font-black">SUPPRIMER</span> ci-dessous.</p>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm font-black text-center outline-none focus:ring-4 focus:ring-red-100 uppercase" placeholder="Tapez ici" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())} />
                  <div className="flex flex-col gap-3 pt-4">
                      <button onClick={confirmDeleteAccount} disabled={deleting || deleteConfirmation !== 'SUPPRIMER'} className="w-full py-5 rounded-[2rem] font-black text-white bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition uppercase text-[10px] tracking-widest disabled:opacity-30">Clôturer mon showroom</button>
                      <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 rounded-[2rem] font-black text-gray-400 bg-gray-50 active:scale-95 transition uppercase text-[10px] tracking-widest">Garder mon compte</button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}