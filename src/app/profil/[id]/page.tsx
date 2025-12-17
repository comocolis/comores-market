'use client'

import { createClient } from '@/utils/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { 
  MapPin, Calendar, User, ShieldCheck, ArrowLeft, Loader2, 
  Package, Facebook, Instagram, Star, MessageSquare, Plus, X, 
  Link
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

  // Gestion des onglets
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')
  
  // Modale d'ajout d'avis
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // 1. Profil Vendeur
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()
      setProfile(profileData)

      if (profileData) {
        // 2. Annonces
        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', params.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
        setProducts(productsData || [])

        // 3. Avis
        const { data: reviewsData } = await supabase
            .from('reviews')
            .select('*, reviewer:profiles(*)') // On récupère l'auteur de l'avis
            .eq('target_id', params.id)
            .order('created_at', { ascending: false })
        setReviews(reviewsData || [])
      }
      setLoading(false)
    }
    getData()
  }, [params.id, supabase])

  // Calcul de la moyenne
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null

  const handleAddReview = async () => {
      if (!currentUser) return router.push('/auth')
      if (currentUser.id === params.id) return toast.error("Vous ne pouvez pas vous noter vous-même.")
      
      setSubmittingReview(true)
      const { error } = await supabase.from('reviews').insert({
          reviewer_id: currentUser.id,
          target_id: params.id,
          rating: newRating,
          comment: newComment
      })

      if (error) {
          if (error.code === '23505') toast.error("Vous avez déjà noté ce vendeur.")
          else toast.error("Erreur lors de l'envoi")
      } else {
          toast.success("Avis publié !")
          setShowReviewModal(false)
          // Rafraîchir la page ou les données pour voir le nouvel avis
          window.location.reload()
      }
      setSubmittingReview(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-gray-500">Utilisateur introuvable.</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* MODALE AJOUT AVIS */}
      {showReviewModal && (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4 animate-in zoom-in-95">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">Noter ce vendeur</h3>
                    <button onClick={() => setShowReviewModal(false)}><X size={20} className="text-gray-400" /></button>
                </div>
                
                <div className="flex justify-center gap-2 py-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setNewRating(star)} className="transition hover:scale-110">
                            <Star size={32} className={star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                        </button>
                    ))}
                </div>

                <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand/20 outline-none resize-none min-h-24"
                    placeholder="Comment s'est passée la transaction ?"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                />

                <button 
                    onClick={handleAddReview} 
                    disabled={submittingReview}
                    className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition disabled:opacity-50"
                >
                    {submittingReview ? <Loader2 className="animate-spin mx-auto" /> : "Publier l'avis"}
                </button>
            </div>
        </div>
      )}

      {/* HEADER AVEC RETOUR */}
      <div className="bg-brand p-4 pt-safe sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-white/80 hover:bg-white/20 rounded-full transition">
                <ArrowLeft size={22} />
            </button>
            <h1 className="text-white font-bold text-lg">Profil Vendeur</h1>
        </div>
      </div>

      {/* CARTE VENDEUR */}
      <div className="bg-white p-6 pb-0 -mt-4 rounded-b-3xl shadow-sm relative z-10 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-white shadow-md relative -mt-2 mb-3 overflow-hidden">
            {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={40} /></div>
            )}
        </div>
        
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 justify-center">
            {profile.full_name || "Utilisateur"}
            {profile.is_pro && <ShieldCheck size={20} className="text-green-500 fill-green-100" />}
        </h2>
        
        {/* Note Moyenne sous le nom */}
        <div className="flex items-center gap-1 mt-1 text-sm font-bold text-gray-700">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            {averageRating ? <span>{averageRating} <span className="text-gray-400 font-normal">({reviews.length} avis)</span></span> : <span className="text-gray-400 font-normal">Nouveau vendeur</span>}
        </div>

        <div className="flex gap-4 mt-4 text-xs text-gray-500 font-medium mb-6">
            <span className="flex items-center gap-1"><MapPin size={14} /> {profile.city || 'Comores'}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> Membre depuis {new Date(profile.created_at).getFullYear()}</span>
        </div>

        {/* LIENS RESEAUX SOCIAUX */}
        {profile.is_pro && (profile.facebook_url || profile.instagram_url) && (
            <div className="flex gap-3 mb-6 w-full justify-center">
                {profile.facebook_url && (
                    <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition">
                        <Facebook size={16} /> Facebook
                    </a>
                )}
                {profile.instagram_url && (
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-linear-to-tr from-[#FFD600] via-[#FF0100] to-[#D800B9] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition">
                        <Instagram size={16} /> Instagram
                    </a>
                )}
            </div>
        )}

        {/* ONGLETS DE NAVIGATION */}
        <div className="flex w-full border-t border-gray-100">
            <button 
                onClick={() => setActiveTab('listings')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'listings' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                <Package size={18} /> Annonces ({products.length})
            </button>
            <button 
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'reviews' ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                <MessageSquare size={18} /> Avis ({reviews.length})
            </button>
        </div>
      </div>

      {/* CONTENU DES ONGLETS */}
      <div className="p-4">
        
        {/* --- ONGLET ANNONCES --- */}
        {activeTab === 'listings' && (
            <>
                {products.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 italic">Aucune autre annonce active.</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-2">
                        {products.map(product => {
                            let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                            return (
                                <Link key={product.id} href={`/annonce/${product.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                                    <div className="relative w-full aspect-square bg-gray-100">
                                        {img ? <Image src={img} alt="" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><Package /></div>}
                                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded z-10 font-medium">
                                            {product.location_island}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">{product.title}</h3>
                                        <p className="text-brand font-extrabold text-sm">{new Intl.NumberFormat('fr-KM').format(product.price)} KMF</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </>
        )}

        {/* --- ONGLET AVIS --- */}
        {activeTab === 'reviews' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                
                {/* Bouton laisser un avis */}
                {currentUser && currentUser.id !== params.id && (
                    <button 
                        onClick={() => setShowReviewModal(true)}
                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition shadow-md"
                    >
                        <Plus size={18} /> Laisser un avis
                    </button>
                )}

                {reviews.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                        <MessageSquare size={32} className="opacity-20 mb-2" />
                        <p className="italic">Aucun avis pour le moment.</p>
                    </div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                                        {review.reviewer?.avatar_url ? <Image src={review.reviewer.avatar_url} alt="" fill className="object-cover" /> : <User size={16} className="m-auto text-gray-400" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 leading-none">{review.reviewer?.full_name || 'Utilisateur'}</p>
                                        <div className="flex text-yellow-400 text-xs mt-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={10} className={i < review.rating ? "fill-current" : "text-gray-200 fill-gray-200"} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                            {review.comment && <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{review.comment}</p>}
                        </div>
                    ))
                )}
            </div>
        )}

      </div>
    </div>
  )
}