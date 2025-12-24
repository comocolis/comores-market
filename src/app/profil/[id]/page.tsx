'use client'

import { createClient } from '@/utils/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link' 
import { 
  MapPin, Calendar, User, ShieldCheck, ArrowLeft, Loader2, 
  Package, Facebook, Instagram, Star, MessageSquare, Plus, X 
} from 'lucide-react'
import { toast } from 'sonner'

export default function PublicProfilePage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', params.id).single()
      setProfile(profileData)

      if (profileData) {
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

  const handleAddReview = async () => {
      if (!currentUser) return router.push('/auth')
      if (currentUser.id === params.id) return toast.error("Vous ne pouvez pas vous noter vous-même.")
      setSubmittingReview(true)
      const { error } = await supabase.from('reviews').insert({ reviewer_id: currentUser.id, target_id: params.id, rating: newRating, comment: newComment })
      if (error) {
          if (error.code === '23505') toast.error("Vous avez déjà noté ce vendeur.")
          else toast.error("Erreur envoi")
      } else {
          toast.success("Avis publié !")
          window.location.reload()
      }
      setSubmittingReview(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-900"><Loader2 className="animate-spin text-brand" /></div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-gray-500">Introuvable.</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      
      {/* MODALE AVIS */}
      {showReviewModal && (
        <div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Noter le vendeur</h3><button onClick={() => setShowReviewModal(false)}><X size={20}/></button></div>
                <div className="flex justify-center gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setNewRating(star)}><Star size={32} className={star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} /></button>
                    ))}
                </div>
                <textarea className="w-full bg-gray-50 border rounded-xl p-3 text-sm min-h-24 outline-none" placeholder="Commentaire..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                <button onClick={handleAddReview} disabled={submittingReview} className="w-full bg-brand text-white font-bold py-3 rounded-xl">Publier</button>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-brand p-4 pt-safe sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 text-white/80"><ArrowLeft size={22} /></button>
            <h1 className="text-white font-bold text-lg">Profil Vendeur</h1>
        </div>
      </div>

      {/* CARTE VENDEUR */}
      <div className="bg-white p-6 pb-0 -mt-4 rounded-b-3xl shadow-sm relative z-10 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-white shadow-md relative mb-3 overflow-hidden">
            {profile.avatar_url ? <Image src={profile.avatar_url} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={40} /></div>}
        </div>
        <h2 className="text-xl font-extrabold flex items-center gap-2">
            {profile.full_name || "Utilisateur"} {profile.is_pro && <ShieldCheck size={20} className="text-green-500" />}
        </h2>
        <div className="flex items-center gap-1 mt-1 text-sm font-bold">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            {averageRating ? <span>{averageRating} <span className="text-gray-400 font-normal">({reviews.length} avis)</span></span> : <span className="text-gray-400 font-normal">Nouveau</span>}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-gray-500 font-medium mb-6">
            <span className="flex items-center gap-1"><MapPin size={14} /> {profile.city || 'Comores'}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> Membre depuis {new Date(profile.created_at).getFullYear()}</span>
        </div>

        {/* NOUVEAU : DESCRIPTION VENDEUR */}
        {profile.description && (
            <div className="px-4 py-4 bg-gray-50/50 rounded-2xl w-full text-left border border-gray-100 mb-6">
                <h3 className="font-bold text-[10px] uppercase tracking-wider mb-2 opacity-50">À propos</h3>
                <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700">{profile.description}</p>
            </div>
        )}

        {/* LIENS PRO */}
        {profile.is_pro && (profile.facebook_url || profile.instagram_url) && (
            <div className="flex gap-3 mb-6">
                {profile.facebook_url && <a href={profile.facebook_url} target="_blank" className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md"><Facebook size={14} /> Facebook</a>}
                {profile.instagram_url && <a href={profile.instagram_url} target="_blank" className="flex items-center gap-2 bg-gradient-to-tr from-[#FFD600] to-[#D800B9] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md"><Instagram size={14} /> Instagram</a>}
            </div>
        )}

        {/* NAVIGATION ONGLETS */}
        <div className="flex w-full border-t border-gray-100">
            <button onClick={() => setActiveTab('listings')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition ${activeTab === 'listings' ? 'border-brand text-brand' : 'border-transparent text-gray-400'}`}>Annonces ({products.length})</button>
            <button onClick={() => setActiveTab('reviews')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition ${activeTab === 'reviews' ? 'border-brand text-brand' : 'border-transparent text-gray-400'}`}>Avis ({reviews.length})</button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="p-4">
        {activeTab === 'listings' ? (
            <div className="grid grid-cols-2 gap-3">
                {products.map(product => {
                    let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                    return (
                        <Link key={product.id} href={`/annonce/${product.id}`} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col active:scale-95 transition">
                            <div className="relative aspect-square">{img && <Image src={img} alt="" fill className="object-cover" />}</div>
                            <div className="p-3">
                                <h3 className="font-bold text-sm truncate">{product.title}</h3>
                                <p className="text-brand font-extrabold text-sm">{new Intl.NumberFormat('fr-KM').format(product.price)} KMF</p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        ) : (
            <div className="space-y-4">
                {currentUser && currentUser.id !== params.id && (
                    <button onClick={() => setShowReviewModal(true)} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition"><Plus size={18} /> Laisser un avis</button>
                )}
                {reviews.map(review => (
                    <div key={review.id} className="bg-white p-4 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden relative border border-gray-100">
                                    {review.reviewer?.avatar_url ? <Image src={review.reviewer.avatar_url} alt="" fill className="object-cover" /> : <User size={16} className="m-auto text-gray-400" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm leading-none">{review.reviewer?.full_name || 'Anonyme'}</p>
                                    <div className="flex text-yellow-400 mt-1">
                                        {[...Array(5)].map((_, i) => (<Star key={i} size={10} className={i < review.rating ? "fill-current" : "text-gray-200 fill-gray-200"} />))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        {review.comment && <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">{review.comment}</p>}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}