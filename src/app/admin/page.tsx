'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Loader2, Users, ShoppingBag, ShieldCheck, Search, Trash2, LogOut, 
  User, Ban, CheckCircle, Flag, AlertTriangle, X, Star, MessageSquare, 
  Zap, Sparkles, Clock, FileText, Award, MapPin, Crown
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { generatePROReceipt } from '@/utils/generateReceipt'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const ADMIN_EMAIL = "abdesisco1@gmail.com" 

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'products' | 'reports' | 'reviews'>('dashboard')
  
  const [stats, setStats] = useState({ 
    users: 0, products: 0, pro: 0, banned: 0, reports: 0, reviews: 0, boosted: 0, lowQuality: 0 
  })
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [reviewsList, setReviewsList] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; action: () => void; isDanger: boolean;
  }>({ isOpen: false, title: '', message: '', action: () => {}, isDanger: false })

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const currentEmail = user?.email?.trim().toLowerCase()
      const adminEmail = ADMIN_EMAIL.trim().toLowerCase()

      if (!user || currentEmail !== adminEmail) {
        toast.error("Accès réservé.")
        router.push('/compte') 
        return
      }
      await fetchData()
      setLoading(false)
    }
    checkAdmin()
  }, [router, supabase])

  const fetchData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: items } = await supabase.from('products').select('*, profiles(full_name, email)').order('created_at', { ascending: false })
    
    const { data: reportsData } = await supabase
        .from('reports')
        .select('*, product:products(*), reporter:profiles(*)')
        .order('created_at', { ascending: false })

    // Récupération des avis avec les noms des utilisateurs
    const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
            *,
            reviewer:profiles!reviewer_id(full_name, avatar_url),
            target:profiles!target_id(full_name)
        `)
        .order('created_at', { ascending: false })

    if (profiles && items) {
        setUsers(profiles)
        setProducts(items)
        setReports(reportsData || [])
        setReviewsList(reviewsData || [])
        
        const now = new Date()
        setStats({
            users: profiles.length,
            products: items.length,
            pro: profiles.filter(p => p.is_pro).length,
            banned: profiles.filter(p => p.is_banned).length,
            reports: reportsData?.filter((r: any) => r.status === 'pending').length || 0,
            reviews: reviewsData?.length || 0,
            boosted: items.filter(p => p.boosted_until && new Date(p.boosted_until) > now).length,
            lowQuality: items.filter(p => p.quality_score > 0 && p.quality_score < 5).length
        })
    }
  }

  const askConfirm = (title: string, message: string, action: () => void, isDanger: boolean = true) => {
      setConfirmModal({ isOpen: true, title, message, action, isDanger })
  }

  const closeConfirm = () => setConfirmModal({ ...confirmModal, isOpen: false })

  const executeAction = async (actionFn: () => Promise<void>) => {
      await actionFn()
      closeConfirm()
  }

  const toggleBoost = async (productId: string, isCurrentlyBoosted: boolean) => {
    let newDate = null
    if (!isCurrentlyBoosted) {
        const expiration = new Date()
        expiration.setHours(expiration.getHours() + 24)
        newDate = expiration.toISOString()
    }
    const { error } = await supabase.from('products').update({ boosted_until: newDate }).eq('id', productId)
    if (error) toast.error("Erreur Boost")
    else {
        toast.success(isCurrentlyBoosted ? "Boost retiré" : "Boost activé pour 24h")
        fetchData()
    }
  }

  const addSubscriptionTime = async (userId: string, months: number, currentEndDate: string | null) => {
    const now = new Date()
    const startDate = (currentEndDate && new Date(currentEndDate) > now) ? new Date(currentEndDate) : now
    const newDate = new Date(startDate)
    newDate.setMonth(newDate.getMonth() + months)

    const { error } = await supabase.from('profiles').update({ 
        is_pro: true,
        subscription_end_date: newDate.toISOString() 
    }).eq('id', userId)

    if (error) toast.error("Erreur mise à jour")
    else {
        toast.success(`Abonnement prolongé jusqu'au ${newDate.toLocaleDateString()}`)
        fetchData()
    }
  }

  const stopSubscription = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ is_pro: false, subscription_end_date: null }).eq('id', userId)
    if (error) toast.error("Erreur")
    else { toast.info("Abonnement arrêté"); fetchData() }
  }

  const toggleBanUser = async (userId: string, currentBan: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_banned: !currentBan }).eq('id', userId)
    if (!error) { toast.success(currentBan ? "Utilisateur débanni" : "Utilisateur BANNI"); fetchData() }
  }

  const deleteUserAccount = async (userId: string) => {
    const { error } = await supabase.rpc('delete_user_by_admin', { user_id: userId })
    
    if (error) {
        console.error(error)
        toast.error("Erreur suppression : " + error.message)
    } else {
        toast.success("Compte utilisateur supprimé définitivement.")
        fetchData()
    }
  }

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (!error) { toast.success("Annonce supprimée"); fetchData() }
  }

  const resolveReport = async (reportId: string) => {
      const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
      if(!error) { toast.success("Signalement traité"); fetchData() }
  }

  // --- FONCTION SUPPRESSION AVIS ---
  const deleteReview = async (reviewId: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
      if (error) toast.error("Erreur suppression avis")
      else { toast.success("Avis supprimé"); fetchData() }
  }

  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return 0
    const end = new Date(dateString)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      
      {/* MODALE DE CONFIRMATION */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeConfirm}>
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 border-t-4 border-transparent" style={{ borderTopColor: confirmModal.isDanger ? '#ef4444' : '#3b82f6' }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${confirmModal.isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{confirmModal.title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{confirmModal.message}</p>
                <div className="flex gap-3 pt-2">
                    <button onClick={closeConfirm} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100">Annuler</button>
                    <button onClick={() => executeAction(async () => confirmModal.action())} className={`flex-1 py-3 rounded-xl font-bold text-white transition shadow-lg ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Confirmer</button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER PRESTIGE */}
      <div className="bg-gray-900 text-white p-6 pt-safe shadow-lg">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tighter"><ShieldCheck className="text-amber-500" /> ELITE ADMIN</h1>
                <p className="text-gray-400 text-xs mt-1">Super Admin : {ADMIN_EMAIL}</p>
            </div>
            <Link href="/compte" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"><LogOut size={20} /></Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeTab === 'dashboard' ? 'bg-amber-500 text-white' : 'bg-white/10 text-gray-300'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeTab === 'users' ? 'bg-amber-500 text-white' : 'bg-white/10 text-gray-300'}`}>Utilisateurs</button>
            <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeTab === 'products' ? 'bg-amber-500 text-white' : 'bg-white/10 text-gray-300'}`}>Annonces</button>
            <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'reports' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                <Flag size={14} /> Signalements {stats.reports > 0 && <span className="bg-white text-red-600 text-[10px] px-1.5 rounded-full font-bold ml-1">{stats.reports}</span>}
            </button>
            <button onClick={() => setActiveTab('reviews')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'reviews' ? 'bg-yellow-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                <Star size={14} /> Avis ({stats.reviews})
            </button>
        </div>
      </div>

      <div className="p-4">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-2">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-3"><Users size={20} /></div><p className="text-2xl font-extrabold text-gray-900">{stats.users}</p><p className="text-xs text-gray-500 font-bold uppercase">Utilisateurs</p></div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center text-green-600 mb-3"><ShoppingBag size={20} /></div><p className="text-2xl font-extrabold text-gray-900">{stats.products}</p><p className="text-xs text-gray-500 font-bold uppercase">Annonces</p></div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-200 bg-amber-50/30"><div className="bg-amber-100 w-10 h-10 rounded-full flex items-center justify-center text-amber-600 mb-3"><Crown size={20} /></div><p className="text-2xl font-extrabold text-amber-600">{stats.pro}</p><p className="text-xs text-gray-500 font-bold uppercase">Comptes Élite</p></div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-200 bg-red-50/30"><div className="bg-red-100 w-10 h-10 rounded-full flex items-center justify-center text-red-600 mb-3"><AlertTriangle size={20} /></div><p className="text-2xl font-extrabold text-red-600">{stats.lowQuality}</p><p className="text-xs text-gray-500 font-bold uppercase">Qualité Faible</p></div>
            </div>
        )}

        {/* LISTE UTILISATEURS */}
        {activeTab === 'users' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <input type="text" placeholder="Rechercher..." className="w-full bg-white p-4 rounded-xl shadow-sm text-sm font-bold outline-none border border-gray-100" onChange={e => setSearchTerm(e.target.value)} />
                {users.filter(u => (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())).map(u => {
                    const daysLeft = getDaysRemaining(u.subscription_end_date)
                    const isProActive = u.is_pro && daysLeft > 0
                    return (
                        <div key={u.id} className={`bg-white p-4 rounded-xl shadow-sm border ${u.is_banned ? 'border-red-300 bg-red-50' : (isProActive ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100')}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center font-black text-gray-400">{u.avatar_url ? <Image src={u.avatar_url} alt="" width={40} height={40} /> : u.full_name?.[0]}</div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 flex items-center gap-1">{u.full_name} {isProActive && <Crown size={12} className="text-amber-500" />}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{u.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => generatePROReceipt({ full_name: u.full_name, email: u.email, date: new Date().toISOString() })} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 transition shadow-sm"><FileText size={18} /></button>
                                    <button onClick={() => askConfirm("Supprimer DÉFINITIVEMENT ?", "Toutes les données de cet utilisateur seront effacées. Cette action est irréversible.", () => deleteUserAccount(u.id))} className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 transition shadow-sm hover:bg-red-100"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => addSubscriptionTime(u.id, 1, u.subscription_end_date)} className="bg-gray-900 text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">+1 Mois</button>
                                <button onClick={() => addSubscriptionTime(u.id, 12, u.subscription_end_date)} className="bg-amber-500 text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">+1 An</button>
                                <button onClick={() => askConfirm("Arrêter ?", "L'utilisateur redeviendra particulier.", () => stopSubscription(u.id))} className="bg-gray-100 text-gray-600 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">Stop</button>
                                <button onClick={() => askConfirm(u.is_banned ? "Débannir ?" : "Bannir ?", "Action d'accès.", () => toggleBanUser(u.id, u.is_banned), !u.is_banned)} className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${u.is_banned ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>{u.is_banned ? 'Unlock' : 'Ban'}</button>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}

        {/* LISTE ANNONCES */}
        {activeTab === 'products' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                {products.map(p => {
                    let img = null; try { img = JSON.parse(p.images)[0] } catch {}
                    const now = new Date()
                    const isBoosted = p.boosted_until && new Date(p.boosted_until) > now
                    const scoreColor = p.quality_score >= 8 ? 'text-green-600 bg-green-50' : p.quality_score >= 5 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

                    return (
                        <div key={p.id} className={`bg-white p-3 rounded-2xl shadow-sm border transition-all ${isBoosted ? 'border-amber-400 bg-amber-50/20' : 'border-gray-100'}`}>
                            <div className="flex gap-3 mb-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl shrink-0 relative overflow-hidden">{img && <Image src={img} alt="" fill className="object-cover" />}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-gray-900 truncate">{p.title}</p>
                                        <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${scoreColor}`}>
                                            <Award size={10} /> {p.quality_score || 0}/10
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1"><MapPin size={10} /> {p.location_island} • {p.location_city}</p>
                                    <p className="text-amber-600 font-black text-xs mt-1">{p.price} KMF</p>
                                </div>
                                <button onClick={() => askConfirm("Supprimer ?", "Action irréversible.", () => deleteProduct(p.id))} className="text-red-500 p-2 rounded-lg self-start transition-colors hover:bg-red-50"><Trash2 size={18} /></button>
                            </div>

                            <div className="flex gap-2 border-t border-gray-100 pt-3 mt-2">
                                <button onClick={() => toggleBoost(p.id, isBoosted)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isBoosted ? 'bg-gray-100 text-gray-400' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'}`}>
                                    <Zap size={12} fill={isBoosted ? "none" : "currentColor"} />
                                    {isBoosted ? 'Retirer Boost' : 'Booster 24h'}
                                </button>
                                <Link href={`/annonce/${p.id}`} target="_blank" className="bg-gray-50 text-gray-400 p-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"><Search size={16} /></Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
        
        {/* SIGNALEMENTS */}
        {activeTab === 'reports' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                {reports.map(r => (
                    <div key={r.id} className={`bg-white p-4 rounded-xl shadow-sm border ${r.status === 'pending' ? 'border-red-200 bg-red-50/50' : 'border-gray-100 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter ${r.status === 'pending' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-2">Motif : <span className="text-red-600">"{r.reason}"</span></p>
                        <div className="flex gap-2 justify-end">
                            {r.product && <button onClick={() => askConfirm("Supprimer ?", "Action irréversible.", () => deleteProduct(r.product_id))} className="text-[10px] bg-red-100 text-red-600 px-3 py-2 rounded-lg font-black uppercase tracking-widest flex items-center gap-1"><Trash2 size={12}/> Supprimer</button>}
                            {r.status === 'pending' && <button onClick={() => resolveReport(r.id)} className="text-[10px] bg-gray-800 text-white px-3 py-2 rounded-lg font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle size={12}/> Traité</button>}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- SECTION AVIS (AJOUTÉE) --- */}
        {activeTab === 'reviews' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                {reviewsList.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm font-bold py-10">Aucun avis pour le moment.</p>
                ) : (
                    reviewsList.map(review => (
                        <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center font-black text-gray-400">
                                        {review.reviewer?.avatar_url ? (
                                            <Image src={review.reviewer.avatar_url} alt="" width={40} height={40} />
                                        ) : (
                                            review.reviewer?.full_name?.[0] || 'U'
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{review.reviewer?.full_name || 'Utilisateur inconnu'}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star 
                                                    key={star} 
                                                    size={10} 
                                                    className={star <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Cible</p>
                                    <p className="text-xs font-bold text-gray-700">{review.target?.full_name || 'Inconnu'}</p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-xl mb-3">
                                <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 font-bold">{new Date(review.created_at).toLocaleDateString()}</span>
                                <button 
                                    onClick={() => askConfirm("Supprimer cet avis ?", "Action irréversible.", () => deleteReview(review.id))} 
                                    className="text-[10px] bg-red-50 text-red-600 px-3 py-2 rounded-lg font-black uppercase tracking-widest flex items-center gap-1 transition active:scale-95 hover:bg-red-100"
                                >
                                    <Trash2 size={12}/> Supprimer
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

      </div>
    </div>
  )
}