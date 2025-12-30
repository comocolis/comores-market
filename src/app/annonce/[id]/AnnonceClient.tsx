'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef, TouchEvent, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  MapPin, Phone, ArrowLeft, Send, Heart, Loader2, 
  User, ChevronRight, Share2, Flag, ChevronLeft, ChevronRight as ChevronRightIcon,
  X, Crown, Sparkles, MessageCircle, Clock, Facebook, Instagram,
  AlertTriangle, CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"

// --- UTILITAIRE D'OPTIMISATION IMAGE ÉLITE ---
const getOptimizedImage = (url: string | null, width = 800) => {
  if (!url) return '/placeholder.png';
  if (url.includes('supabase.co')) {
    return `${url}?width=${width}&quality=75&resize=contain`;
  }
  return url;
};

export default function AnnonceClient() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [images, setImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const minSwipeDistance = 50 

  const viewLogged = useRef(false)

  // RÉCUPÉRATION DES DONNÉES CIBLÉE
  const getData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    
    if (user) {
       const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
       setFavorites(new Set(favs?.map((f: any) => f.product_id)))
    }

    // On sélectionne uniquement les colonnes nécessaires pour la performance
    const { data: productData } = await supabase
      .from('products')
      .select(`
        id, title, price, description, images, location_island, location_city, created_at, user_id, whatsapp_number, boosted_until,
        profiles(full_name, avatar_url, is_pro, facebook_url, instagram_url)
      `)
      .eq('id', params.id)
      .single()
    
    if (productData) {
        setProduct(productData)
        try {
          const imgs = JSON.parse(productData.images)
          setImages(Array.isArray(imgs) ? imgs : [productData.images])
        } catch {
          setImages([productData.images])
        }
    }
    setLoading(false)
  }, [supabase, params.id])

  useEffect(() => {
    getData()
  }, [getData])

  useEffect(() => {
    const logView = async () => {
        if (viewLogged.current || !product) return
        viewLogged.current = true
        if (currentUser?.id !== product.user_id) {
            await supabase.from('product_views').insert({
                product_id: product.id,
                viewer_id: currentUser?.id || null
            })
        }
    }
    logView()
  }, [product, currentUser, supabase])

  const submitReport = async () => {
    if (!reportReason.trim()) return toast.error("Veuillez indiquer un motif.")
    setReporting(true)
    const { error } = await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        product_id: product.id,
        reason: reportReason
    })
    if (error) {
        toast.error("Erreur lors du signalement")
    } else {
        toast.success("Signalement envoyé. Merci !")
        setShowReportModal(false)
        setReportReason('')
    }
    setReporting(false)
  }

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0))
    } else {
      setSelectedImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0))
    } else {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(0)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEndAction = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (distance > minSwipeDistance && images.length > 1) nextImage()
    if (distance < -minSwipeDistance && images.length > 1) prevImage()
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return router.push('/auth')
    if (!message.trim()) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
        content: message, 
        sender_id: currentUser.id, 
        receiver_id: product.user_id, 
        product_id: product.id
    })
    if (error) toast.error("Erreur : " + error.message)
    else { toast.success("Message envoyé !"); setMessage('') }
    setSending(false)
  }

  const toggleFavorite = async () => {
    if (!currentUser) return router.push('/auth')
    const id = product.id
    if (favorites.has(id)) {
        await supabase.from('favorites').delete().match({ user_id: currentUser.id, product_id: id })
        const newFav = new Set(favorites); newFav.delete(id); setFavorites(newFav)
        toast.info("Retiré des favoris")
    } else {
        await supabase.from('favorites').insert({ user_id: currentUser.id, product_id: id })
        setFavorites(new Set([...favorites, id]))
        toast.success("Ajouté aux favoris")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
        try { await navigator.share({ title: product.title, url: window.location.href }) } catch (e) {}
    } else {
        navigator.clipboard.writeText(window.location.href)
        toast.success("Lien copié !")
    }
  }

  const handleWhatsAppClick = () => {
    if (!product.whatsapp_number) return;
    const phone = product.whatsapp_number.replace(/\D/g, '')
    const text = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce "${product.title}" sur Comores Market.`)
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-brand" size={40} /></div>
  if (!product) return <div className="h-screen flex items-center justify-center text-gray-500 bg-[#F8FAFC]">Annonce introuvable.</div>

  const isOwner = currentUser?.id === product.user_id
  const isFav = favorites.has(product.id)
  
  // Correction TypeScript pour la structure de profiles
  const seller = Array.isArray(product.profiles) ? product.profiles[0] : product.profiles;
  const isPro = seller?.is_pro
  const isBoosted = product.boosted_until && new Date(product.boosted_until) > new Date();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans text-gray-900 overflow-x-hidden relative">
      
      {/* HEADER FIXE */}
      <div className="fixed top-0 left-0 w-full p-4 pt-safe flex justify-between items-center z-[100] pointer-events-none">
          <button onClick={() => router.back()} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-brand shadow-lg border border-white active:scale-90 transition pointer-events-auto">
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          
          <div className="flex gap-2 pointer-events-auto">
              <button onClick={handleShare} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-brand shadow-lg border border-white active:scale-90 transition">
                <Share2 size={20} strokeWidth={2.5} />
              </button>
              <button onClick={toggleFavorite} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-brand shadow-lg border border-white active:scale-90 transition">
                <Heart size={20} strokeWidth={2.5} className={isFav ? "fill-brand text-brand" : ""} />
              </button>
              <button onClick={() => setShowReportModal(true)} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-red-500 shadow-lg border border-white active:scale-90 transition">
                <Flag size={20} strokeWidth={2.5} />
              </button>
          </div>
      </div>

      {/* GALERIE PHOTO AVEC REDIMENSIONNEMENT */}
      <div className="relative w-full h-[55vh] bg-gray-900 group cursor-pointer shadow-inner" onClick={() => setLightboxIndex(selectedImageIndex)}>
        <Image 
          src={getOptimizedImage(images[selectedImageIndex]) || '/placeholder.png'} 
          alt={product.title} 
          fill 
          className="object-cover opacity-90 transition duration-700" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="absolute bottom-12 left-0 w-full flex justify-center gap-2 px-6 overflow-x-auto scrollbar-hide">
            {images.map((img: string, i: number) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i) }} 
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-300 ${selectedImageIndex === i ? 'border-brand scale-110 shadow-xl' : 'border-white/40 opacity-50'}`}>
                    <Image src={getOptimizedImage(img, 100) || '/placeholder.png'} alt="" width={48} height={48} className="object-cover w-full h-full" />
                </button>
            ))}
        </div>
      </div>

      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-6 py-10 -mt-10 bg-white rounded-t-[3.5rem] relative z-10 min-h-[50vh] shadow-sm border-t border-white">
        <div className="max-w-2xl mx-auto">
            
            {isBoosted && (
              <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl shadow-amber-500/20">
                <Sparkles size={14} fill="currentColor" /> Vedette Elite
              </div>
            )}

            <div className="flex justify-between items-start mb-8 gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-black leading-tight mb-2 tracking-tight uppercase flex items-center gap-2">
                        {product.title} 
                        {isPro && <Crown size={20} className="text-amber-500 fill-amber-500" />}
                    </h1>
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <MapPin size={12} className="text-brand" /> {product.location_city}, {product.location_island}
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-brand tracking-tighter">
                        {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-gray-300 font-black uppercase mt-1 tracking-tighter">
                        <Clock size={10} /> {new Date(product.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* VENDEUR & RÉSEAUX */}
            <div className="flex flex-col gap-4 mb-12">
              <Link href={`/profil/${product.user_id}`} className="bg-gray-50 p-5 rounded-[2.5rem] border border-white flex items-center justify-between active:scale-[0.98] transition shadow-sm">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-[1.8rem] flex items-center justify-center overflow-hidden relative border-4 border-white shadow-md bg-white">
                          {seller?.avatar_url ? (
                            <Image src={getOptimizedImage(seller.avatar_url, 150) || '/placeholder.png'} alt="" fill className="object-cover" />
                          ) : (
                            <User size={24} className="text-gray-200" />
                          )}
                      </div>
                      <div>
                          <p className="font-black text-gray-900 text-sm uppercase tracking-tight flex items-center gap-1.5">
                            {seller?.full_name || "Utilisateur"} 
                            {isPro && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 mt-0.5">{isPro ? 'Compte Pro' : 'Particulier'}</p>
                      </div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl text-brand shadow-sm border border-gray-100"><ChevronRight size={20} /></div>
              </Link>

              {(seller?.facebook_url || seller?.instagram_url) && (
                <div className="flex gap-3 px-1">
                  {seller.facebook_url && (
                    <a href={seller.facebook_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-100 text-blue-600 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition shadow-sm">
                      <Facebook size={14} fill="currentColor" /> Facebook
                    </a>
                  )}
                  {seller.instagram_url && (
                    <a href={seller.instagram_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-100 text-pink-600 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition shadow-sm">
                      <Instagram size={14} /> Instagram
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="mb-12">
                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Détails de l'offre</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium italic border-l-4 border-gray-50 pl-6 py-2">
                  "{product.description}"
                </p>
            </div>

            {!isOwner && (
                <div className="space-y-4 pb-12">
                    {isPro && (
                        <button onClick={handleWhatsAppClick} className="w-full bg-[#25D366] text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-95 transition text-[11px] uppercase tracking-[0.2em]">
                            <Phone size={20} fill="currentColor" /> WhatsApp Direct
                        </button>
                    )}
                    <div className="bg-gray-50 p-7 rounded-[2.5rem] border border-white">
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MessageCircle size={14} className="text-brand" /> Contacter en privé</h4>
                        <form onSubmit={handleSendMessage} className="relative">
                            <textarea className="w-full bg-white border-none rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-brand/5 outline-none pr-16 transition-all min-h-[100px] resize-none shadow-sm" placeholder="Votre message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                            <button type="submit" disabled={sending || !message.trim()} className="absolute right-4 bottom-4 bg-brand text-white p-3.5 rounded-xl shadow-lg active:scale-90 transition disabled:opacity-30">
                                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
      </motion.div>

      {/* LIGHTBOX */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[200] bg-white animate-in fade-in" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndAction}>
            <button onClick={() => setLightboxIndex(null)} className="absolute top-12 right-8 z-[210] text-black p-3 bg-gray-50 rounded-full active:scale-90 transition"><X size={28} strokeWidth={3} /></button>
            <TransformWrapper centerOnInit={true}>
              <TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }}>
                <img src={images[lightboxIndex]} alt="" className="max-h-screen max-w-full object-contain" />
              </TransformComponent>
            </TransformWrapper>
            {images.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute top-1/2 left-4 -translate-y-1/2 p-4 text-black z-[210] active:scale-75 transition"><ChevronLeft size={48} strokeWidth={3} /></button>
                    <button onClick={nextImage} className="absolute top-1/2 right-4 -translate-y-1/2 p-4 text-black z-[210] active:scale-75 transition"><ChevronRightIcon size={48} strokeWidth={3} /></button>
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-8 py-2.5 bg-gray-900 text-white text-[10px] font-black tracking-[0.3em] rounded-full z-[210] uppercase">{lightboxIndex + 1} / {images.length}</div>
                </>
            )}
        </div>
      )}

      {/* MODALE SIGNALEMENT AVEC AlertTriangle CORRIGÉ */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowReportModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center border border-white" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner text-red-500"><AlertTriangle size={40} /></div>
                  <h3 className="font-black text-xl mb-2 tracking-tighter">Signalement</h3>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6 leading-relaxed">Indiquez la raison du litige</p>
                  <textarea className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-red-100 outline-none min-h-[120px] resize-none mb-6 shadow-inner" placeholder="Décrivez le problème..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
                  <div className="flex flex-col gap-3">
                      <button onClick={submitReport} disabled={reporting || !reportReason.trim()} className="w-full py-5 rounded-2xl font-black text-white bg-red-600 active:scale-95 transition shadow-xl shadow-red-500/20 uppercase text-[10px] tracking-widest">{reporting ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Envoyer l'alerte"}</button>
                      <button onClick={() => setShowReportModal(false)} className="w-full py-5 rounded-2xl font-black text-gray-400 bg-gray-50 active:scale-95 transition uppercase text-[10px] tracking-widest">Annuler</button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}