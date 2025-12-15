'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, TouchEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, ArrowLeft, Send, Heart, Loader2, CheckCircle, User, ArrowRight, X, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

// --- SÉCURITÉ ---
const NUMBER_WORDS: { [key: string]: string } = {
  'zero': '0', 'zéro': '0', 'un': '1', 'une': '1', 'deux': '2', 'trois': '3', 'quatre': '4',
  'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9', 'dix': '10', 'vingt': '20',
  'trente': '30', 'quarante': '40', 'cinquante': '50', 'soixante': '60', 'soixante-dix': '70',
  'quatre-vingt': '80', ' quatre-vingt-dix': '90'
}

const detectForbiddenContent = (text: string) => {
  let normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  Object.keys(NUMBER_WORDS).forEach(word => {
     normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), NUMBER_WORDS[word])
  })
  const digitsOnly = normalized.replace(/\D/g, '')
  const hasLongNumber = digitsOnly.length >= 6
  const hasKeyword = /(wh?ats?app?|t[ée]l|phone|appel|joindre|contact|06|07|\+269|269)/i.test(normalized)
  return hasLongNumber || hasKeyword
}

export default function AnnoncePage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // --- GESTION IMAGES & LIGHTBOX ---
  const [images, setImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  
  // --- GESTION DU SWIPE (GLISSEMENT) ---
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const minSwipeDistance = 50 // Distance minimum pour considérer un swipe

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      if (user) {
         const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
         setUserProfile(profile)
         const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
         setFavorites(new Set(favs?.map((f: any) => f.product_id)))
      }

      const { data: productData } = await supabase.from('products').select('*, profiles(*)').eq('id', params.id).single()
      
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return router.push('/publier')
    if (!message.trim()) return

    if (!userProfile?.is_pro && detectForbiddenContent(message)) {
        toast.error("ACTION BLOQUÉE : Partage de coordonnées interdit.")
        return
    }

    setSending(true)
    const { error } = await supabase.from('messages').insert({
        content: message, sender_id: currentUser.id, receiver_id: product.user_id, product_id: product.id
    })

    if (error) toast.error("Erreur : " + error.message)
    else {
        toast.success("Message envoyé !")
        setMessage('')
    }
    setSending(false)
  }

  const toggleFavorite = async () => {
    if (!currentUser) return router.push('/publier')
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

  const handleWhatsAppClick = () => {
    if (!product.profiles.is_pro) return;
    const phone = product.whatsapp_number.replace(/\D/g, '')
    const text = encodeURIComponent(`Bonjour, pour votre annonce "${product.title}"...`)
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  // Navigation Lightbox
  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0))
  }
  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0))
  }

  // --- LOGIQUE DU SWIPE ---
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(0) // Reset
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && images.length > 1) {
        nextImage()
    }
    if (isRightSwipe && images.length > 1) {
        prevImage()
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>
  if (!product) return <div className="h-screen flex items-center justify-center text-gray-500">Annonce introuvable</div>

  const isOwner = currentUser?.id === product.user_id
  const isFav = favorites.has(product.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* HEADER IMAGE */}
      <div className="relative w-full h-80 bg-gray-200 group cursor-pointer" onClick={() => setLightboxIndex(selectedImageIndex)}>
        <Image 
            src={images[selectedImageIndex] || '/placeholder.png'} 
            alt={product.title} 
            fill 
            className="object-cover transition duration-300" 
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
            <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition backdrop-blur-md">Agrandir</span>
        </div>

        <div className="absolute top-0 left-0 w-full p-4 pt-safe flex justify-between items-start bg-linear-to-b from-black/50 to-transparent pointer-events-none">
            <button onClick={(e) => {e.stopPropagation(); router.back()}} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition pointer-events-auto"><ArrowLeft size={20} /></button>
            <div className="flex gap-2 pointer-events-auto">
                <button onClick={(e) => {e.stopPropagation(); toggleFavorite()}} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition">
                    <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : ""} />
                </button>
            </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide pointer-events-auto">
            {images.map((img: string, i: number) => (
                <button 
                    key={i} 
                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i) }} 
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition ${selectedImageIndex === i ? 'border-brand scale-105' : 'border-white/50'}`}
                >
                    <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                </button>
            ))}
        </div>
      </div>

      {/* --- LIGHTBOX (PLEIN ÉCRAN) AVEC SWIPE --- */}
      {lightboxIndex !== null && (
        <div 
            className="fixed inset-0 z-100 bg-black flex items-center justify-center animate-in fade-in duration-200"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Bouton Fermer (REMIS À DROITE et z-index augmenté) */}
            <button 
                onClick={() => setLightboxIndex(null)} 
                className="absolute top-safe right-4 z-30 text-white/80 hover:text-white p-2 bg-black/20 rounded-full"
            >
                <X size={32} />
            </button>

            {/* Image */}
            <div className="relative w-full h-full max-h-[80vh] aspect-square md:aspect-auto pointer-events-none">
                <Image 
                    src={images[lightboxIndex]} 
                    alt="Plein écran" 
                    fill 
                    className="object-contain" 
                    priority
                />
            </div>

            {/* Navigation (Si plus d'1 image) */}
            {images.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition z-20"><ChevronLeft size={40} /></button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition z-20"><ChevronRight size={40} /></button>
                    
                    {/* Compteur */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-white text-sm font-bold backdrop-blur-md z-20">
                        {lightboxIndex + 1} / {images.length}
                    </div>
                </>
            )}
        </div>
      )}

      {/* --- INFOS PRODUIT --- */}
      <div className="px-5 py-6 -mt-6 bg-white rounded-t-3xl relative z-10 min-h-[50vh]">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1">{product.title}</h1>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <MapPin size={12} /> {product.location_city}, {product.location_island}
                </div>
            </div>
            <div className="text-right">
                <p className="text-xl font-extrabold text-brand">{new Intl.NumberFormat('fr-KM').format(product.price)} KMF</p>
                <span className="text-[10px] text-gray-400">{new Date(product.created_at).toLocaleDateString()}</span>
            </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden relative">
                    {product.profiles?.avatar_url ? <Image src={product.profiles.avatar_url} alt="" fill className="object-cover" /> : <User size={20} />}
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-900 flex items-center gap-1">
                        {product.profiles?.full_name}
                        {product.profiles?.is_pro && <CheckCircle size={12} className="text-blue-500 fill-blue-100" />}
                    </p>
                    <p className="text-xs text-gray-400">{product.profiles?.is_pro ? 'Vendeur PRO' : 'Particulier'}</p>
                </div>
            </div>
            {product.profiles?.is_pro && (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded border border-green-200">VERIFIÉ</span>
            )}
        </div>

        <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>

        {/* --- ZONE CONTACT --- */}
        {!isOwner && (
            <div className="space-y-3 pb-8">
                {product.profiles?.is_pro ? (
                    <button 
                        onClick={handleWhatsAppClick}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition transform active:scale-95"
                    >
                        <Phone size={20} /> Discuter sur WhatsApp
                    </button>
                ) : (
                    <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 items-start">
                        <ShieldAlert size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800">
                            Ce vendeur est un particulier. Les numéros sont masqués pour votre sécurité. Utilisez la messagerie ci-dessous.
                        </p>
                    </div>
                )}

                <div className="border-t border-gray-100 pt-4 mt-4">
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Send size={16} className="text-brand" /> Envoyer un message</h4>
                    <form onSubmit={handleSendMessage} className="relative">
                        <textarea 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none pr-12 transition-all"
                            rows={2}
                            placeholder={userProfile?.is_pro ? "Écrivez votre message..." : "Pas de numéros autorisés ici..."}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={sending || !message.trim()}
                            className="absolute right-2 bottom-2 bg-brand text-white p-2 rounded-lg hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                        </button>
                    </form>
                    {!userProfile?.is_pro && <p className="text-[10px] text-gray-400 mt-2 text-center">Le partage de coordonnées est bloqué pour les comptes gratuits.</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  )
}