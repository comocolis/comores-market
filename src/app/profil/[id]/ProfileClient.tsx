'use client'

import { createClient } from '@/utils/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link' 
import { 
  MapPin, User, ShieldCheck, ArrowLeft, Loader2, 
  Facebook, Instagram, Star, Plus, X, 
  Crown, Award, CheckCircle2, ShoppingBag, Share2, Clock, Camera, Sparkles,
  FileText, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { generatePROReceipt } from '@/utils/generateReceipt'

interface UserProfile {
  id: string
  email: string
  username?: string
  avatar_url?: string
  bio?: string
  is_pro?: boolean
  [key: string]: unknown
}

interface ProductListing {
  id: string
  title: string
  price: number
  images: string
  created_at: string
  [key: string]: unknown
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  [key: string]: unknown
}

interface ProfileClientProps {
  initialData?: UserProfile | null
  id?: string
}

export default function ProfileClient({ initialData, id }: ProfileClientProps) {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<UserProfile | null>(initialData || null)
  const [products, setProducts] = useState<ProductListing[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(!initialData)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [responseTimeLabel, setResponseTimeLabel] = useState<string>("Réactif")
  const [uploadingCover, setUploadingCover] = useState(false)

  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const profileId = id || (params?.id as string)
  const isOwner = currentUser?.id === profileId

  const calculateResponseTime = async (userId: string) => {
    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('created_at, sender_id, receiver_id, product_id')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true })

      if (!msgs || msgs.length < 2) return;
      const delays: number[] = [];
      const convs: { [key: string]: any } = {};
      
      msgs.forEach((m: any) => {
        const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
        const key = `${m.product_id}-${otherId}`;
        if (!convs[key]) convs[key] = { lastReceivedAt: null };
        if (m.receiver_id === userId) {
          convs[key].lastReceivedAt = new Date(m.created_at).getTime();
        } else if (m.sender_id === userId && convs[key].lastReceivedAt) {
          delays.push(new Date(m.created_at).getTime() - convs[key].lastReceivedAt);
          convs[key].lastReceivedAt = null;
        }
      });
      if (delays.length > 0) {
        const avgMin = (delays.reduce((a, b) => a + b, 0) / delays.length) / 60000;
        if (avgMin < 60) setResponseTimeLabel("Répond en quelques minutes");
        else if (avgMin < 180) setResponseTimeLabel("Répond en moins de 3h");
        else if (avgMin < 1440) setResponseTimeLabel("Répond dans la journée");
        else setResponseTimeLabel("Répond sous 24h à 48h");
      }
    } catch (e) { console.error(e) }
  }

  const getData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    
    if (!initialData) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', profileId).single()
        if (prof) setProfile(prof)
    }

    if (profileId) {
        calculateResponseTime(profileId);
        const { data: pds } = await supabase.from('products').select('*').eq('user_id', profileId).eq('status', 'active').order('created_at', { ascending: false })
        setProducts(pds || [])
        const { data: rvs } = await supabase.from('reviews').select('*, reviewer:profiles(*)').eq('target_id', profileId).order('created_at', { ascending: false })
        setReviews(rvs || [])
    }
    setLoading(false)
  }, [profileId, supabase, initialData])

  useEffect(() => {
    getData()
  }, [getData])

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    if (!currentUser) {
      toast.error("Utilisateur non connecté")
      return
    }
    const file = e.target.files[0]
    setUploadingCover(true)
    try {
      const fileName = `${currentUser.id}/cover_${Date.now()}.${file.name.split('.').pop()}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('profiles').update({ cover_url: publicUrl }).eq('id', currentUser.id)
      setProfile({ ...profile, cover_url: publicUrl })
      toast.success("Couverture mise à jour")
    } catch (err) { toast.error("Erreur d'envoi") } 
    finally { setUploadingCover(false) }
  }

  const handleShare = async () => {
    const data = { title: `Profil de ${profile?.full_name}`, url: window.location.href }
    if (navigator.share) { try { await navigator.share(data) } catch (e) {} }
    else { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié") }
  }

  const handleAddReview = async () => {
      if (!currentUser) return router.push('/auth')
      setSubmittingReview(true)
      const { error } = await supabase.from('reviews').insert({ reviewer_id: currentUser.id, target_id: profileId, rating: newRating, comment: newComment })
      if (error) toast.error("Erreur envoi")
      else { toast.success("Avis publié !"); window.location.reload() }
      setSubmittingReview(false)
  }

  const getSubscriptionType = (endDate: string) => {
      if (!endDate) return "Standard"
      const end = new Date(endDate)
      const now = new Date()
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24))
      return diffDays > 40 ? "Abonnement Annuel" : "Abonnement Mensuel"
  }

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-brand" /></div>
  if (!profile && !loading) return <div className="min-h-dvh flex items-center justify-center text-gray-500 bg-[#F8FAFC]">Profil introuvable.</div>

  const daysRemaining = profile?.subscription_end_date 
    ? Math.ceil((new Date(profile.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : 0;
  const isProActive = profile?.is_pro && daysRemaining > 0;

  const headerButtonStyle = "p-3 bg-white rounded-full text-brand shadow-lg border border-gray-100 active:scale-90 transition pointer-events-auto"

  return (
    <div className="min-h-dvh w-full bg-[#F8FAFC] pb-24 font-sans text-gray-900 overflow-x-hidden relative">
      
      {/* SECTION COUVERTURE */}
      <div className="relative h-72 w-full overflow-hidden bg-gray-900 group">
        <Image
            src={profile.cover_url || "/cover-default.jpg"}
            alt="Couverture" 
            fill 
            className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-105" 
            priority={true}
            sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#F8FAFC] via-transparent to-black/50" />

        <div className="absolute top-12 left-0 w-full px-6 flex justify-between items-center z-50">
            <button onClick={() => router.back()} className={headerButtonStyle}>
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
                  <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className={headerButtonStyle}>
                    {uploadingCover ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} strokeWidth={2.5} />}
                  </button>
                </>
              )}
              <button onClick={handleShare} className={headerButtonStyle}>
                <Share2 size={22} strokeWidth={2.5} />
              </button>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5">
        <div className="bg-white -mt-24 rounded-[3rem] shadow-xl relative z-10 p-8 pt-0 flex flex-col items-center text-center border border-white/50">
          
          <div className="relative -mt-16 mb-4">
            <div className={`w-32 h-32 rounded-[2.5rem] border-[6px] border-white shadow-2xl overflow-hidden relative ${isProActive ? 'bg-amber-50' : 'bg-gray-100'}`}>
                {profile.avatar_url ? (
                    <Image 
                        src={profile.avatar_url} 
                        alt="" 
                        fill 
                        className="object-cover" 
                        sizes="(max-width: 768px) 33vw, 128px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={48} /></div>
                )}
            </div>
            {isProActive && (
              <div className="absolute -bottom-2 -right-2 bg-amber-50 text-amber-600 p-2 rounded-2xl shadow-lg border-4 border-white flex items-center justify-center">
                <Crown size={18} className="fill-amber-500 text-amber-500" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight flex items-center justify-center gap-2">
              {profile.full_name || "Utilisateur"} 
              {isProActive && <Crown size={22} className="text-amber-500 fill-amber-500" />}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto mt-2">
                <Clock size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-tight">{responseTimeLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 w-full max-w-sm mt-8 py-6 border-y border-gray-100">
            <div className="flex flex-col items-center"><span className="text-lg font-black text-gray-900">{products.length}</span><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Annonces</span></div>
            <div className="flex flex-col items-center border-x border-gray-100 px-4"><div className="flex items-center gap-1 text-brand"><span className="text-lg font-black">{averageRating || "—"}</span><Star size={14} className="fill-brand" /></div><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Confiance</span></div>
            <div className="flex flex-col items-center"><span className="text-lg font-black text-gray-900">{new Date(profile.created_at).getFullYear()}</span><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Depuis</span></div>
          </div>

          {/* ACTIONS */}
          <div className="mt-6 flex flex-col items-center gap-5 w-full">
            {isOwner && isProActive && (
              <button 
                onClick={() => {
                    const subType = getSubscriptionType(profile.subscription_end_date);
                    const today = new Date().toISOString();
                    generatePROReceipt({ 
                      full_name: profile.full_name, 
                      email: currentUser?.email || 'vendeur@comores-market.com', 
                      date: today,
                      description: subType,
                      customEndDate: profile.subscription_end_date
                    })
                }}
                className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] bg-white px-8 py-4 rounded-3xl shadow-sm border border-emerald-100 active:scale-95 transition-all hover:bg-emerald-50"
              >
                <FileText size={14} /> Ma facture Prestige
              </button>
            )}

            {isProActive && (profile.facebook_url || profile.instagram_url) && (
              <div className="flex justify-center gap-3">
                {profile.facebook_url && (
                  <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all active:scale-90 border border-blue-100">
                    <Facebook size={20} fill="currentColor" />
                  </a>
                )}
                {profile.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-pink-50 text-pink-600 rounded-2xl hover:bg-pink-100 transition-all active:scale-90 border border-pink-100">
                    <Instagram size={20} />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4 w-full">
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500">
                <span className="flex items-center gap-1.5 bg-gray-50/50 px-4 py-2 rounded-full"><MapPin size={14} className="text-brand" /> {profile.city || 'Comores'}</span>
                <span className="flex items-center gap-1.5 bg-gray-50/50 px-4 py-2 rounded-full"><Award size={14} className="text-brand" /> Vérifié</span>
            </div>
            
            {/* CORRECTION ALIGNEMENT DESCRIPTION : text-left */}
            {profile.description && (
                <div className="bg-gray-50/50 p-6 rounded-3xl mt-4">
                    <p className="text-sm text-gray-700 leading-relaxed font-medium text-left whitespace-pre-wrap">
                        {profile.description}
                    </p>
                </div>
            )}
          </div>

          <div className="flex w-full mt-10 gap-2 p-1.5 bg-gray-100/80 rounded-3xl">
              <button onClick={() => setActiveTab('listings')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-3xl transition-all duration-300 ${activeTab === 'listings' ? 'bg-white text-brand shadow-md' : 'text-gray-400'}`}>Showroom</button>
              <button onClick={() => setActiveTab('reviews')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-3xl transition-all duration-300 ${activeTab === 'reviews' ? 'bg-white text-brand shadow-md' : 'text-gray-400'}`}>Avis clients</button>
          </div>
        </div>

        <div className="mt-10 pb-20">
          <AnimatePresence mode="wait">
            {activeTab === 'listings' ? (
                <motion.div key="listings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
                    {products.map(p => {
                        let img = null; try { img = JSON.parse(p.images)[0] } catch { img = p.images }
                        const isBoosted = p.boosted_until && new Date(p.boosted_until) > new Date();

                        return (
                          <div key={p.id} className="flex flex-col gap-3">
                            <Link href={`/annonce/${p.id}`} className="group relative">
                              <div className={`bg-white rounded-xl p-3 shadow-sm border transition-all duration-500 ${isBoosted ? 'border-amber-400 ring-4 ring-amber-100' : 'border-white'}`}>
                                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50">
                                    {img && (
                                        <Image 
                                            src={img} 
                                            alt="" 
                                            fill 
                                            className="object-cover group-hover:scale-110 transition-transform duration-700" 
                                            sizes="(max-width: 768px) 50vw, 300px"
                                        />
                                    )}
                                    {isBoosted && (
                                      <div className="absolute top-2 left-2 bg-linear-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-lg border border-white/20">
                                          <Sparkles size={10} className="animate-pulse" /> Boosté
                                      </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black text-brand shadow-sm">{new Intl.NumberFormat('fr-KM').format(p.price)} KMF</div>
                                  </div>
                                  <div className="pt-3 px-1">
                                    <h3 className="font-bold text-sm truncate text-gray-800">{p.title}</h3>
                                    <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                      <ShoppingBag size={10} /> {p.location_city}
                                    </div>
                                  </div>
                              </div>
                            </Link>

                            {isOwner && (
                              isBoosted ? (
                                <div className="w-full bg-amber-50 text-amber-600 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-amber-100">
                                  <Clock size={12} /> {Math.ceil((new Date(p.boosted_until).getTime() - new Date().getTime()) / (1000 * 3600))}h rest.
                                </div>
                              ) : (
                                <Link 
                                  href={`/boost/${p.id}`}
                                  className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-amber-400 to-amber-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all group"
                                >
                                  <Zap size={14} fill="currentColor" className="group-hover:rotate-12 transition-transform" />
                                  Booster 24h
                                </Link>
                              )
                            )}
                          </div>
                        )
                    })}
                </motion.div>
            ) : (
                <motion.div key="reviews" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {currentUser && currentUser.id !== profileId && (
                        <button onClick={() => setShowReviewModal(true)} className="w-full bg-white border-2 border-dashed border-gray-200 text-gray-400 font-bold py-6 rounded-4xl flex items-center justify-center gap-2 hover:border-brand/30 hover:text-brand transition-all">
                          <Plus size={18} /> Partager un avis
                        </button>
                    )}
                    {reviews.map(r => (
                        <div key={r.id} className="bg-white p-7 rounded-4xl shadow-sm border border-white space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl overflow-hidden relative bg-gray-50 shadow-inner">
                                        {r.reviewer?.avatar_url ? (
                                            <Image 
                                                src={r.reviewer.avatar_url} 
                                                alt="" 
                                                fill 
                                                className="object-cover"
                                                sizes="40px" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={20} /></div>
                                        )}
                                    </div>
                                    <div><p className="font-black text-sm text-gray-900">{r.reviewer?.full_name || 'Anonyme'}</p><div className="flex text-yellow-400 mt-1 gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} size={10} className={i < r.rating ? "fill-current" : "text-gray-100 fill-gray-100"} />))}</div></div>
                                </div>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            {r.comment && <div className="bg-[#F5F7F9] p-5 rounded-3xl"><p className="text-gray-600 text-sm leading-relaxed">"{r.comment}"</p></div>}
                        </div>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-200 bg-black/40 backdrop-blur-md flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] p-8 space-y-6 shadow-2xl border border-white">
                  <div className="flex justify-between items-center"><h3 className="font-black text-xl tracking-tight">Noter le vendeur</h3><button onClick={() => setShowReviewModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20}/></button></div>
                  <div className="flex justify-center gap-3 py-4">{[1, 2, 3, 4, 5].map((s) => (<button key={s} onClick={() => setNewRating(s)} className="transition-transform active:scale-90"><Star size={36} className={s <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-100 fill-gray-100"} /></button>))}</div>
                  <textarea className="w-full bg-[#F5F7F9] border-none rounded-3xl p-5 text-sm min-h-32 outline-none focus:ring-4 focus:ring-brand/5 transition" placeholder="Votre avis..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                  <button onClick={handleAddReview} disabled={submittingReview} className="w-full bg-brand text-white font-black py-5 rounded-3xl shadow-xl shadow-brand/20 active:scale-95 transition">{submittingReview ? <Loader2 className="animate-spin mx-auto" /> : "Publier l'avis"}</button>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}