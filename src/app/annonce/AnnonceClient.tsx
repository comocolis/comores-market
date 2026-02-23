'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, TouchEvent, useCallback, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  MapPin, ArrowLeft, Send, Heart, Loader2, 
  User, ChevronRight, Share2, Flag, ChevronLeft, ChevronRight as ChevronRightIcon,
  X, Crown, Sparkles, MessageCircle, Clock,
  AlertTriangle, ShieldCheck,
  Grid, Camera,
  Calendar, Gauge, Fuel, Layers, Truck, Anchor, Ruler, Wrench, Maximize, Home, Shirt, Type, Gem, Watch, HardDrive, Zap, Music, Book, Plane, DollarSign, Utensils, GraduationCap, MapPin as MapPinIcon, Star, Briefcase, Lock, Scissors
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { formatDistanceToNow } from '@/utils/dateUtils'
import { 
  trackProductView, 
  trackAddToFavorites, 
  trackMessageSent, 
  trackEvent 
} from '@/lib/analytics'
// --- DICTIONNAIRE DES ICÔNES ---
const ICON_MAP: Record<string, any> = {
    'Année': Calendar,
    'Kilométrage': Gauge,
    'Carburant': Fuel,
    'Boîte': Layers,
    'Cylindrée (cc)': Zap,
    'Tonnage': Truck,
    'Type': Anchor, 
    'Longueur (m)': Ruler,
    'État': Sparkles,
    'Compatible avec': Wrench,
    'Surface (m²)': Maximize,
    'Pièces': Home,
    'Papier/Titre': ShieldCheck,
    'Accès Voiture': Truck,
    'Chambres': Home,
    'Meublé': Layers,
    'Paiement': Calendar,
    'Emplacement': MapPinIcon,
    'Pointure': Ruler,
    'Marque': Type, 
    'Taille': Shirt,
    'Matière': Gem, 
    'Stockage': HardDrive,
    'Processeur': Zap,
    'RAM': Layers,
    'Plateforme': Zap,
    'Conso': Zap,
    'Instrument': Music,
    'Genre': Book,
    'Langue': Type,
    'Destination': Plane,
    'Départ prévu': Calendar,
    'Origine': MapPinIcon,
    'Vendu par': DollarSign,
    'Dispo': Clock,
    'Conservation': Lock,
    'Niveau': GraduationCap,
    'Format': Layers,
    'Spécialité': Wrench,
    'Déplacement': Truck,
    'Authenticité': ShieldCheck,
    'Service': Scissors,
    'Lieu': Home,
    'Contrat': Briefcase,
    'Secteur': Layers,
    'Expérience': Star,
    'Diplôme': GraduationCap
};

const getOptimizedImage = (url: string | null, width = 800) => {
  if (!url || url === 'undefined' || url === 'null' || url.trim() === '') {
    return '/placeholder.png'; 
  }
  return url;
};

