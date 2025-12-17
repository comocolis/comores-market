'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Users, ShoppingBag, ShieldCheck, Search, Trash2, LogOut, User, Ban, CheckCircle, Flag, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const ADMIN_EMAIL = "abdesisco1@gmail.com" 

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'products' | 'reports'>('dashboard')
  
  const [stats, setStats] = useState({ users: 0, products: 0, pro: 0, banned: 0, reports: 0 })
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // ETAT POUR LA MODALE DE CONFIRMATION
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void; // La fonction à exécuter si on confirme
    isDanger: boolean;
  }>({
    isOpen: false, title: '', message: '', action: () => {}, isDanger: false
  })

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

    if (profiles && items) {
        setUsers(profiles)
        setProducts(items)
        setReports(reportsData || [])
        setStats({
            users: profiles.length,
            products: items.length,
            pro: profiles.filter(p => p.is_pro).length,
            banned: profiles.filter(p => p.is_banned).length,
            reports: reportsData?.filter((r: any) => r.status === 'pending').length || 0
        })
    }
  }

  // --- HELPER POUR OUVRIR LA MODALE ---
  const askConfirm = (title: string, message: string, action: () => void, isDanger: boolean = true) => {
      setConfirmModal({ isOpen: true, title, message, action, isDanger })
  }

  const closeConfirm = () => {
      setConfirmModal({ ...confirmModal, isOpen: false })
  }

  const executeAction = async (actionFn: () => Promise<void>) => {
      await actionFn()
      closeConfirm()
  }

  // --- ACTIONS LOGIQUES (SANS CONFIRM NATIVE) ---

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

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (!error) { toast.success("Annonce supprimée"); fetchData() }
  }

  const resolveReport = async (reportId: string) => {
      const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
      if(!error) { toast.success("Signalement traité"); fetchData() }
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
      
      {/* MODALE DE CONFIRMATION GLOBALE */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-110 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={closeConfirm}>
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 border-t-4 border-transparent" style={{ borderTopColor: confirmModal.isDanger ? '#ef4444' : '#3b82f6' }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${confirmModal.isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{confirmModal.title}</h3>
                </div>
                
                <p className="text-sm text-gray-500 leading-relaxed">{confirmModal.message}</p>
                
                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={closeConfirm} 
                        className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={() => executeAction(async () => confirmModal.action())}
                        className={`flex-1 py-3 rounded-xl font-bold text-white transition shadow-lg flex items-center justify-center gap-2 ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
                    >
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-gray-900 text-white p-6 pt-safe shadow-lg">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-brand" /> Admin</h1>
                <p className="text-gray-400 text-xs mt-1">Super Admin : {ADMIN_EMAIL}</p>
            </div>
            <Link href="/compte" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"><LogOut size={20} /></Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'dashboard' ? 'bg-brand text-white' : 'bg-white/10 text-gray-300'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'reports' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                <Flag size={14} /> Signalements {stats.reports > 0 && <span className="bg-white text-red-600 text-[10px] px-1.5 rounded-full">{stats.reports}</span>}
            </button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'users' ? 'bg-brand text-white' : 'bg-white/10 text-gray-300'}`}>Utilisateurs</button>
            <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'products' ? 'bg-brand text-white' : 'bg-white/10 text-gray-300'}`}>Annonces</button>
        </div>
      </div>

      <div className="p-4">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-2">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-3"><Users size={20} /></div><p className="text-2xl font-extrabold text-gray-900">{stats.users}</p><p className="text-xs text-gray-500 font-bold uppercase">Utilisateurs</p></div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center text-green-600 mb-3"><ShoppingBag size={20} /></div><p className="text-2xl font-extrabold text-gray-900">{stats.products}</p><p className="text-xs text-gray-500 font-bold uppercase">Annonces</p></div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-2xl font-extrabold text-gray-900">{stats.pro}</p><p className="text-xs text-gray-500 font-bold uppercase">Comptes PRO</p></div><div className="bg-yellow-100 w-10 h-10 rounded-full flex items-center justify-center text-yellow-600"><ShieldCheck size={20} /></div></div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-2xl font-extrabold text-gray-900">{stats.reports}</p><p className="text-xs text-gray-500 font-bold uppercase">Alertes</p></div><div className="bg-red-100 w-10 h-10 rounded-full flex items-center justify-center text-red-600"><Flag size={20} /></div></div>
            </div>
        )}

        {/* SIGNALEMENTS */}
        {activeTab === 'reports' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                {reports.length === 0 ? <p className="text-center text-gray-400 mt-10">Aucun signalement.</p> : reports.map(r => (
                    <div key={r.id} className={`bg-white p-4 rounded-xl shadow-sm border ${r.status === 'pending' ? 'border-red-200 bg-red-50/50' : 'border-gray-100 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${r.status === 'pending' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                            <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <p className="text-sm font-bold text-gray-900 mb-2">Motif : "{r.reason}"</p>
                        
                        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                            <User size={12} />
                            <span>Signalé par : <strong>{r.reporter?.full_name || 'Utilisateur inconnu'}</strong></span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Annonce visée :</p>
                            {r.product ? (
                                <Link href={`/annonce/${r.product_id}`} target="_blank" className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded transition">
                                    <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden relative shrink-0">
                                        {r.product.images && <Image src={JSON.parse(r.product.images)[0]} alt="" fill className="object-cover" />}
                                    </div>
                                    <span className="text-sm font-medium truncate flex-1">{r.product.title}</span>
                                </Link>
                            ) : (
                                <p className="text-sm text-red-400 italic">Annonce supprimée</p>
                            )}
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                            {r.product && (
                                <button 
                                    onClick={() => askConfirm("Supprimer l'annonce ?", "Cette action est irréversible.", () => deleteProduct(r.product_id))} 
                                    className="text-xs bg-red-100 text-red-600 px-3 py-2 rounded-lg font-bold hover:bg-red-200 flex items-center gap-1"
                                >
                                    <Trash2 size={12}/> Supprimer Annonce
                                </button>
                            )}
                            {r.status === 'pending' && <button onClick={() => resolveReport(r.id)} className="text-xs bg-gray-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-black flex items-center gap-1"><CheckCircle size={12}/> Marquer traité</button>}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* LISTE UTILISATEURS */}
        {activeTab === 'users' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <input type="text" placeholder="Rechercher un utilisateur..." className="w-full bg-white p-3 rounded-xl shadow-sm pl-10 text-sm outline-none" onChange={e => setSearchTerm(e.target.value)} />
                {users.filter(u => (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())).map(u => {
                    const daysLeft = getDaysRemaining(u.subscription_end_date)
                    const isProActive = u.is_pro && daysLeft > 0
                    return (
                        <div key={u.id} className={`bg-white p-4 rounded-xl shadow-sm border ${u.is_banned ? 'border-red-300 bg-red-50' : (isProActive ? 'border-green-200 bg-green-50/30' : 'border-gray-100')}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">{u.avatar_url ? <Image src={u.avatar_url} alt="" width={40} height={40} /> : <User size={20} />}</div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 flex items-center gap-1">{u.full_name} {isProActive && <CheckCircle size={12} className="text-green-600" />}</p>
                                        <p className="text-[10px] text-gray-400">{u.email}</p>
                                    </div>
                                </div>
                                {u.is_banned && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">BANNI</span>}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {/* PAS DE CONFIRMATION POUR L'AJOUT DE TEMPS, C'EST POSITIF */}
                                <button onClick={() => addSubscriptionTime(u.id, 1, u.subscription_end_date)} className="col-span-1 bg-blue-50 text-blue-700 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-100">+1 Mois</button>
                                <button onClick={() => addSubscriptionTime(u.id, 12, u.subscription_end_date)} className="col-span-1 bg-purple-50 text-purple-700 py-1.5 rounded-lg text-[10px] font-bold hover:bg-purple-100">+1 An</button>
                                
                                <button 
                                    onClick={() => askConfirm("Arrêter l'abonnement ?", "L'utilisateur perdra son statut PRO immédiatement.", () => stopSubscription(u.id))} 
                                    className="col-span-1 bg-gray-100 text-gray-600 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-200"
                                >
                                    Stop
                                </button>
                                <button 
                                    onClick={() => askConfirm(
                                        u.is_banned ? "Débannir l'utilisateur ?" : "Bannir l'utilisateur ?", 
                                        u.is_banned ? "Il pourra de nouveau accéder à son compte." : "Il ne pourra plus se connecter.", 
                                        () => toggleBanUser(u.id, u.is_banned),
                                        !u.is_banned // Danger si on bannit, pas danger si on débannit
                                    )} 
                                    className={`col-span-1 py-1.5 rounded-lg text-[10px] font-bold border ${u.is_banned ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}
                                >
                                    {u.is_banned ? 'Débannir' : 'Bannir'}
                                </button>
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
                    return (
                        <div key={p.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 relative overflow-hidden">{img && <Image src={img} alt="" fill className="object-cover" />}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-gray-900 truncate">{p.title}</p>
                                <p className="text-xs text-gray-500 truncate">{p.profiles?.full_name}</p>
                                <p className="text-brand font-bold text-xs mt-1">{p.price} KMF</p>
                            </div>
                            <button 
                                onClick={() => askConfirm("Supprimer l'annonce ?", "Cette action est irréversible.", () => deleteProduct(p.id))} 
                                className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 self-center"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )
                })}
            </div>
        )}
      </div>
    </div>
  )
}