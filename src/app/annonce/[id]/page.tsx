'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, ArrowLeft, Send, Heart, Share2, ShieldAlert, Loader2, CheckCircle, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

// --- ALGORITHME DE SÉCURITÉ AVANCÉ ---

// 1. Dictionnaire des chiffres en lettres
const NUMBER_WORDS: { [key: string]: string } = {
  'zero': '0', 'zéro': '0',
  'un': '1', 'une': '1',
  'deux': '2',
  'trois': '3',
  'quatre': '4',
  'cinq': '5',
  'six': '6',
  'sept': '7',
  'huit': '8',
  'neuf': '9',
  'dix': '10',
  'vingt': '20',
  'trente': '30',
  'quarante': '40',
  'cinquante': '50',
  'soixante': '60',
  'soixante-dix': '70',
  'quatre-vingt': '80',
  ' quatre-vingt-dix': '90'
}

const detectForbiddenContent = (currentMessage: string, history: string) => {
  // A. On combine l'historique récent avec le message actuel pour contrer le découpage
  // Ex: History="06", Msg="39" -> Full="06 39"
  const fullText = (history + " " + currentMessage).toLowerCase()

  // B. Nettoyage des accents pour attraper "zéro" comme "zero"
  const normalizedText = fullText.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // C. Remplacement des mots par des chiffres
  let textWithDigits = normalizedText
  Object.keys(NUMBER_WORDS).forEach(word => {
     const regex = new RegExp(`\\b${word}\\b`, 'gi')
     textWithDigits = textWithDigits.replace(regex, NUMBER_WORDS[word])
  })

  // D. Suppression de tout ce qui n'est pas un chiffre pour voir la suite pure
  // Ex: "Appelle le 33. 44 .55" devient "334455"
  const digitsOnly = textWithDigits.replace(/\D/g, '')

  // E. DÉTECTION FINALE
  
  // 1. Suite de 5 chiffres ou plus (attrape les bouts de numéros comme 33344)
  // On est strict : aux Comores/France, un bout de numéro fait souvent 5+ chiffres
  const hasLongNumber = digitsOnly.length >= 6

  // 2. Mots clés "Leetspeak" (écritures bizarres)
  // Attrape: whatsapp, watsap, whtsp, tél, phone, call me...
  const keywordPattern = /(wh?ats?app?|wht?sp|t[ée]l|phone|appel|joindre|contact|06|07|\+269|269)/i
  const hasKeyword = keywordPattern.test(normalizedText)

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

  // NOUVEAU : Mémoire locale pour l'anti-fragmentation
  const [sessionHistory, setSessionHistory] = useState('')

  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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

      const { data: productData } = await supabase
        .from('products')
        .select('*, profiles(*)')
        .eq('id', params.id)
        .single()
      
      setProduct(productData)
      setLoading(false)
    }
    getData()
  }, [supabase, params.id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return router.push('/publier')
    if (!message.trim()) return

    // 🔒 SÉCURITÉ INTELLIGENTE
    if (!userProfile?.is_pro) {
        // On vérifie le message actuel combiné à ce qu'il a écrit juste avant
        if (detectForbiddenContent(message, sessionHistory)) {
            toast.error("ACTION BLOQUÉE : Le partage de numéro (chiffres ou lettres) est réservé aux Vendeurs PRO.")
            return
        }
    }

    setSending(true)
    const { error } = await supabase.from('messages').insert({
        content: message,
        sender_id: currentUser.id,
        receiver_id: product.user_id,
        product_id: product.id
    })

    if (error) toast.error("Erreur : " + error.message)
    else {
        toast.success("Message envoyé avec succès !")
        // On ajoute le message envoyé à l'historique de session pour surveiller le prochain
        setSessionHistory(prev => prev + " " + message)
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
    const text = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce "${product.title}" vue sur Comores Market.`)
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>
  if (!product) return <div className="h-screen flex items-center justify-center text-gray-500">Annonce introuvable</div>

  const images = JSON.parse(product.images || '[]')
  const isOwner = currentUser?.id === product.user_id
  const isFav = favorites.has(product.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      <div className="relative w-full h-80 bg-gray-200">
        <Image 
            src={selectedImage || images[0]} 
            alt={product.title} 
            fill 
            className="object-cover" 
            onClick={() => setSelectedImage(selectedImage ? null : images[0])} 
        />
        <div className="absolute top-0 left-0 w-full p-4 pt-safe flex justify-between items-start bg-linear-to-b from-black/50 to-transparent">
            <button onClick={() => router.back()} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition"><ArrowLeft size={20} /></button>
            <div className="flex gap-2">
                <button onClick={toggleFavorite} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition">
                    <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : ""} />
                </button>
                <button className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition">
                    <Share2 size={20} />
                </button>
            </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setSelectedImage(img)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${selectedImage === img ? 'border-brand' : 'border-white'}`}>
                    <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                </button>
            ))}
        </div>
      </div>

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