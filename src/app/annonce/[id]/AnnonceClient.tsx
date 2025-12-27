'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef, TouchEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  MapPin, Phone, ArrowLeft, Send, Heart, Loader2, CheckCircle, 
  User, ArrowRight, X, ChevronLeft, ChevronRight, 
  Share2, Flag, ZoomIn, Crown, ShieldCheck, AlertTriangle, 
  Sparkles, CheckCircle2, MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"

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

  // --- CORRECTIF 1 : État pour le header sombre ---
  const [isHeaderDark, setIsHeaderDark] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  const viewLogged = useRef(false)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      if (user) {
         const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
         setFavorites(new Set(favs?.map((f: any) => f.product_id)))
      }

      const { data: productData } = await supabase
        .from('products')
        .select('*, profiles(*)')
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
    }
    getData()
  }, [supabase, params.id])

  useEffect(() => {
    const logView = async () => {
        if (viewLogged.current || !product) return
        viewLogged.current = true
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id !== product.user_id) {
            await supabase.from('product_views').insert({
                product_id: product.id,
                viewer_id: user?.id || null
            })
        }
    }
    logView()
  }, [product, supabase])

  // --- CORRECTIF 1 : Écouteur de scroll ---
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      // On considère que le header devient sombre après 300px de scroll (hauteur approximative de l'image)
      if (scrollPosition > 300) {
        setIsHeaderDark(true)
      } else {
        setIsHeaderDark(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  // --- LOGIQUE DE SIGNALEMENT ---
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

  // --- NAVIGATION IMAGES & SWIPE ---
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F0F2F5]"><Loader2 className="animate-spin text-brand" size={40} /></div>
  if (!product) return <div className="h-screen flex items-center justify-center text-gray-500 bg-[#F0F2F5]">Annonce introuvable.</div>

  const isOwner = currentUser?.id === product.user_id
  const isFav = favorites.has(product.id)
  const isPro = product.profiles?.is_pro

  // --- CORRECTIF 1 : Styles dynamiques des boutons du header ---
  const headerButtonStyle = isHeaderDark
    ? 'bg-white text-gray-900 border border-gray-200 shadow-md' // Fond blanc, icône noire
    : 'bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-lg' // Fond transparent, icône blanche

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-32 font-sans text-gray-900 overflow-x-hidden relative">
      
      {/* HEADER FLOTTANT (avec styles dynamiques) */}
      <div ref={headerRef} className={`fixed top-0 left-0 w-full p-4 pt-safe flex justify-between items-center z-[100] pointer-events-none transition-all duration-300 ${isHeaderDark ? 'bg-white/90 backdrop-blur-md shadow-sm' : ''}`}>
          <button onClick={() => router.back()} className={`p-3 rounded-2xl active:scale-90 transition pointer-events-auto ${headerButtonStyle}`}>
            <ArrowLeft size={22} />
          </button>
          
          <div className="flex gap-2 pointer-events-auto">
              <button onClick={handleShare} className={`p-3 rounded-2xl active:scale-90 transition ${headerButtonStyle}`}>
                <Share2 size={20} />
              </button>
              <button onClick={toggleFavorite} className={`p-3 rounded-2xl active:scale-90 transition ${headerButtonStyle}`}>
                <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : ""} />
              </button>
              <button onClick={() => setShowReportModal(true)} className={`p-3 rounded-2xl active:scale-90 transition ${headerButtonStyle} ${!isHeaderDark ? 'bg-white/10 text-white/50 border-white/10 hover:text-red-400' : ''}`}>
                <Flag size={20} />
              </button>
          </div>
      </div>

      {/* GALERIE */}
      <div className="relative w-full h-[50vh] bg-gray-900 group cursor-pointer" onClick={() => setLightboxIndex(selectedImageIndex)}>
        <Image src={images[selectedImageIndex] || '/placeholder.png'} alt={product.title} fill className="object-cover opacity-90 transition duration-700 group-hover:scale-105" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        <div className="absolute bottom-10 left-0 w-full flex justify-center gap-2 px-4 overflow-x-auto scrollbar-hide">
            {images.map((img: string, i: number) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i) }} 
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-300 ${selectedImageIndex === i ? 'border-brand scale-110 shadow-xl' : 'border-white/40 opacity-60'}`}>
                    <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                </button>
            ))}
        </div>
      </div>

      {/* CARTE CONTENU */}
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-6 py-8 -mt-8 bg-white rounded-t-[3rem] relative z-10 min-h-[50vh] shadow-sm border-t border-white">
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-start mb-8">
                <div className="flex-1 pr-4">
                    <h1 className="text-2xl font-black leading-tight mb-2 tracking-tight flex items-center gap-2">
                        {product.title} {isPro && <CheckCircle2 size={20} className="text-brand" />}
                    </h1>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-black uppercase tracking-widest">
                        <MapPin size={14} className="text-brand/50" /> {product.location_city}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-brand tracking-tighter">
                        {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-gray-300 font-bold uppercase mt-1">
                        <Sparkles size={10} /> {new Date(product.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>

            <Link href={`/profil/${product.user_id}`} className="bg-[#F5F7F9] p-5 rounded-[2rem] border border-white flex items-center justify-between mb-10 active:scale-[0.98] transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden relative border-4 border-white shadow-sm ${isPro ? 'bg-brand/10' : 'bg-gray-200'}`}>
                        {product.profiles?.avatar_url ? <Image src={product.profiles.avatar_url} alt="" fill className="object-cover" /> : <User size={24} className="text-gray-400" />}
                    </div>
                    <div>
                        <p className="font-black text-gray-900 flex items-center gap-1.5">{product.profiles?.full_name || "Utilisateur"} {isPro && <Crown size={14} className="text-brand fill-brand" />}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isPro ? 'Vendeur Professionnel' : 'Vendeur Particulier'}</p>
                    </div>
                </div>
                <div className="bg-white p-3 rounded-2xl text-brand shadow-sm border border-gray-100"><ChevronRight size={20} /></div>
            </Link>

            <div className="mb-12">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Description</h3>
                <p className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-line font-medium">{product.description}</p>
            </div>

            {!isOwner && (
                <div className="space-y-4 pb-12">
                    {isPro && (
                        <button onClick={handleWhatsAppClick} className="w-full bg-[#25D366] text-white font-black py-5 rounded-[1.8rem] flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest">
                            <Phone size={20} fill="currentColor" /> WhatsApp Direct
                        </button>
                    )}
                    <div className="bg-[#F5F7F9] p-6 rounded-[2.2rem] border border-white">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MessageCircle size={14} className="text-brand" /> Message privé</h4>
                        <form onSubmit={handleSendMessage} className="relative">
                            <textarea className="w-full bg-white border-none rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-brand/5 outline-none pr-14 transition-all min-h-[80px] resize-none shadow-sm" placeholder="Votre message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                            <button type="submit" disabled={sending || !message.trim()} className="absolute right-3 bottom-3 bg-brand text-white p-3 rounded-xl shadow-lg active:scale-90 transition-all disabled:opacity-30">
                                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
      </motion.div>

      {/* LIGHTBOX (Avec CORRECTIF 2: Swipe) */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[200] bg-black animate-in fade-in" 
          onTouchStart={onTouchStart} 
          onTouchMove={onTouchMove} 
          onTouchEnd={onTouchEndAction}
        >
            <button onClick={() => setLightboxIndex(null)} className="absolute top-10 right-6 z-[210] text-white p-3 bg-white/10 backdrop-blur-md rounded-full"><X size={28} /></button>
            <TransformWrapper centerOnInit={true}><TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }}><img src={images[lightboxIndex]} alt="" className="max-h-screen max-w-full object-contain" /></TransformComponent></TransformWrapper>
            {images.length > 1 && <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-white text-xs font-black tracking-widest border border-white/10 z-[210]">{lightboxIndex + 1} / {images.length}</div>}
            
            {/* CORRECTIF 2 : Boutons de navigation (facultatifs si le swipe fonctionne) */}
            {images.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute top-1/2 left-4 -translate-y-1/2 p-3 text-white bg-white/10 backdrop-blur-md rounded-full z-[210]"><ChevronLeft size={24} /></button>
                    <button onClick={nextImage} className="absolute top-1/2 right-4 -translate-y-1/2 p-3 text-white bg-white/10 backdrop-blur-md rounded-full z-[210]"><ChevronRight size={24} /></button>
                </>
            )}
        </div>
      )}

      {/* SIGNALEMENT */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowReportModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center border border-white" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner text-red-500"><AlertTriangle size={40} /></div>
                  <h3 className="font-black text-2xl mb-4 tracking-tight">Signalement</h3>
                  <textarea className="w-full bg-[#F5F7F9] border-none rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-red-500/5 outline-none min-h-[120px] resize-none mb-6" placeholder="Motif..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
                  <div className="flex flex-col gap-3">
                      <button onClick={submitReport} disabled={reporting || !reportReason.trim()} className="w-full py-5 rounded-2xl font-black text-white bg-red-600 active:scale-95 transition shadow-xl shadow-red-500/20 uppercase text-xs tracking-widest">{reporting ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Envoyer"}</button>
                      <button onClick={() => setShowReportModal(false)} className="w-full py-5 rounded-2xl font-black text-gray-400 bg-[#F5F7F9] active:scale-95 transition uppercase text-xs tracking-widest">Annuler</button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}