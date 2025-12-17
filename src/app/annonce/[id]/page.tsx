'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef, TouchEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  MapPin, Phone, ArrowLeft, Send, Heart, Loader2, CheckCircle, 
  User, ArrowRight, X, ChevronLeft, ChevronRight, 
  ChevronRight as ChevronRightIcon, Share2, Flag, ZoomIn, Crown, ShieldCheck 
} from 'lucide-react'
import { toast } from 'sonner'

export default function AnnoncePage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const [images, setImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const minSwipeDistance = 50 

  // REF POUR EVITER LE DOUBLE COMPTAGE DE VUE
  const viewLogged = useRef(false)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      if (user) {
         const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
         setFavorites(new Set(favs?.map((f: any) => f.product_id)))
      }

      // On récupère le produit + les infos du profil vendeur
      const { data: productData, error } = await supabase
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
      } else {
          console.error("Erreur chargement annonce:", error)
      }
      setLoading(false)
    }
    getData()
  }, [supabase, params.id])

  // ENREGISTREMENT DE LA VUE
  useEffect(() => {
    const logView = async () => {
        if (viewLogged.current) return
        viewLogged.current = true
        
        const { data: { user } } = await supabase.auth.getUser()
        
        await supabase.from('product_views').insert({
            product_id: params.id,
            viewer_id: user?.id || null
        })
    }
    if (product) {
        logView()
    }
  }, [product, params.id, supabase])

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
    else {
        toast.success("Message envoyé !")
        setMessage('')
    }
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

  // PARTAGE NATIF
  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: product.title,
                text: `Regarde cette annonce sur Comores Market : ${product.title} - ${product.price} KMF`,
                url: window.location.href,
            })
        } catch (error) {
            console.log('Partage annulé')
        }
    } else {
        navigator.clipboard.writeText(window.location.href)
        toast.success("Lien copié !")
    }
  }

  // SIGNALEMENT
  const handleReport = async () => {
    if (!currentUser) return router.push('/auth')
    const reason = prompt("Pourquoi signalez-vous cette annonce ? (Fraude, Inapproprié, etc.)")
    if (!reason) return

    setReporting(true)
    const { error } = await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        product_id: product.id,
        reason: reason
    })

    if (error) toast.error("Erreur lors du signalement")
    else toast.success("Signalement envoyé. Merci de votre vigilance !")
    setReporting(false)
  }

  const handleWhatsAppClick = () => {
    if (!product.whatsapp_number) return;
    const phone = product.whatsapp_number.replace(/\D/g, '')
    const text = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce "${product.title}" vue sur Comores Market.`)
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0))
  }
  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0))
  }

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(0)
    setTouchStart(e.targetTouches[0].clientX)
  }
  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (distance > minSwipeDistance && images.length > 1) nextImage()
    if (distance < -minSwipeDistance && images.length > 1) prevImage()
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>
  if (!product) return <div className="h-screen flex items-center justify-center text-gray-500">Annonce introuvable ou supprimée.</div>

  const isOwner = currentUser?.id === product.user_id
  const isFav = favorites.has(product.id)
  const isPro = product.profiles?.is_pro

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* HEADER IMAGE */}
      <div className="relative w-full h-96 bg-gray-200 group cursor-pointer" onClick={() => setLightboxIndex(selectedImageIndex)}>
        <Image 
            src={images[selectedImageIndex] || '/placeholder.png'} 
            alt={product.title} 
            fill 
            className="object-cover transition duration-300" 
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
            <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition backdrop-blur-md flex items-center gap-1">
                <ZoomIn size={14} /> Agrandir
            </span>
        </div>

        {/* BARRE OUTILS FLOTTANTE */}
        <div className="absolute top-0 left-0 w-full p-4 pt-safe flex justify-between items-start bg-linear-to-b from-black/50 to-transparent pointer-events-none">
            <button onClick={(e) => {e.stopPropagation(); router.back()}} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition pointer-events-auto">
                <ArrowLeft size={20} />
            </button>
            
            <div className="flex gap-2 pointer-events-auto">
                {/* BOUTON SIGNALER */}
                <button onClick={(e) => {e.stopPropagation(); handleReport()}} disabled={reporting} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-red-500 hover:text-white transition" title="Signaler">
                    {reporting ? <Loader2 size={20} className="animate-spin" /> : <Flag size={20} />}
                </button>
                {/* BOUTON PARTAGER */}
                <button onClick={(e) => {e.stopPropagation(); handleShare()}} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition">
                    <Share2 size={20} />
                </button>
                {/* BOUTON FAVORIS */}
                <button onClick={(e) => {e.stopPropagation(); toggleFavorite()}} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition">
                    <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : ""} />
                </button>
            </div>
        </div>

        {images.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide pointer-events-auto justify-center">
                {images.map((img: string, i: number) => (
                    <button 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i) }} 
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition ${selectedImageIndex === i ? 'border-brand scale-110 shadow-lg' : 'border-white/60 opacity-80'}`}
                    >
                        <Image src={img} alt="" width={48} height={48} className="object-cover w-full h-full" />
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* LIGHTBOX (Z-INDEX 100) */}
      {lightboxIndex !== null && (
        <div 
            className="fixed inset-0 z-100 bg-black flex items-center justify-center animate-in fade-in duration-200"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 z-50 text-white p-3 bg-black/50 rounded-full hover:bg-black/70 backdrop-blur-md transition"><X size={28} /></button>
            <div className="relative w-full h-full max-h-[85vh] aspect-square md:aspect-auto pointer-events-none p-2">
                <Image src={images[lightboxIndex]} alt="Plein écran" fill className="object-contain" priority />
            </div>
            {images.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-4 text-white hover:text-gray-300 hover:bg-white/10 rounded-full transition z-20"><ChevronLeft size={40} /></button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-4 text-white hover:text-gray-300 hover:bg-white/10 rounded-full transition z-20"><ChevronRight size={40} /></button>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-white text-sm font-bold backdrop-blur-md z-20">{lightboxIndex + 1} / {images.length}</div>
                </>
            )}
        </div>
      )}

      <div className="px-5 py-6 -mt-6 bg-white rounded-t-3xl relative z-10 min-h-[50vh] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1 flex items-center gap-1">
                    {product.title}
                    {/* Badge PRO Titre */}
                    {isPro && <ShieldCheck size={18} className="text-mustard fill-mustard/20" />}
                </h1>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <MapPin size={12} /> {product.location_city}, {product.location_island}
                </div>
            </div>
            <div className="text-right">
                {/* PRIX COULEUR MOUTARDE SI PRO */}
                <p className={`text-xl font-extrabold ${isPro ? 'text-mustard-dark' : 'text-brand'}`}>
                    {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                </p>
                <span className="text-[10px] text-gray-400">{new Date(product.created_at).toLocaleDateString()}</span>
            </div>
        </div>

        <Link href={`/profil/${product.user_id}`} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between mb-6 active:scale-[0.98] transition hover:bg-gray-100 cursor-pointer">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-500 overflow-hidden relative border shadow-sm ${isPro ? 'border-mustard ring-1 ring-mustard/30' : 'bg-gray-200 border-white'}`}>
                    {product.profiles?.avatar_url ? <Image src={product.profiles.avatar_url} alt="" fill className="object-cover" /> : <User size={20} />}
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-900 flex items-center gap-1">
                        {product.profiles?.full_name || "Utilisateur"}
                        {isPro && <Crown size={12} className="text-mustard fill-mustard" />}
                    </p>
                    <p className={`text-xs ${isPro ? 'text-mustard-dark font-bold' : 'text-gray-400'}`}>{isPro ? 'Vendeur PRO' : 'Particulier'}</p>
                </div>
            </div>
            <div className="bg-white p-2 rounded-full text-gray-400 shadow-sm">
                <ChevronRightIcon size={16} />
            </div>
        </Link>

        <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>

        {!isOwner ? (
            currentUser ? (
                <div className="space-y-3 pb-8">
                    {/* BOUTON WHATSAPP UNIQUEMENT SI LE VENDEUR EST PRO */}
                    {isPro && (
                        <button 
                            onClick={handleWhatsAppClick}
                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition transform active:scale-95"
                        >
                            <Phone size={20} /> Discuter sur WhatsApp
                        </button>
                    )}

                    <div className={`${isPro ? 'border-t border-gray-100 pt-4 mt-4' : ''}`}>
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm"><Send size={14} className="text-brand" /> Message privé</h4>
                        <form onSubmit={handleSendMessage} className="relative">
                            <textarea 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none pr-12 transition-all min-h-12.5"
                                rows={1}
                                placeholder="Votre message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                disabled={sending || !message.trim()}
                                className="absolute right-2 bottom-2 bg-brand text-white p-2 rounded-lg hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="p-6 bg-gray-50 rounded-2xl text-center border border-gray-100 mb-8">
                    <p className="text-gray-600 text-sm mb-4">Connectez-vous pour contacter le vendeur.</p>
                    <Link href="/auth" className="inline-block bg-brand text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-dark transition transform active:scale-95">
                        Se connecter
                    </Link>
                </div>
            )
        ) : null}
      </div>
    </div>
  )
}