// ✅ FONCTION DE TRACKING GOOGLE ADS
declare global {
  interface Window {
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

function AnnonceContent() {
  const supabase = createClient()
  const router = useRouter()
  // MODIFICATION: Use searchParams instead of params
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
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
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([])
  
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const minSwipeDistance = 50 
  const viewLogged = useRef(false)

  // --- PARSING INTELLIGENT DE LA DESCRIPTION ---
  const descriptionParts = product?.description?.split('--- ✨ CARACTÉRISTIQUES ---') || []
  const mainDescription = descriptionParts[0]?.trim() || ''
  const rawSpecs = descriptionParts.length > 1 ? descriptionParts[1].trim() : null
  
  const specsList = rawSpecs 
    ? rawSpecs.split('\n').filter((line: string) => line.trim() !== '').map((line: string) => {
        const parts = line.replace('• ', '').split(' : ');
        return parts.length === 2 ? parts : null;
    }).filter(Boolean)
    : []

  const getData = useCallback(async () => {
    if (!id) {
        setLoading(false)
        return
    }
    
    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    
    if (user) {
       const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id)
       setFavorites(new Set(favs?.map((f: any) => f.product_id)))
    }

    // Fetch Product
    const { data: productData, error } = await supabase
        .from('products')
        .select(`
          id, title, price, description, images, location_island, location_city, created_at, user_id, whatsapp_number, sub_category,
          profiles(full_name, avatar_url, is_pro, subscription_end_date, phone_number)
        `)
        .eq('id', id)
        .single()
      
    if (productData) {
        setProduct(productData)
    } else if (!productData && !error) {
        // ID not found but no error (e.g. invalid status)
        setProduct(null)
    } else {
        console.error("Product fetch error:", error);
    }
    setLoading(false)
  }, [supabase, id])

  useEffect(() => { getData() }, [getData])

  useEffect(() => {
    if (product?.images) {
      try {
        const imgs = JSON.parse(product.images)
        setImages(Array.isArray(imgs) ? imgs : [product.images])
      } catch {
        setImages([product.images])
      }
    }
  }, [product])

  // --- TRACKING VUE PRODUIT ---
  useEffect(() => {
    const logView = async () => {
        if (viewLogged.current || !product) return
        viewLogged.current = true
        
        // 1. Tracking Supabase (Interne)
        if (currentUser?.id !== product.user_id) {
            await supabase.from('product_views').insert({ product_id: product.id, viewer_id: currentUser?.id || null })
        }

        // 2. Tracking Google Analytics (GA4)
        trackProductView(
            product.id,
            product.title,
            product.price,
            product.sub_category || 'Autre'
        )
    }
    logView()
  }, [product, currentUser, supabase])

  // --- INTELLIGENT PRODUCT SUGGESTIONS ---
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!product) return

      const { data: allProducts } = await supabase
        .from('products')
        .select('id, title, price, images, location_island, location_city, sub_category, created_at')
        .neq('id', product.id) 
        .limit(50) 

      if (!allProducts) return

      const scoredProducts = allProducts.map((p: any) => {
        let score = 0
        if (p.sub_category === product.sub_category) score += 50
        const priceRangeLow = product.price * 0.7
        const priceRangeHigh = product.price * 1.3
        if (p.price >= priceRangeLow && p.price <= priceRangeHigh) score += 30
        if (p.location_island === product.location_island) score += 15
        const isBoosted = p.boosted_until && new Date(p.boosted_until) > new Date()
        if (isBoosted) score += 10
        const daysSinceCreation = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceCreation < 7) score += 5

        return { ...p, similarityScore: score }
      })

      const topSuggestions = scoredProducts
        .sort((a: any, b: any) => b.similarityScore - a.similarityScore)
        .slice(0, 6)

      setSuggestedProducts(topSuggestions)
    }

    fetchSuggestions()
  }, [product, supabase])

  const submitReport = async () => {
    if (!reportReason.trim()) return toast.error("Veuillez indiquer un motif.")
    setReporting(true)
    const { error } = await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        product_id: product.id,
        reason: reportReason
    })
    if (error) toast.error("Erreur")
    else {
        toast.success("Signalement envoyé")
        setShowReportModal(false)
        setReportReason('')
    }
    setReporting(false)
  }

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (lightboxIndex !== null) setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0))
    else setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (lightboxIndex !== null) setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0))
    else setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const onTouchStart = (e: TouchEvent) => { setTouchEnd(0); setTouchStart(e.targetTouches[0].clientX) }
  const onTouchMove = (e: TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX) }
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
    if (error) toast.error("Erreur")
    else { 
        toast.success("Message envoyé !"); 
        setMessage('');
        trackMessageSent('internal_chat', product.id, 'text');
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
        trackAddToFavorites(product.id, product.title, product.price)
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
    
    // ✅ TRACKING CONVERSION GOOGLE ADS
    if (typeof window !== 'undefined' && window.gtag_report_conversion) {
      window.gtag_report_conversion();
    }

    // 📊 TRACKING ANALYTICS
    trackEvent('contact_whatsapp', {
        listing_id: product.id,
        listing_title: product.title,
        seller_id: product.user_id
    });

    const phone = product.whatsapp_number.replace(/\D/g, '')
    const currentUrl = window.location.href;
    const formattedPrice = new Intl.NumberFormat('fr-KM').format(product.price);
    
    let messageBody = `Salam ! Je suis intéressé par votre annonce *${product.title}* à ${formattedPrice} KMF sur Comores Market.\n\n`;
    messageBody += `Est-ce toujours disponible ?\n\n`;
    messageBody += `Lien de l'annonce : ${currentUrl}`;

    const text = encodeURIComponent(messageBody);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-brand" size={40} /></div>
  if (!product) return <div className="min-h-dvh flex items-center justify-center text-gray-500 bg-[#F8FAFC]">Annonce introuvable ou chargement...</div>

  const isOwner = currentUser?.id === product.user_id
  const isFav = favorites.has(product.id)
  const seller = Array.isArray(product.profiles) ? product.profiles[0] : product.profiles;
  
  const daysRemaining = seller?.subscription_end_date 
    ? Math.ceil((new Date(seller.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : 0;
  const isProActive = seller?.is_pro && daysRemaining > 0;
  const isBoosted = product.boosted_until && new Date(product.boosted_until) > new Date();

  return (
    <div className="min-h-dvh bg-[#F8FAFC] pb-12 font-sans text-gray-900 overflow-x-hidden flex flex-col relative">
      
      {/* HEADER ACTIONS */}
      <div className="sticky top-0 w-full h-0 overflow-visible z-10 pointer-events-none">
          <div className="p-4 pt-safe flex justify-between items-center w-full">
            <button 
                onClick={() => router.back()}
                aria-label="Retour"
                className="p-3 bg-white/90 backdrop-blur-md rounded-full text-brand shadow-lg border border-white active:scale-90 transition pointer-events-auto"
            >
                <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="flex gap-2 pointer-events-auto">
                <button onClick={handleShare} aria-label="Partager" className="p-3 bg-white/90 backdrop-blur-md rounded-full text-brand shadow-lg border border-white active:scale-90 transition">
                    <Share2 size={20} strokeWidth={2.5} />
                </button>
                <button onClick={toggleFavorite} aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"} className="p-3 bg-white/90 backdrop-blur-md rounded-full text-brand shadow-lg border border-white active:scale-90 transition">
                    <Heart size={20} strokeWidth={2.5} className={isFav ? "fill-brand text-brand" : ""} />
                </button>
                <button onClick={() => setShowReportModal(true)} aria-label="Signaler l'annonce" className="p-3 bg-white/90 backdrop-blur-md rounded-full text-red-500 shadow-lg border border-white active:scale-90 transition">
                    <Flag size={20} strokeWidth={2.5} />
                </button>
            </div>
          </div>
      </div>

      {/* GALERIE PHOTO */}
      <div className="relative w-full h-[55vh] bg-gray-900 group cursor-pointer shadow-inner" onClick={() => setLightboxIndex(selectedImageIndex)}>
        <Image 
          src={getOptimizedImage(images[selectedImageIndex], 1000)} 
          alt={product.title} 
          fill 
          className="object-cover opacity-90 transition duration-700" 
          priority={true} 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="absolute bottom-16 left-6 flex gap-2">
            {isBoosted && <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg flex items-center gap-1"><Sparkles size={10} /> Sponsorisé</span>}
            <span className="bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
                <Camera size={10} /> {selectedImageIndex + 1}/{images.length}
            </span>
        </div>

        <div className="absolute bottom-12 left-0 w-full flex justify-center gap-2 px-6 overflow-x-auto scrollbar-hide">
            {images.map((img: string, i: number) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i) }}
                  aria-label={`Voir l'image ${i + 1}`}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-300 ${selectedImageIndex === i ? 'border-brand scale-110 shadow-xl' : 'border-white/40 opacity-50'}`}>
                    <Image 
                        src={getOptimizedImage(img, 150)} 
                        alt="" 
                        width={48} 
                        height={48} 
                        className="object-cover w-full h-full"
                        sizes="48px"
                    />
                </button>
            ))}
        </div>
      </div>

      {/* CONTENU INFO */}
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-6 py-10 -mt-10 bg-white rounded-t-[3.5rem] relative z-10 min-h-screen shadow-sm border-t border-white">
        <div className="max-w-2xl mx-auto">
            
            {isBoosted && (
              <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl shadow-amber-500/20">
                <Sparkles size={14} fill="currentColor" /> Vedette Elite
              </div>
            )}

            <div className="flex justify-between items-start mb-8 gap-4">
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900 leading-snug mb-2 tracking-tight flex items-center gap-2">
                        {product.title} 
                        {isProActive && <Crown size={20} className="text-amber-500 fill-amber-500" />}
                    </h1>
                    {/* SOUS-CATÉGORIE */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <div className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-200">
                            {product.sub_category || "Divers"}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-black tracking-widest">
                            <MapPin size={12} className="text-brand" /> {product.location_city}, {product.location_island}
                        </div>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-brand tracking-tighter">
                        {new Intl.NumberFormat('fr-KM').format(product.price)} KMF
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-gray-300 font-black uppercase mt-1 tracking-tighter">
                        <Clock size={10} /> {formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}
                    </div>
                </div>
            </div>

            {/* PROFIL VENDEUR */}
            <div className="flex flex-col gap-4 mb-8">
              <Link href={`/profil?id=${product.user_id}`} className="bg-gray-50 p-5 rounded-[2.5rem] border border-white flex items-center justify-between active:scale-[0.98] transition shadow-sm">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-[1.8rem] flex items-center justify-center overflow-hidden relative border-4 border-white shadow-md bg-white">
                          {seller?.avatar_url ? (
                            <Image 
                                src={getOptimizedImage(seller.avatar_url, 200)} 
                                alt="" 
                                fill 
                                className="object-cover" 
                                sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={24} /></div>
                          )}
                      </div>
                      <div>
                          <p className="font-black text-gray-900 text-sm tracking-tight flex items-center gap-1.5">
                            {seller?.full_name || "Utilisateur"} 
                            {isProActive && <ShieldCheck size={16} className="text-brand fill-brand/10" />}
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 mt-0.5">{isProActive ? 'Compte Pro' : 'Particulier'}</p>
                      </div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl text-brand shadow-sm border border-gray-100"><ChevronRight size={20} /></div>
              </Link>
            </div>

            {/* FICHE TECHNIQUE */}
            {specsList.length > 0 && (
                <div className="bg-[#F8FAFC] p-6 rounded-[2.5rem] border border-gray-100 mb-8">
                    <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                        <Grid size={14} /> Fiche Technique
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {specsList.map(([label, value]: string[], i: number) => {
                            if(!value) return null;
                            const IconComponent = ICON_MAP[label] || Sparkles;
                            
                            return (
                                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-white flex flex-col relative overflow-hidden">
                                    <IconComponent className="absolute -right-2 -bottom-2 text-gray-50 opacity-20 rotate-[-15deg]" size={40} />
                                    <span className="text-[9px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                                        {label}
                                    </span>
                                    <span className="text-sm font-bold text-gray-900 truncate relative z-10">{value}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="mb-12">
                <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Description</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium italic border-l-4 border-gray-50 pl-6 py-2">
                  "{mainDescription}"
                </p>
            </div>

            {!isOwner && (
                <div className="space-y-4 pb-20">
                    {/* BOUTON WHATSAPP OFFICIEL SÉCURISÉ */}
                    {isProActive && (
                        <button 
                            onClick={handleWhatsAppClick} 
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3.5 px-6 rounded-full shadow-lg shadow-green-500/20 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            {/* Logo WhatsApp Officiel (SVG) */}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="shrink-0">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span className="text-sm">Discuter sur WhatsApp</span>
                        </button>
                    )}
                    
                    <div className="bg-gray-50 p-7 rounded-[2.5rem] border border-white">
                        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><MessageCircle size={14} className="text-brand" /> Contacter en privé</h4>
                        <form onSubmit={handleSendMessage} className="relative">
                            <textarea className="w-full bg-white border-none rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-brand/5 outline-none pr-16 transition-all min-h-25 resize-none shadow-sm" placeholder="Votre message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                            <button type="submit" disabled={sending || !message.trim()} className="absolute right-4 bottom-4 bg-brand text-white p-3.5 rounded-xl shadow-lg active:scale-90 transition disabled:opacity-30">
                                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* SUGGESTIONS INTELLIGENTES */}
            {suggestedProducts.length > 0 && (
                <div className="mt-12 mb-8">
                    <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                        <Sparkles size={14} className="text-brand" /> Annonces similaires
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {suggestedProducts.map((suggested: any) => {
                            let img = null
                            try { img = JSON.parse(suggested.images)[0] } catch {}
                            const isBoosted = suggested.boosted_until && new Date(suggested.boosted_until) > new Date()
                            
                            return (
                                <Link 
                                    key={suggested.id} 
                                    href={`/annonce?id=${suggested.id}`} 
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all"
                                >
                                    <div className="relative w-full aspect-square bg-gray-100">
                                        {img && (
                                            <Image 
                                                src={img} 
                                                alt={suggested.title} 
                                                fill 
                                                className="object-cover"
                                                sizes="50vw"
                                            />
                                        )}
                                        {isBoosted && (
                                            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                                                <Sparkles size={8} /> VEDETTE
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">
                                            {suggested.location_island}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-bold text-xs text-gray-900 truncate mb-1">{suggested.title}</h3>
                                        <p className="text-sm font-black text-brand">{new Intl.NumberFormat('fr-KM').format(suggested.price)} KMF</p>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 flex items-center gap-1">
                                            <MapPin size={8} /> {suggested.location_city}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}

        </div>
      </motion.div>

      {/* LIGHTBOX & MODAL */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <div 
            className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 z-1000 bg-black animate-in fade-in flex justify-center"
            onTouchStart={onTouchStart} 
            onTouchMove={onTouchMove} 
            onTouchEnd={onTouchEndAction}
          >
              <div className="w-full h-full relative flex items-center justify-center">
                  <button 
                    onClick={() => setLightboxIndex(null)}
                    aria-label="Fermer le mode plein écran"
                    className="absolute top-8 right-6 z-1020 p-3 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition shadow-lg"
                  >
                    <X size={24} />
                  </button>
                  
                  <TransformWrapper centerOnInit={true}>
                    <TransformComponent 
                        wrapperStyle={{ width: "100%", height: "100%" }} 
                        contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <img 
                        src={getOptimizedImage(images[lightboxIndex], 1200)} 
                        alt={product?.title || "Product image"} 
                        className="max-w-full max-h-full object-contain" 
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                    </TransformComponent>
                  </TransformWrapper>
                  
                  {images.length > 1 && (
                      <>
                          <button 
                            onClick={prevImage}
                            aria-label="Image précédente"
                            className="absolute top-1/2 left-4 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 z-1010 active:scale-75 transition shadow-lg"
                          >
                            <ChevronLeft size={32} strokeWidth={3} />
                          </button>
                          
                          <button 
                            onClick={nextImage}
                            aria-label="Image suivante"
                            className="absolute top-1/2 right-4 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 z-1010 active:scale-75 transition shadow-lg"
                          >
                            <ChevronRightIcon size={32} strokeWidth={3} />
                          </button>
                      </>
                  )}
              </div>
          </div>
        )}

        {showReportModal && (
          <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 z-1100 bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowReportModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center border border-white" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-50 w-20 h-20 rounded-4xl flex items-center justify-center mx-auto mb-8 shadow-inner text-red-500"><AlertTriangle size={40} /></div>
                  <h3 className="font-black text-xl mb-2 tracking-tighter">Signalement</h3>
                  <textarea className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-red-100 outline-none min-h-30 resize-none mb-6 shadow-inner" placeholder="Décrivez le problème..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
                  <div className="flex flex-col gap-3">
                      <button onClick={submitReport} disabled={reporting || !reportReason.trim()} className="w-full py-5 rounded-2xl font-black text-white bg-red-600 active:scale-95 transition shadow-xl shadow-red-500/20 uppercase text-[10px] tracking-widest">{reporting ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Envoyer l'alerte"}</button>
                      <button onClick={() => setShowReportModal(false)} className="w-full py-5 rounded-2xl font-black text-gray-500 bg-gray-50 active:scale-95 transition uppercase text-[10px] tracking-widest">Annuler</button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AnnonceClient() {
    return (
        <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-brand" size={40} /></div>}>
            <AnnonceContent />
        </Suspense>
    )
}
