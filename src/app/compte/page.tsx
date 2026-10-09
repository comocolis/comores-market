'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, ChangeEvent, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, LogOut, Camera, Lock, Eye, EyeOff, Loader2, 
  Pencil, Package, Heart, ChevronRight, Save, Bell,
  Crown, AlertTriangle, Trash2, Smartphone, ExternalLink, 
  LayoutDashboard, HelpCircle, FileText, ShieldCheck, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { UiButton, UiInput, UiSelect, UiTextarea } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'
import { generatePROReceipt } from '@/utils/generateReceipt'
import { containsContactInfo } from '@/utils/contentSafety'

const getOptimizedAvatar = (url: string | null, size = 200) => {
  if (!url) return null;
  if (url.includes('supabase.co')) {
    return `${url}?width=${size}&quality=80&resize=contain`;
  }
  return url;
};

function ReadField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 wrap-break-word">{children}</p>
    </div>
  )
}

export default function ComptePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [unreadCount, setUnreadCount] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState(0)

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
    island: '', // Modification : chaîne vide par défaut au lieu de 'Ngazidja'
    phone_number: '',
    facebook_url: '',
    instagram_url: '',
    description: '' 
  })

  const getProfile = useCallback(async () => {
    try {
        const { data, error } = await supabase.auth.getUser()
        if (error || !data?.user) {
          router.push('/auth')
          return 
        }
        
        setUser(data.user) 

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*') 
            .eq('id', data.user.id)
            .single()
            
        if (profileError && profileError.code !== 'PGRST116') {
             console.error("Erreur profil:", profileError)
        }

        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', data.user.id)
            .eq('is_read', false)
        
        if (count) setUnreadCount(count)

        if (profileData) {
          setProfile(profileData)
          setFormData({
              full_name: profileData.full_name || '',
              city: profileData.city || '',
              island: profileData.island || '', // Modification : fallback sur une chaîne vide
              phone_number: profileData.phone_number || '',
              facebook_url: profileData.facebook_url || '',
              instagram_url: profileData.instagram_url || '',
              description: profileData.description || '' 
          })

          // Calcul sécurisé des jours restants côté client uniquement
          if (profileData.subscription_end_date) {
            const days = Math.ceil((new Date(profileData.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
            setDaysRemaining(days > 0 ? days : 0)
          }
        }
    } catch (e) {
        console.error("Erreur chargement:", e)
    } finally {
        loading && setLoading(false)
    }
  }, [router, supabase, loading])

  useEffect(() => {
    getProfile()
  }, [getProfile])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const confirmDeleteAccount = async () => {
      if (deleteConfirmation !== 'SUPPRIMER') {
          toast.error("Mot-clé incorrect")
          return
      }
      setDeleting(true)

      try {
          // Purge des fichiers + suppression du compte : fait cote serveur.
          const response = await fetch('/api/account/delete', { method: 'POST' })
          const data = await response.json().catch(() => ({}))

          if (!response.ok) {
              toast.error(data?.error ? "Erreur : " + data.error : "La suppression a échoué.")
              setDeleting(false)
              return
          }

          if (data?.purgeWarning) {
              console.warn("Purge des fichiers partielle :", data.purgeWarning)
          }

          toast.success("Votre compte et vos fichiers ont été supprimés.")
          try {
            const { error: signOutError } = await supabase.auth.signOut()
            if (signOutError) console.error("Erreur déconnexion après suppression", signOutError)
          } catch (signOutError) {
            console.error("Erreur déconnexion après suppression", signOutError)
          }

          window.location.replace('/auth')
      } catch (error) {
          console.error("Erreur suppression du compte", error)
          toast.error("Erreur réseau, réessaie.")
          setDeleting(false)
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
        
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id)

        if (profileUpdateError) throw profileUpdateError
        
        await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
        
        setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }))
        toast.success("Photo mise à jour !")
    } catch (error: any) {
        toast.error("Erreur d'envoi de l'image")
    } finally {
        setAvatarUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    const isProActive = profile?.is_pro && daysRemaining > 0

    if (!isProActive && containsContactInfo(formData.description)) {
        toast.error("⚠️ Les numéros et liens en bio sont réservés aux membres Pro.", { duration: 5000 })
        return;
    }

    setSaving(true)

    const { error: rpcError } = await supabase.rpc('update_profile', {
        p_full_name: formData.full_name,
        p_city: formData.city,
        p_island: formData.island,
        p_phone_number: formData.phone_number,
        p_facebook_url: formData.facebook_url,
        p_instagram_url: formData.instagram_url,
        p_description: formData.description
    })

    if (rpcError) {
        const { error: tableError } = await supabase.from('profiles').update({ ...formData }).eq('id', user.id)
        if (tableError) {
            toast.error("Erreur de sauvegarde")
            setSaving(false)
            return
        }
    }

    await supabase.auth.updateUser({
        data: { 
            full_name: formData.full_name,
            city: formData.city,
            island: formData.island,
            phone_number: formData.phone_number,
            facebook_url: formData.facebook_url,
            instagram_url: formData.instagram_url,
            description: formData.description
        }
    })

    toast.success("Profil sauvegardé avec succès !")
    setIsEditingInfo(false)
    setProfile({ ...profile, ...formData })
    router.refresh()
    setSaving(false)
  }

  const cancelEditInfo = () => {
    setFormData({
        full_name: profile?.full_name || '',
        city: profile?.city || '',
        island: profile?.island || '', // Modification : fallback sur une chaîne vide
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

  const isProActive = profile?.is_pro && daysRemaining > 0
  const isGoogleUser = user?.app_metadata?.provider === 'google'

  const getSubscriptionType = (endDate: string) => {
      if (!endDate) return "Standard"
      const end = new Date(endDate)
      const now = new Date()
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24))
      return diffDays > 40 ? "Abonnement Annuel" : "Abonnement Mensuel"
  }

  const downloadMyInvoice = () => {
      if (!profile) return;
      const subType = getSubscriptionType(profile.subscription_end_date);
      
      generatePROReceipt({
          full_name: profile.full_name || "Client",
          email: profile.email || user?.email || "",
          date: new Date().toISOString(),
          description: subType,
          customEndDate: profile.subscription_end_date
      });
  }

  const canAccessAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-brand" size={32} /></div>

  return (
    <div className="min-h-dvh w-full bg-[#F8FAFC] pb-32 font-sans text-gray-900 overflow-x-hidden relative">
      
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-200 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowDeleteModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-600"><AlertTriangle size={28} /></div>
                  <h3 className="font-black text-xl mb-1">Clôturer le compte ?</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-5 leading-relaxed">Tapez <span className="text-red-600 font-black">SUPPRIMER</span> pour confirmer</p>
                  <UiInput aria-label="Confirmation de suppression" wrapperClassName="mb-5" className="text-center font-black uppercase" placeholder="Validation" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())} />
                  <div className="flex flex-col gap-2.5">
                      <UiButton variant="danger" onClick={confirmDeleteAccount} loading={deleting} disabled={deleteConfirmation !== 'SUPPRIMER'} className="w-full uppercase tracking-widest text-xs">Confirmer la suppression</UiButton>
                      <UiButton variant="secondary" onClick={() => setShowDeleteModal(false)} className="w-full uppercase tracking-widest text-xs">Annuler</UiButton>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 pb-10 rounded-b-[2.5rem] shadow-sm relative z-10 border-b border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black tracking-tighter">Réglages</h1>
            
            <div className="flex gap-2">
              <Link 
                href={`/profil?id=${user?.id}`} 
                className="bg-blue-50 p-3 rounded-xl text-blue-600 border border-blue-100 transition hover:bg-blue-100 active:scale-90 shadow-sm"
              >
                <ExternalLink size={18} />
              </Link>
              <button 
                onClick={handleSignOut}
                aria-label="Se déconnecter"
                className="bg-red-50 p-3 rounded-xl text-red-600 border border-red-100 transition hover:bg-red-100 active:scale-90 shadow-sm"
              >
                <LogOut size={18} />
              </button>
            </div>
        </div>

        <div className="flex items-center gap-5">
            <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                <div className={`relative w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-brand text-2xl font-black overflow-hidden border-4 shadow-md transition-all duration-300 ${isEditingInfo ? 'border-brand scale-105' : 'border-white'}`}>
                    {avatarUploading ? <Loader2 className="animate-spin" /> : profile?.avatar_url ? (
                      <Image 
                        src={getOptimizedAvatar(profile.avatar_url) || '/placeholder.jpg'} 
                        alt={`Photo de profil de ${profile?.full_name || 'l\'utilisateur'}`}
                        fill 
                        sizes="(max-width: 768px) 100vw, 200px" 
                        priority 
                        className="object-cover" 
                      />
                    ) : (
                      <span className="text-gray-300 font-black">{profile?.full_name?.[0] || <User size={28} />}</span>
                    )}
                    {isEditingInfo && <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center"><Camera size={20} className="text-white" /></div>}
                </div>
                <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-lg border-2 border-white shadow-md transition ${isEditingInfo ? 'bg-brand text-white' : 'bg-gray-50 text-gray-500'}`}>
                    <Pencil size={10} strokeWidth={4} />
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} aria-label="Sélectionnez une photo de profil" />
            </div>
            
            <div className="flex-1 min-w-0">
                <h2 className="font-black text-lg truncate tracking-tight leading-none mb-1.5">{profile?.full_name || "Nom du Showroom"}</h2>
                <p className="text-[11px] text-gray-500 font-bold truncate tracking-wider mb-2.5">{user?.email}</p>
                {isProActive ? (
                    <div className="flex flex-col items-start gap-1.5">
                        <div className="inline-flex flex-col items-start bg-linear-to-r from-amber-500 to-orange-500 text-white px-3.5 py-1 rounded-xl shadow-md shadow-amber-500/10">
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><Crown size={9} fill="currentColor" /> Expert Pro</span>
                        </div>
                        <button 
                            onClick={downloadMyInvoice}
                            className="flex items-center gap-1 text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-100 transition active:scale-95"
                        >
                            <FileText size={10} /> Ma Facture
                        </button>
                    </div>
                ) : (
                    <Link href="/pro" className="group inline-flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-black px-4 py-2.5 rounded-xl shadow-md shadow-gray-900/10 active:scale-95 transition-all hover:bg-black border border-gray-800">
                        Devenir Pro 
                        <Sparkles size={10} className="text-amber-400 group-hover:animate-pulse" />
                    </Link>
                )}
            </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-20 space-y-4">
        
        <div className="flex flex-col gap-3">
          {canAccessAdmin && (
               <Link href="/admin" className="w-full bg-gray-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-lg border border-white/5 active:scale-98 transition">
                  <div className="flex items-center gap-3">
                      <div className="bg-brand/10 p-2.5 rounded-xl text-brand"><LayoutDashboard size={20} /></div>
                      <div><p className="font-black text-xs uppercase tracking-wider leading-none mb-1">Panneau Admin</p><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gestion Plateforme</p></div>
                  </div>
                  <ChevronRight size={18} className="text-gray-600" />
               </Link>
          )}

          <Link href="/compte/notifications" className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100/50 active:scale-98 transition">
              <div className="flex items-center gap-3">
                  <div className="bg-amber-50 p-2.5 rounded-xl text-amber-500 relative">
                      <Bell size={20} />
                      {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                              {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                      )}
                  </div>
                  <div><p className="font-black text-xs uppercase tracking-wider leading-none mb-1">Notifications</p><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Alertes & Messages</p></div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <Link href="/mes-annonces" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col gap-2.5 active:scale-98 transition hover:shadow-md">
                <div className="bg-blue-50 text-blue-500 p-2.5 rounded-xl w-fit"><Package size={18} /></div>
                <span className="font-black text-[11px] uppercase tracking-wider text-gray-500">Annonces</span>
            </Link>
            <Link href="/favoris" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col gap-2.5 active:scale-98 transition hover:shadow-md">
                <div className="bg-pink-50 text-pink-500 p-2.5 rounded-xl w-fit"><Heart size={18} /></div>
                <span className="font-black text-[11px] uppercase tracking-wider text-gray-500">Coups de cœur</span>
            </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50 space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="font-black text-[11px] uppercase tracking-[0.15em] text-gray-500">Mon Showroom</h3>
                {!isEditingInfo && (
                  <UiButton variant="ghost" size="sm" onClick={() => setIsEditingInfo(true)} className="text-brand-700! bg-brand/5! px-3! py-1.5!">Modifier</UiButton>
                )}
            </div>
            
            <div className="space-y-4">
                {isEditingInfo ? (
                  <UiInput label="Nom public" type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                ) : (
                  <ReadField label="Nom public">{profile?.full_name}</ReadField>
                )}

                {isEditingInfo ? (
                  <UiTextarea label="Bio / Slogan" className="min-h-24!" placeholder="Présentez-vous..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                ) : (
                  <ReadField label="Bio / Slogan"><span className="font-medium text-gray-600 italic">{profile?.description ? `"${profile.description}"` : "Aucune bio..."}</span></ReadField>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {isEditingInfo ? (
                      <UiSelect label="Île" value={formData.island} onChange={e => setFormData({...formData, island: e.target.value})}>
                          <option value="">Sélectionnez votre île</option>
                          {['Ngazidja', 'Ndzouani', 'Mwali', 'Maore', 'La Réunion'].map(i => <option key={i}>{i}</option>)}
                      </UiSelect>
                    ) : (
                      <ReadField label="Île">{profile?.island || "Non renseignée"}</ReadField>
                    )}
                    {isEditingInfo ? (
                      <UiInput label="Ville" type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                    ) : (
                      <ReadField label="Ville">{profile?.city || "Non renseignée"}</ReadField>
                    )}
                </div>

                {isProActive && (
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                    {isEditingInfo ? (
                      <UiInput label="Lien Facebook" type="text" value={formData.facebook_url} onChange={e => setFormData({...formData, facebook_url: e.target.value})} />
                    ) : (
                      <ReadField label="Lien Facebook"><span className="block truncate text-blue-700">{profile?.facebook_url || "Non lié"}</span></ReadField>
                    )}
                    {isEditingInfo ? (
                      <UiInput label="Lien Instagram" type="text" value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} />
                    ) : (
                      <ReadField label="Lien Instagram"><span className="block truncate text-pink-700">{profile?.instagram_url || "Non lié"}</span></ReadField>
                    )}
                  </div>
                )}

                {isEditingInfo ? (
                  <UiInput label="WhatsApp" type="tel" inputMode="tel" startAdornment={<Smartphone size={16} aria-hidden="true" />} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                ) : (
                  <ReadField label="WhatsApp">{profile?.phone_number || "Non renseigné"}</ReadField>
                )}
            </div>

            {isEditingInfo && (
                <div className="flex gap-2.5 pt-2">
                    <UiButton variant="secondary" onClick={cancelEditInfo} className="flex-1 uppercase tracking-widest text-xs">Annuler</UiButton>
                    <UiButton onClick={handleUpdateProfile} loading={saving} className="flex-1 uppercase tracking-widest text-xs">
                        <Save size={14} aria-hidden="true" /> Sauvegarder
                    </UiButton>
                </div>
            )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50 space-y-3">
            <h3 className="font-black text-[11px] uppercase tracking-[0.15em] text-gray-500 flex items-center gap-1.5"><FileText size={14} /> Informations</h3>
            
            <Link href="/faq" className="flex items-center justify-between p-3.5 bg-gray-50/60 rounded-xl active:scale-98 transition hover:bg-gray-50">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white text-blue-500 flex items-center justify-center shadow-sm">
                        <HelpCircle size={14} />
                    </div>
                    <span className="text-xs font-black text-gray-700">Aide & FAQ</span>
                </div>
                <ChevronRight size={14} className="text-gray-500" />
            </Link>

            <Link href="/cgu" className="flex items-center justify-between p-3.5 bg-gray-50/60 rounded-xl active:scale-98 transition hover:bg-gray-50">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white text-gray-500 flex items-center justify-center shadow-sm">
                        <ShieldCheck size={14} />
                    </div>
                    <span className="text-xs font-black text-gray-700">Conditions Générales</span>
                </div>
                <ChevronRight size={14} className="text-gray-500" />
            </Link>
        </div>

        {!isGoogleUser && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50 space-y-4">
              <h3 className="font-black text-[11px] uppercase tracking-[0.15em] text-gray-500 flex items-center gap-1.5"><Lock size={14} /> Sécurité</h3>
              {isEditingPassword ? (
                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                      <UiInput
                          aria-label="Nouveau mot de passe"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Nouveau code secret"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          endAdornment={
                            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="p-1 text-gray-500 hover:text-gray-700">
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          }
                      />
                      <div className="flex gap-2">
                          <UiButton type="button" variant="secondary" onClick={() => setIsEditingPassword(false)} className="flex-1 uppercase tracking-wider text-xs">Annuler</UiButton>
                          <UiButton type="submit" loading={passwordLoading} className="flex-1 uppercase tracking-wider text-xs bg-gray-900! hover:bg-black!">Mettre à jour</UiButton>
                      </div>
                  </form>
              ) : ( 
                <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-transparent">
                  <p className="text-gray-300 tracking-[0.6em] font-black text-xs">••••••••</p>
                  <UiButton variant="ghost" size="sm" onClick={() => setIsEditingPassword(true)} className="text-brand-700! bg-brand/5! px-3! py-1.5!">Changer</UiButton>
                </div>
              )}
          </div>
        )}

        <div className="bg-red-50/50 p-6 rounded-3xl shadow-sm border border-red-100/40 space-y-4">
            <h3 className="font-black text-[11px] text-red-600 uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle size={14} /> Zone Critique</h3>
            <button onClick={() => setShowDeleteModal(true)} className="w-full bg-white border border-red-100 text-red-600 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-98 transition shadow-sm hover:bg-red-50 flex items-center justify-center gap-1.5">
              <Trash2 size={12} /> Supprimer mon espace
            </button>
        </div>
      </div>
    </div>
  )
}