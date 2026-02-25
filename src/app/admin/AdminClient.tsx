'use client'

import { createClient } from '@/utils/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { 
  Loader2, Users, ShoppingBag, ShieldCheck, Search, Trash2, LogOut, 
  Flag, AlertTriangle, Star, Zap, FileText, MapPin, Crown, CheckCircle, XCircle, Shield, ShieldAlert,
  Send, MessageSquare, Mail, Inbox
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { generatePROReceipt } from '@/utils/generateReceipt'

function AdminContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const SUPER_ADMIN_EMAIL = "abdesisco1@gmail.com" 

  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<'user' | 'admin' | 'super_admin'>('user')
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const currentTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(currentTab || 'dashboard')
  
  // STATS
  const [stats, setStats] = useState({ 
    users: 0, products: 0, pro: 0, banned: 0, reports: 0, reviews: 0, boosted: 0, lowQuality: 0, admins: 0,
    messages: 0
  })

  // DONNÉES
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [reviewsList, setReviewsList] = useState<any[]>([])
  const [contactMessages, setContactMessages] = useState<any[]>([]) 
  const [searchTerm, setSearchTerm] = useState('')

  // ETATS MESSAGERIE ADMIN (OUTGOING)
  const [targetId, setTargetId] = useState('')
  const [adminMsg, setAdminMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; action: () => void; isDanger: boolean;
  }>({ isOpen: false, title: '', message: '', action: () => {}, isDanger: false })

  const changeTab = (tab: string) => {
    setActiveTab(tab)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', tab)
    window.history.pushState({}, '', newUrl)
  }

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/compte'); return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const isSuper = user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
      const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

      if (!isSuper && !isAdmin) {
        toast.error("Accès refusé.")
        router.push('/compte') 
        return
      }

      setCurrentUserId(user.id)
      setCurrentUserRole(isSuper ? 'super_admin' : (profile?.role as 'admin' | 'super_admin'))
      
      await fetchData()
      setLoading(false)
    }
    checkAccess()
  }, [router, supabase])

