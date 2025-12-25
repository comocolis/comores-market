'use client'

import { createClient } from '@/utils/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link' 
import { 
  MapPin, Calendar, User, ShieldCheck, ArrowLeft, Loader2, 
  Package, Facebook, Instagram, Star, MessageSquare, Plus, X, 
  Crown, Award, CheckCircle2, ShoppingBag, ExternalLink, Share2, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function PublicProfilePage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [responseTimeLabel, setResponseTimeLabel] = useState<string>("Réactif")

  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // --- LOGIQUE DE CALCUL DE RÉACTIVITÉ ---
  const calculateResponseTime = async (userId: string) => {
    try {
      // On récupère les 50 derniers messages impliquant cet utilisateur
      const { data: msgs } = await supabase
        .from('messages')
        .select('created_at, sender_id, receiver_id, product_id')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true })

      if (!msgs || msgs.length < 2) return;

      const responseDelays: number[] = [];
      const convs: { [key: string]: any } = {};

      msgs.forEach(m => {
        const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
        const key = `${m.product_id}-${otherId}`;
        
        if (!convs[key]) convs[key] = { lastReceivedAt: null };

        if (m.receiver_id === userId) {
          // Le vendeur reçoit un message
          convs[key].lastReceivedAt = new Date(m.created_at).getTime();
        } else if (m.sender_id === userId && convs[key].lastReceivedAt) {
          // Le vendeur répond
          const delay = new Date(m.created_at).getTime() - convs[key].lastReceivedAt;
          responseDelays.push(delay);
          convs[key].lastReceivedAt = null; // On reset pour la prochaine question
        }
      });

      if (responseDelays.length > 0) {
        const avgMs = responseDelays.reduce((a, b) => a + b, 0) / responseDelays.length;
        const avgMinutes = avgMs / (1000 * 60);

        if (avgMinutes < 60) setResponseTimeLabel("Répond en quelques minutes");
        else if (avgMinutes < 180) setResponseTimeLabel("Répond en moins de 3h");
        else if (avgMinutes < 1440) setResponseTimeLabel("Répond dans la journée");
        else setResponseTimeLabel("Répond sous 24h à 48h");
      }
    } catch (e) { console.error("Erreur réactivité", e) }
  }

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', params.id).single()
      setProfile(profileData)

      if (profileData) {
        calculateResponseTime(profileData.id);
        const { data: productsData } = await supabase.from('products').select('*').eq('user_id', params.id).eq('status', 'active').order('created_at', { ascending: false })
        setProducts(productsData || [])
        const { data: reviewsData } = await supabase.from('reviews').select('*, reviewer:profiles(*)').eq('target_id', params.id).order('created_at', { ascending: false })
        setReviews(reviewsData || [])
      }
      setLoading(false)
    }
    getData()
  }, [params.id, supabase])

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null

  const handleShare = async () => {
    const shareData = { title: `Profil de ${profile?.full_name}`, url: window.location.href }
    if (navigator.share) { try { await navigator.share(shareData) } catch (err) {} }
    else { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !") }
  }

  const handleAddReview = async () => {
      if (!currentUser) return router.push('/auth')
      setSubmittingReview(true)
      const { error } = await supabase.from('reviews').insert({ reviewer_id: currentUser.id, target_id: params.id, rating: newRating, comment: newComment })
      if (error) { toast.error("Erreur ou déjà noté") } 
      else { toast.success("Avis publié !"); window.location.reload() }
      setSubmittingReview(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-brand" /></div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-gray-500">Profil introuvable.</div>

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans text-gray-900 overflow-x-hidden">
      
      {/* MODALE AVIS */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                  <div className="flex justify-between items-center"><h3 className="font-black text-xl">Noter le vendeur</h3><button onClick={() => setShowReviewModal(false)}><X size={20}/></button></div>
                  <div className="flex justify-center gap-3 py-4">{[1, 2, 3, 4, 5].map((s) => (<button key={s} onClick={() => setNewRating(s)} className="transition-transform active:scale-90"><Star size={36} className={s <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-100 fill-gray-100"} /></button>))}</div>
                  <textarea className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm min-h-32 outline-none focus:ring-2 focus:ring-brand/20" placeholder="Votre avis..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                  <button onClick={handleAddReview} disabled={submittingReview} className="w-full bg-brand text-white font-black py-4 rounded-2xl shadow-xl">{submittingReview ? <Loader2 className="animate-spin mx-auto" /> : "Publier"}</button>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COUVERTURE */}
      <div className="relative h-64 w-full bg-brand overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-dark to-black opacity-40" />
        <div className="absolute top-12 left-0 w-full px-6 flex justify-between items-center z-50">
            <button onClick={() => router.back()} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20"><ArrowLeft size={22} /></button>
            <button onClick={handleShare} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20"><Share2 size={22} /></button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5">
        <div className="bg-white -mt-24 rounded-[3rem] shadow-xl relative z-10 p-8 pt-0 flex flex-col items-center text-center border border-white">
          
          <div className="relative -mt-16 mb-4">
            <div className="w-32 h-32 bg-gray-100 rounded-[2.5rem] border-[6px] border-white shadow-2xl overflow-hidden relative">
                {profile.avatar_url ? <Image src={profile.avatar_url} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={48} /></div>}
            </div>
            {profile.is_pro && <div className="absolute -bottom-2 -right-2 bg-brand text-white p-2.5 rounded-2xl shadow-lg border-4 border-white"><Crown size={20} fill="currentColor" /></div>}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight flex items-center justify-center gap-2">{profile.full_name || "Utilisateur"} {profile.is_pro && <CheckCircle2 size={18} className="text-brand" />}</h2>
            
            {/* RÉACTIVITÉ DYNAMIQUE */}
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto mt-2">
                <Clock size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-tight">{responseTimeLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 w-full max-w-sm mt-8 py-6 border-y border-gray-50">
            <div className="flex flex-col items-center"><span className="text-lg font-black text-gray-900">{products.length}</span><span className="text-[9px] font-bold text-gray-400 uppercase">Annonces</span></div>
            <div className="flex flex-col items-center border-x border-gray-50 px-4"><div className="flex items-center gap-1 text-brand"><span className="text-lg font-black">{averageRating || "—"}</span><Star size={14} className="fill-brand" /></div><span className="text-[9px] font-bold text-gray-400 uppercase">Confiance</span></div>
            <div className="flex flex-col items-center"><span className="text-lg font-black text-gray-900">{new Date(profile.created_at).getFullYear()}</span><span className="text-[9px] font-bold text-gray-400 uppercase">Depuis</span></div>
          </div>

          <div className="mt-6 space-y-4 w-full">
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500">
                <span className="flex items-center gap-1.5 bg-gray-50 px-4 py-2 rounded-full"><MapPin size={14} className="text-brand" /> {profile.city || 'Comores'}</span>
                <span className="flex items-center gap-1.5 bg-gray-50 px-4 py-2 rounded-full"><Award size={14} className="text-brand" /> Vérifié</span>
            </div>
            {profile.description && <p className="text-sm text-gray-600 max-w-md mx-auto italic">"{profile.description}"</p>}
          </div>

          <div className="flex w-full mt-10 gap-2 p-1.5 bg-gray-50 rounded-[1.8rem]">
              <button onClick={() => setActiveTab('listings')} className={`flex-1 py-4 text-xs font-black uppercase rounded-[1.4rem] transition-all ${activeTab === 'listings' ? 'bg-white text-brand shadow-sm' : 'text-gray-400'}`}>Showroom</button>
              <button onClick={() => setActiveTab('reviews')} className={`flex-1 py-4 text-xs font-black uppercase rounded-[1.4rem] transition-all ${activeTab === 'reviews' ? 'bg-white text-brand shadow-sm' : 'text-gray-400'}`}>Avis clients</button>
          </div>
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {activeTab === 'listings' ? (
                <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
                    {products.map(p => {
                        let img = null; try { img = JSON.parse(p.images)[0] } catch { img = p.images }
                        return (
                            <Link key={p.id} href={`/annonce/${p.id}`} className="group">
                              <div className="bg-white rounded-[2rem] p-3 shadow-sm border border-transparent hover:border-brand/20 transition-all">
                                  <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-gray-100">
                                    {img && <Image src={img} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />}
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-brand shadow-sm">{new Intl.NumberFormat('fr-KM').format(p.price)} KMF</div>
                                  </div>
                                  <div className="pt-4 px-2"><h3 className="font-bold text-sm truncate">{p.title}</h3><div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-wider"><ShoppingBag size={10} /> {p.location_city}</div></div>
                              </div>
                            </Link>
                        )
                    })}
                </motion.div>
            ) : (
                <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-10">
                    {currentUser && currentUser.id !== params.id && (
                        <button onClick={() => setShowReviewModal(true)} className="w-full bg-white border-2 border-dashed border-gray-200 text-gray-400 font-bold py-6 rounded-[2rem] flex items-center justify-center gap-2 hover:border-brand/30 hover:text-brand transition-all">
                          <Plus size={18} /> Partager un avis
                        </button>
                    )}
                    {reviews.map(r => (
                        <div key={r.id} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl overflow-hidden relative bg-gray-50">{r.reviewer?.avatar_url ? <Image src={r.reviewer.avatar_url} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={20} /></div>}</div>
                                    <div><p className="font-black text-sm">{r.reviewer?.full_name || 'Anonyme'}</p><div className="flex text-yellow-400 mt-1 gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} size={10} className={i < r.rating ? "fill-current" : "text-gray-100 fill-gray-100"} />))}</div></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-300 uppercase">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            {r.comment && <div className="bg-gray-50/50 p-4 rounded-2xl"><p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p></div>}
                        </div>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}