const [usersError, setUsersError] = useState('')
    const [productsError, setProductsError] = useState('')

    const fetchData = async () => {
        try {
            // USERS
            const { data: profiles, error: errProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
            if (errProfiles) { console.error(errProfiles); setUsersError(errProfiles.message) }
            else if (profiles) setUsers(profiles)

            // PRODUCTS
            const { data: items, error: errProducts } = await supabase.from('products').select('*, profiles(full_name, email)')
                .order('created_at', { ascending: false })
            
            if (errProducts) { 
                console.error(errProducts); 
                setProductsError(errProducts.message);
                toast.error(`Erreur Produits: ${errProducts.message}`)
            }
            else if (items) setProducts(items)

            // OTHERS
            const { data: reportsData } = await supabase.from('reports').select('*, product:products(*), reporter:profiles(*)').order('created_at', { ascending: false })
            const { data: reviewsData } = await supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(full_name, avatar_url), target:profiles!target_id(full_name)').order('created_at', { ascending: false })
            const { data: contactsData } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
            
            if (reportsData) setReports(reportsData)
            if (reviewsData) setReviewsList(reviewsData)
            if (contactsData) setContactMessages(contactsData)
            
            // STATS CALCULATION
            if (profiles && items) {
                const now = new Date()
                setStats({
                    users: profiles.length,
                    products: items.length,
                    pro: profiles.filter((p: any) => p.is_pro).length,
                    banned: profiles.filter((p: any) => p.is_banned).length,
                    reports: reportsData?.filter((r: any) => r.status === 'pending').length || 0,
                    reviews: reviewsData?.length || 0,
                    boosted: items.filter((p: any) => p.boosted_until && new Date(p.boosted_until) > now).length,
                    lowQuality: items.filter((p: any) => p.quality_score > 0 && p.quality_score < 5).length,
                    admins: profiles.filter((p: any) => p.role === 'admin').length,
                    messages: contactsData?.length || 0
                })
            }
        } catch (e) {
            console.error("Global fetch error:", e)
        }
    }

  const askConfirm = (title: string, message: string, action: () => void, isDanger: boolean = true) => {
      setConfirmModal({ isOpen: true, title, message, action, isDanger })
  }
  const closeConfirm = () => setConfirmModal({ ...confirmModal, isOpen: false })
  const executeAction = async (actionFn: () => Promise<void>) => { await actionFn(); closeConfirm() }

  // --- ACTIONS ---

  const sendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!targetId || !adminMsg) return toast.error("ID utilisateur et message requis")
    setSendingMsg(true)
    const { error } = await supabase.from('messages').insert({
        content: `[ADMIN] ${adminMsg}`,
        sender_id: currentUserId,
        receiver_id: targetId,
        is_read: false
    })
    if(error) { toast.error("Erreur d'envoi"); console.error(error) } 
    else { toast.success("Message officiel envoyé !"); setAdminMsg(''); setTargetId('') }
    setSendingMsg(false)
  }

  const toggleAdminRole = async (targetId: string, currentRole: string) => {
      if (currentUserRole !== 'super_admin') { toast.error("Action réservée au Super Admin."); return }
      const newRole = currentRole === 'admin' ? 'user' : 'admin'
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetId)
      if (error) toast.error("Erreur technique")
      else {
          toast.success(newRole === 'admin' ? "Nouveau Admin nommé !" : "Admin rétrogradé.")
          setUsers(prev => prev.map(u => u.id === targetId ? { ...u, role: newRole } : u))
          setStats(prev => ({ ...prev, admins: newRole === 'admin' ? prev.admins + 1 : prev.admins - 1 }))
      }
  }

  const deleteReportOnly = async (reportId: string) => {
      const { error } = await supabase.from('reports').delete().eq('id', reportId)
      if (error) toast.error("Erreur suppression")
      else {
          toast.success("Signalement supprimé")
          setReports(prev => prev.filter(r => r.id !== reportId))
          setStats(prev => ({ ...prev, reports: Math.max(0, prev.reports - 1) }))
      }
  }

  const deleteReview = async (reviewId: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
      if (error) toast.error("Erreur suppression")
      else { 
          toast.success("Avis supprimé")
          setReviewsList(prev => prev.filter(r => r.id !== reviewId))
          setStats(prev => ({ ...prev, reviews: Math.max(0, prev.reviews - 1) }))
      }
  }

  const deleteContactMessage = async (msgId: string) => {
      const { error } = await supabase.from('contact_messages').delete().eq('id', msgId)
      if (error) toast.error("Erreur suppression")
      else {
          toast.success("Message supprimé")
          setContactMessages(prev => prev.filter(m => m.id !== msgId))
          setStats(prev => ({ ...prev, messages: Math.max(0, prev.messages - 1) }))
      }
  }

  const toggleBoost = async (productId: string, isCurrentlyBoosted: boolean) => {
    let newDate = null
    if (!isCurrentlyBoosted) {
        const expiration = new Date()
        expiration.setHours(expiration.getHours() + 24)
        newDate = expiration.toISOString()
    }
    const { error } = await supabase.from('products').update({ boosted_until: newDate }).eq('id', productId)
    if (!error) { toast.success(isCurrentlyBoosted ? "Boost retiré" : "Boost activé pour 24h"); fetchData() }
  }

  const addSubscriptionTime = async (userId: string, months: number, currentEndDate: string | null) => {
    const now = new Date()
    const startDate = (currentEndDate && new Date(currentEndDate) > now) ? new Date(currentEndDate) : now
    const newDate = new Date(startDate)
    newDate.setMonth(newDate.getMonth() + months)
    const { error } = await supabase.from('profiles').update({ is_pro: true, subscription_end_date: newDate.toISOString() }).eq('id', userId)
    if (!error) { toast.success(`Prolongé jusqu'au ${newDate.toLocaleDateString()}`); fetchData() }
  }

  const stopSubscription = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ is_pro: false, subscription_end_date: null }).eq('id', userId)
    if (!error) { toast.info("Abonnement arrêté"); fetchData() }
  }

  const toggleBanUser = async (userId: string, currentBan: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_banned: !currentBan }).eq('id', userId)
    if (!error) { toast.success(currentBan ? "Utilisateur débanni" : "Utilisateur BANNI"); fetchData() }
  }

  const deleteUserAccount = async (userId: string) => {
    if (userId === currentUserId) return toast.error("Impossible de se supprimer soi-même !")
    if (currentUserRole !== 'super_admin') return toast.error("Réservé au Super Admin.")
    const { error } = await supabase.rpc('delete_user_by_admin', { user_id: userId })
    if (error) { console.error(error); toast.error("Erreur : " + error.message) }
    else {
        toast.success("Compte supprimé définitivement")
        setUsers(prev => prev.filter(u => u.id !== userId))
        setStats(prev => ({ ...prev, users: Math.max(0, prev.users - 1) }))
    }
  }

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (!error) { 
        toast.success("Annonce supprimée")
        setProducts(prev => prev.filter(p => p.id !== productId))
        setReports(prev => prev.filter(r => r.product_id !== productId))
        setStats(prev => ({ ...prev, products: Math.max(0, prev.products - 1) }))
    }
  }

  const resolveReport = async (reportId: string) => {
      const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
      if(!error) { 
          toast.success("Traité")
          setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r))
          setStats(prev => ({ ...prev, reports: Math.max(0, prev.reports - 1) }))
      }
  }

  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return 0
    const end = new Date(dateString)
    const now = new Date()
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24))
  }

  const getSubscriptionType = (dateString: string | null) => {
      if (!dateString) return "Standard"
      return getDaysRemaining(dateString) > 40 ? "Abonnement Annuel" : "Abonnement Mensuel"
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeConfirm}>
            <div className={`bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 border-t-4 ${confirmModal.isDanger ? 'border-t-red-500' : 'border-t-blue-500'}`} onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><AlertTriangle className={confirmModal.isDanger ? "text-red-500" : "text-blue-500"} /> {confirmModal.title}</h3>
                <p className="text-sm text-gray-500">{confirmModal.message}</p>
                <div className="flex gap-3 pt-2">
                    <button onClick={closeConfirm} aria-label="Annuler l'action" className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100">Annuler</button>
                    <button onClick={() => executeAction(async () => confirmModal.action())} aria-label="Confirmer l'action" className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg ${confirmModal.isDanger ? 'bg-red-600' : 'bg-blue-600'}`}>Confirmer</button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-gray-900 text-white p-6 pt-safe shadow-lg">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tighter">
                    <ShieldCheck className={currentUserRole === 'super_admin' ? "text-amber-500" : "text-blue-400"} /> 
                    {currentUserRole === 'super_admin' ? "SUPER ADMIN" : "ADMINISTRATION"}
                </h1>
                <p className="text-gray-400 text-xs mt-1 font-mono">{currentUserRole === 'super_admin' ? "Contrôle Total" : "Modérateur"}</p>
            </div>
            <Link href="/compte" aria-label="Se déconnecter" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"><LogOut size={20} /></Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => changeTab('dashboard')} aria-label="Tableau de bord" className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeTab === 'dashboard' ? 'bg-amber-500 text-white' : 'bg-white/10 text-gray-100'}`}>Dashboard</button>
            <button onClick={() => changeTab('messages')} aria-label="Messages" className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition flex gap-2 ${activeTab === 'messages' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-100'}`}><Inbox size={14}/> Messages {stats.messages > 0 && <span className="bg-white text-purple-600 px-1.5 rounded-full">{stats.messages}</span>}</button>
            <button onClick={() => changeTab('reports')} aria-label="Signalements" className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition flex gap-2 ${activeTab === 'reports' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-100'}`}><Flag size={14}/> Signalements {stats.reports > 0 && <span className="bg-white text-red-600 px-1.5 rounded-full">{stats.reports}</span>}</button>
            <button onClick={() => changeTab('users')} aria-label="Utilisateurs" className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeTab === 'users' ? 'bg-amber-500 text-white' : 'bg-white/10 text-gray-100'}`}>Utilisateurs</button>
            <button onClick={() => changeTab('products')} aria-label="Annonces" className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeTab === 'products' ? 'bg-amber-500 text-white' : 'bg-white/10 text-gray-100'}`}>Annonces</button>
            <button onClick={() => changeTab('reviews')} aria-label="Avis" className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition flex gap-2 ${activeTab === 'reviews' ? 'bg-yellow-500 text-white' : 'bg-white/10 text-gray-100'}`}><Star size={14}/> Avis ({stats.reviews})</button>
        </div>
      </div>

      <div className="p-4">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-3"><Users size={20} /></div><p className="text-2xl font-extrabold text-gray-900">{stats.users}</p><p className="text-xs text-gray-500 font-bold uppercase">Utilisateurs</p></div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center text-green-600 mb-3"><ShoppingBag size={20} /></div><p className="text-2xl font-extrabold text-gray-900">{stats.products}</p><p className="text-xs text-gray-500 font-bold uppercase">Annonces</p></div>
                    
                    {/* ✅ CARTE MESSAGES PLEINE LARGEUR */}
                    <div className="col-span-2 bg-purple-50 p-5 rounded-2xl shadow-sm border border-purple-100 flex items-center justify-between">
                        <div>
                            <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center text-purple-600 mb-2"><Inbox size={20} /></div>
                            <p className="text-xs text-purple-600 font-bold uppercase">Boîte de réception</p>
                        </div>
                        <p className="text-4xl font-extrabold text-purple-600">{stats.messages}</p>
                    </div>

                    {/* ✅ CARTE PRO RÉINSÉRÉE */}
                    <div className="p-5 rounded-2xl shadow-sm border border-amber-200 bg-amber-50/30">
                        <div className="bg-amber-100 w-10 h-10 rounded-full flex items-center justify-center text-amber-600 mb-3"><Crown size={20} /></div>
                        <p className="text-2xl font-extrabold text-amber-600">{stats.pro}</p>
                        <p className="text-xs text-gray-500 font-bold uppercase">Comptes Élite</p>
                    </div>

                    {currentUserRole === 'super_admin' ? (
                        <div className="p-5 rounded-2xl shadow-sm border border-blue-200 bg-blue-50/30"><div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-3"><Shield size={20} /></div><p className="text-2xl font-extrabold text-blue-600">{stats.admins}</p><p className="text-xs text-gray-500 font-bold uppercase">Admins</p></div>
                    ) : (
                        <div className="p-5 rounded-2xl shadow-sm border border-red-200 bg-red-50/30"><div className="bg-red-100 w-10 h-10 rounded-full flex items-center justify-center text-red-600 mb-3"><AlertTriangle size={20} /></div><p className="text-2xl font-extrabold text-red-600">{stats.lowQuality}</p><p className="text-xs text-gray-500 font-bold uppercase">Qualité Faible</p></div>
                    )}
                </div>
                
                {/* BLOC MESSAGERIE OUTGOING */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4"><MessageSquare className="text-brand" size={16} /> Envoyer un Message</h2>
                    <form onSubmit={sendAdminMessage} className="space-y-3">
                        <div className="flex gap-2">
                            <input type="text" aria-label="ID Utilisateur" placeholder="ID Utilisateur (UUID)..." value={targetId} onChange={e => setTargetId(e.target.value)} className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono outline-none"/>
                            <input type="text" aria-label="Message système" placeholder="Message système..." value={adminMsg} onChange={e => setAdminMsg(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none"/>
                        </div>
                        <button disabled={sendingMsg} type="submit" aria-label="Envoyer le message" className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition">{sendingMsg ? <Loader2 size={16} className="animate-spin"/> : <><Send size={16}/> Envoyer</>}</button>
                    </form>
                </div>
            </div>
        )}

        {/* MESSAGES REÇUS */}
        {activeTab === 'messages' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <h2 className="text-lg font-bold text-gray-800 px-2">Boîte de réception ({contactMessages.length})</h2>
                {contactMessages.length === 0 ? <div className="text-center py-10 text-gray-400 font-medium">Aucun message reçu.</div> : contactMessages.map(msg => (
                    <div key={msg.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <div className="bg-purple-100 p-2 rounded-full text-purple-600"><Mail size={16} /></div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900">{msg.name}</p>
                                    <p className="text-xs text-gray-500">{msg.email}</p>
                                </div>
                             </div>
                             <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold">{new Date(msg.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase mb-1 inline-block ${msg.subject === 'data_deletion' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                {msg.subject === 'data_deletion' ? 'SUPPRESSION DONNÉES' : msg.subject}
                            </span>
                            {/* ✅ CORRECTION CSS : break-all */}
                            <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-50 italic break-all">"{msg.message}"</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                            <a href={`mailto:${msg.email}`} aria-label={`Répondre à ${msg.name}`} className="text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1"><Send size={12}/> Répondre</a>
                            <button onClick={() => askConfirm("Supprimer ce message ?", "Irréversible.", () => deleteContactMessage(msg.id))} aria-label="Supprimer ce message" className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg font-bold hover:bg-red-100 flex items-center gap-1"><Trash2 size={12}/> Supprimer</button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <input type="text" aria-label="Rechercher un utilisateur" placeholder="Rechercher..." className="w-full bg-white p-4 rounded-xl shadow-sm text-sm font-bold outline-none border border-gray-100" onChange={e => setSearchTerm(e.target.value)} />
                {users.filter(u => (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())).map(u => {
                    const daysLeft = getDaysRemaining(u.subscription_end_date); const isProActive = u.is_pro && daysLeft > 0; const subType = getSubscriptionType(u.subscription_end_date);
                    return (
                        <div key={u.id} className={`p-4 rounded-xl shadow-sm border ${u.is_banned ? 'border-red-300 bg-red-50' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center justify-between mb-3 gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center font-black text-gray-500 shrink-0">{u.avatar_url ? <Image src={u.avatar_url} alt="" width={40} height={40} /> : u.full_name?.[0]}</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-gray-900 flex items-center gap-1 truncate">{u.full_name} {isProActive && <Crown size={12} className="text-amber-500 shrink-0" />}</p>
                                        <p className="text-[10px] text-gray-500 font-bold flex items-center gap-2 truncate">{u.email} <button onClick={() => {setTargetId(u.id); setActiveTab('dashboard'); toast.info("ID copié")}} aria-label={`Envoyer un message à ${u.full_name}`} className="text-blue-500 hover:underline cursor-pointer shrink-0">Message</button></p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {isProActive && (<button onClick={() => generatePROReceipt({ full_name: u.full_name, email: u.email, date: new Date().toISOString(), description: subType })} aria-label="Générer facture" className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 transition shadow-sm"><FileText size={18} /></button>)}
                                    {currentUserRole === 'super_admin' && u.id !== currentUserId && (<button onClick={() => toggleAdminRole(u.id, u.role)} aria-label="Gérer droits admin" className={`p-2.5 rounded-xl border transition shadow-sm ${u.role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}><ShieldAlert size={18} /></button>)}
                                    {currentUserRole === 'super_admin' && u.id !== currentUserId && (<button onClick={() => askConfirm("Supprimer DÉFINITIVEMENT ?", "Irréversible.", () => deleteUserAccount(u.id))} aria-label="Supprimer utilisateur" className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 transition hover:bg-red-100"><Trash2 size={18} /></button>)}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button onClick={() => addSubscriptionTime(u.id, 1, u.subscription_end_date)} aria-label="Ajouter 1 mois" className="bg-gray-900 text-white py-1.5 rounded-lg text-[10px] font-black uppercase">+1 Mois</button>
                                <button onClick={() => addSubscriptionTime(u.id, 12, u.subscription_end_date)} aria-label="Ajouter 1 an" className="bg-amber-500 text-white py-1.5 rounded-lg text-[10px] font-black uppercase">+1 An</button>
                                <button onClick={() => askConfirm("Arrêter ?", "L'utilisateur redeviendra particulier.", () => stopSubscription(u.id))} aria-label="Arrêter abonnement" className="bg-gray-100 text-gray-600 py-1.5 rounded-lg text-[10px] font-black uppercase">Stop</button>
                                <button onClick={() => toggleBanUser(u.id, u.is_banned)} aria-label={u.is_banned ? "Débannir" : "Bannir"} className={`py-1.5 rounded-lg text-[10px] font-black uppercase border ${u.is_banned ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>{u.is_banned ? 'Unlock' : 'Ban'}</button>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}

        {/* PRODUCTS */}
        {activeTab === 'products' && (
             <div className="space-y-4 animate-in slide-in-from-bottom-2">
                {products.map(p => {
                    let img = null; try { img = JSON.parse(p.images)[0] } catch {}
                    const isBoosted = p.boosted_until && new Date(p.boosted_until) > new Date()
                    return (
                        <div key={p.id} className={`p-3 rounded-2xl shadow-sm border transition-all ${isBoosted ? 'border-amber-400 bg-amber-50/20' : 'bg-white border-gray-100'}`}>
                            <div className="flex gap-3 mb-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl shrink-0 relative overflow-hidden">{img && <Image src={img} alt="" fill className="object-cover" />}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2"><p className="font-bold text-sm text-gray-900 truncate">{p.title}</p> <span className="text-[10px] font-bold bg-gray-100 px-2 rounded">Score: {p.quality_score}/10</span></div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1"><MapPin size={10} className="inline"/> {p.location_island}</p>
                                    <p className="text-amber-600 font-black text-xs mt-1">{p.price} KMF</p>
                                </div>
                                <button onClick={() => askConfirm("Supprimer ?", "Irréversible.", () => deleteProduct(p.id))} aria-label={`Supprimer l'annonce ${p.title}`} className="text-red-500 p-2 rounded-lg hover:bg-red-50"><Trash2 size={18} /></button>
                            </div>
                            <div className="flex gap-2 border-t border-gray-100 pt-3 mt-2">
                                <button onClick={() => toggleBoost(p.id, isBoosted)} aria-label={isBoosted ? "Arrêter le boost" : "Booster l'annonce"} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase ${isBoosted ? 'bg-gray-100 text-gray-500' : 'bg-amber-500 text-white'}`}><Zap size={12}/> {isBoosted ? 'Retirer Boost' : 'Booster 24h'}</button>
                                <Link href={`/annonce?id=${p.id}`} target="_blank" aria-label={`Voir l'annonce ${p.title}`} className="bg-gray-50 text-gray-500 p-3 rounded-xl border hover:bg-gray-100"><Search size={16}/></Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}

        {/* REPORTS */}
        {activeTab === 'reports' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                {reports.map(r => (
                    <div key={r.id} className={`p-4 rounded-xl shadow-sm border ${r.status === 'pending' ? 'border-red-200 bg-red-50/50' : 'bg-white border-gray-100 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${r.status === 'pending' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span><span className="text-[10px] text-gray-500 font-bold">{new Date(r.created_at).toLocaleDateString()}</span></div>
                        <p className="text-sm font-bold text-gray-900 mb-2">Motif : <span className="text-red-600">"{r.reason}"</span></p>
                        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 mt-2">
                            <button onClick={() => deleteReportOnly(r.id)} aria-label="Supprimer signalement" className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200"><Trash2 size={16}/></button>
                            {r.product && <button onClick={() => askConfirm("Supprimer L'ANNONCE ?", "Irréversible.", () => deleteProduct(r.product_id))} aria-label="Supprimer l'annonce signalée" className="text-[10px] bg-red-100 text-red-600 px-3 py-2 rounded-lg font-black uppercase flex items-center gap-1 hover:bg-red-200"><XCircle size={14}/> Supprimer l'annonce</button>}
                            {r.status === 'pending' && <button onClick={() => resolveReport(r.id)} aria-label="Marquer comme traité" className="text-[10px] bg-gray-800 text-white px-3 py-2 rounded-lg font-black uppercase flex items-center gap-1 hover:bg-gray-700"><CheckCircle size={14}/> Traité</button>}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* REVIEWS */}
        {activeTab === 'reviews' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                {reviewsList.length === 0 ? <p className="text-center text-gray-500 text-sm font-bold py-10">Aucun avis.</p> : reviewsList.map(review => (
                    <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center font-black text-gray-500">{review.reviewer?.avatar_url ? <Image src={review.reviewer.avatar_url} alt="" width={40} height={40} /> : (review.reviewer?.full_name?.[0] || 'U')}</div>
                                <div><p className="font-bold text-sm text-gray-900">{review.reviewer?.full_name || 'Inconnu'}</p><div className="flex gap-1 mt-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}/>)}</div></div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl mb-3"><p className="text-sm text-gray-600 italic">"{review.comment}"</p></div>
                        <div className="flex justify-between items-center"><span className="text-[10px] text-gray-500 font-bold">{new Date(review.created_at).toLocaleDateString()}</span><button onClick={() => deleteReview(review.id)} aria-label="Supprimer avis" className="text-[10px] bg-red-50 text-red-600 px-3 py-2 rounded-lg font-black uppercase flex gap-1 hover:bg-red-100"><Trash2 size={12}/> Supprimer</button></div>
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  )
}

export default function AdminClient() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>}>
      <AdminContent />
    </Suspense>
  )
}