'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image' 
import { 
  Camera, Loader2, DollarSign, Tag, Type, X, ChevronLeft, Lock, Crown, 
  Layers, Phone, Ban, Mail, MessageCircle, AlertCircle, Sparkles, ShieldCheck 
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const CATEGORIES_LIST = [
  { id: 1, label: 'Véhicules' }, { id: 2, label: 'Immobilier' }, { id: 3, label: 'Mode' },
  { id: 4, label: 'Tech' }, { id: 5, label: 'Maison' }, { id: 6, label: 'Loisirs' },
  { id: 7, label: 'Alimentation' }, { id: 8, label: 'Services' }, { id: 9, label: 'Beauté' }, { id: 10, label: 'Emploi' },
]

const SUB_CATEGORIES: { [key: number]: string[] } = {
  1: ['Voitures', 'Motos', 'Pièces Détachées', 'Location', 'Camions', 'Bateaux'],
  2: ['Vente Maison', 'Vente Terrain', 'Location Maison', 'Location Appartement', 'Bureaux & Commerces', 'Colocation'],
  3: ['Vêtements Homme', 'Vêtements Femme', 'Enfant & Bébé', 'Chaussures', 'Montres & Bijoux', 'Sacs & Accessoires'],
  4: ['Téléphones', 'Ordinateurs', 'Audio & Son', 'Appareils Photo', 'Accessoires Info', 'Consoles & Jeux'],
  5: ['Meubles', 'Décoration', 'Électroménager', 'Bricolage', 'Jardin', 'Linge de maison'],
  6: ['Sports', 'Instruments de musique', 'Livres', 'Vélos', 'Voyages & Billets'],
  7: ['Fruits & Légumes', 'Plats cuisinés', 'Épicerie', 'Boissons', 'Produits frais'],
  8: ['Cours & Formations', 'Réparations', 'Déménagement', 'Événements', 'Ménage & Aide'],
  9: ['Parfums', 'Maquillage', 'Soins Visage & Corps', 'Coiffure', 'Matériel Pro'],
  10: ['Offres d\'emploi', 'Demandes d\'emploi', 'Stages', 'Intérim'],
}

const SUPPORT_EMAIL = "contact.comoresmarket@gmail.com"
const SUPPORT_WA = "33758760743" 

const isValidPhoneNumber = (phone: string) => {
  const clean = phone.replace(/[\s\-\.]/g, '')
  const comorosRegex = /^(?:\+269|00269)?3[234]\d{5}$/
  const franceRegex = /^(?:\+33|0033|0)[67]\d{8}$/
  return comorosRegex.test(clean) || franceRegex.test(clean)
}

export default function PublierPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false) 
  const [isRephrasing, setIsRephrasing] = useState(false) 
  const [images, setImages] = useState<string[]>([])
  
  const [isPro, setIsPro] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [adsCount, setAdsCount] = useState(0)
  
  const FREE_ADS_LIMIT = 3
  const FREE_PHOTOS_LIMIT = 3
  const PRO_PHOTOS_LIMIT = 10
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const visionInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '', price: '', description: '', category_id: '1', sub_category: '',
    location_island: 'Ngazidja', location_city: '', whatsapp_number: ''
  })

  const currentSubCats = SUB_CATEGORIES[parseInt(formData.category_id)] || []

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase.from('profiles').select('is_pro, is_banned, phone_number').eq('id', user.id).single()
      setIsPro(profile?.is_pro || false)
      setIsBanned(profile?.is_banned || false)
      
      if (profile?.phone_number) {
        setFormData(prev => ({ ...prev, whatsapp_number: profile.phone_number }))
      }

      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setAdsCount(count || 0)
      
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  const handleRephrase = async () => {
    if (!formData.description || formData.description.length < 5) {
      toast.error("Écrivez un début de texte pour que l'IA puisse le sublimer.")
      return
    }
    setIsRephrasing(true)
    try {
      const res = await fetch('/api/rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formData.description }),
      })
      const data = await res.json()
      if (data.text) {
        const clean = data.text.replace(/\*\*/g, '').replace(/#/g, '').normalize("NFC")
        setFormData(prev => ({ ...prev, description: clean }))
        toast.success("Texte sublimé !", { icon: <Sparkles className="text-blue-500" /> })
      }
    } catch (err) { toast.error("Erreur reformulation.") } finally { setIsRephrasing(false) }
  }

  const handleVisionAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsGenerating(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: reader.result }),
        })
        const data = await res.json()
        if (data.text) {
          const clean = data.text.replace(/\*\*/g, '').replace(/#/g, '').normalize("NFC")
          setFormData(prev => ({ ...prev, description: clean }))
          toast.success("Description générée !", { icon: <Sparkles className="text-amber-500" /> })
        }
      } catch (err) { toast.error("Erreur Vision.") } finally { setIsGenerating(false) }
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const currentPhotoLimit = isPro ? PRO_PHOTOS_LIMIT : FREE_PHOTOS_LIMIT
    if (images.length + e.target.files.length > currentPhotoLimit) {
        toast.error(`Limite de ${currentPhotoLimit} photos atteinte.`, { icon: <Lock size={16}/> })
        return
    }
    setUploading(true)
    try {
      const newImages: string[] = []
      await Promise.all(Array.from(e.target.files).map(async (file) => {
          const fileName = `${Math.random()}.${file.name.split('.').pop()}`
          await supabase.storage.from('products').upload(fileName, file)
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
          newImages.push(publicUrl)
      }))
      setImages(prev => [...prev, ...newImages])
    } catch (error: any) { toast.error('Erreur upload.') } finally { setUploading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isBanned) return
    if (!formData.title || !formData.price || images.length === 0 || !formData.sub_category) {
        toast.error("Champs manquants.")
        return
    }

    setLoading(true)
    try {
      const moderateRes = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const check = await moderateRes.json()

      if (!check.is_safe) {
        toast.error(`Refusé : ${check.reason}`)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          // 1. Insertion du produit
          const { error: productError } = await supabase.from('products').insert({
              ...formData,
              user_id: user.id,
              images: JSON.stringify(images),
              quality_score: check.quality_score
          })

          if (!productError) {
              // 2. AUTOMATISATION NOTIFICATION (NOUVEAU)
              await supabase.from('notifications').insert({
                user_id: user.id,
                title: "La Sentinelle a validé votre annonce",
                message: `Votre annonce "${formData.title}" est en ligne avec un score de ${check.quality_score}/10.`,
                type: 'sentinel'
              })

              toast.success('Annonce publiée !')
              router.push('/')
          } else {
              throw productError
          }
      }
    } catch (err: any) { toast.error("Erreur lors de la publication.") } finally { setLoading(false) }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  if (isBanned) {
    return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
                <Ban size={32} className="text-red-600 mx-auto mb-4" />
                <h1 className="text-2xl font-black mb-2">Compte Suspendu</h1>
                <p className="text-gray-500 mb-6 text-sm font-medium">Contactez le support pour régulariser votre situation.</p>
                <div className="space-y-3">
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center justify-center gap-2 w-full bg-gray-100 py-3 rounded-xl font-bold"><Mail size={18} /> Email</a>
                    <a href={`https://wa.me/${SUPPORT_WA}`} target="_blank" className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20"><MessageCircle size={18} /> WhatsApp</a>
                </div>
            </div>
        </div>
    )
  }

  const adsLimitReached = !isPro && adsCount >= FREE_ADS_LIMIT

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      <div className="bg-white px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center gap-3 pt-safe">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={24} /></button>
        <h1 className="font-extrabold text-xl text-gray-900">Publier</h1>
        <div className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{isPro ? <Crown size={12} className="text-yellow-600" /> : <Lock size={12} />}{adsCount} / {isPro ? '∞' : FREE_ADS_LIMIT}</div>
      </div>

      {adsLimitReached ? (
        <div className="p-6 mt-10 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600"><Lock size={32} /></div>
            <h2 className="text-xl font-black">Limite atteinte</h2>
            <p className="text-sm text-gray-500 font-medium">Vous avez atteint votre limite de {FREE_ADS_LIMIT} annonces gratuites.</p>
            <Link href="/pro" className="block w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg">Devenir Vendeur Élite 🚀</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-md mx-auto">
            {/* PHOTOS */}
            <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                    <label className="text-sm font-bold text-gray-700">Photos</label>
                    <span className="text-[10px] font-bold text-gray-400">{images.length} / {isPro ? PRO_PHOTOS_LIMIT : FREE_PHOTOS_LIMIT}</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center shrink-0 transition bg-gray-100 border-gray-300 cursor-pointer">
                        {uploading ? <Loader2 className="animate-spin text-brand" /> : <Camera className="text-gray-400" />}
                    </div>
                    {images.map((img, i) => (
                        <div key={i} className="w-24 h-24 bg-gray-100 rounded-2xl relative shrink-0 overflow-hidden border">
                        <Image src={img} alt="" fill className="object-cover" />
                        <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><X size={12} /></button>
                        </div>
                    ))}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
            </div>

            {/* CHAMPS INFOS PRINCIPALES */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Titre</label><div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200"><Type size={18} className="text-gray-400" /><input type="text" className="w-full bg-transparent p-3 outline-none text-sm font-bold" placeholder="iPhone 12 Pro..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div></div>
                <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Prix (KMF)</label><div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200"><DollarSign size={18} className="text-gray-400" /><input type="number" className="w-full bg-transparent p-3 outline-none text-sm font-bold" placeholder="150000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Catégorie</label><select className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none border border-gray-200" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value, sub_category: '' })}>{CATEGORIES_LIST.map(cat => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}</select></div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Sous-catégorie</label><select className="w-full bg-gray-50 p-3 rounded-xl text-sm font-bold outline-none border border-gray-200" value={formData.sub_category} onChange={e => setFormData({ ...formData, sub_category: e.target.value })}><option value="">Choisir...</option>{currentSubCats.map((sub, idx) => (<option key={idx} value={sub}>{sub}</option>))}</select></div>
                </div>
            </div>

            {/* LOCALISATION & WHATSAPP SÉCURISÉ */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Île</label><select className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold border border-gray-200" value={formData.location_island} onChange={e => setFormData({...formData, location_island: e.target.value})}><option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option></select></div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Ville</label><input type="text" className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold border border-gray-200" placeholder="Moroni" value={formData.location_city} onChange={e => setFormData({...formData, location_city: e.target.value})} /></div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 flex justify-between font-sans">WhatsApp <Link href="/compte" className="text-[10px] text-brand hover:underline flex items-center gap-1 font-bold"><AlertCircle size={10} /> Modifier</Link></label>
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 border border-gray-200 opacity-80 cursor-not-allowed"><Phone size={18} className="text-gray-400 mr-2" /><input className="w-full bg-transparent p-3 outline-none text-sm font-bold text-gray-600" value={formData.whatsapp_number} readOnly disabled /><Lock size={14} className="text-gray-400 ml-2" /></div>
                </div>
            </div>

            {/* DESCRIPTION PRESTIGE */}
            <div className="space-y-2">
                <div className="flex justify-between items-center mb-1 px-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Description Prestige</label>
                    <div className="flex gap-2">
                    <button type="button" onClick={handleRephrase} disabled={isRephrasing} className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition-all active:scale-95">
                        {isRephrasing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Sublimer
                    </button>
                    <button type="button" onClick={() => visionInputRef.current?.click()} disabled={isGenerating} className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 transition-all active:scale-95">
                        {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
                        IA Photo
                    </button>
                    </div>
                    <input type="file" ref={visionInputRef} onChange={handleVisionAI} className="hidden" accept="image/*" />
                </div>
                <textarea className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-sm font-medium min-h-[160px] outline-none focus:ring-2 focus:ring-brand/20 transition resize-none" placeholder="Décrivez votre produit avec élégance..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            {/* BADGE SÉCURITÉ IA */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="text-amber-600 mt-0.5" size={20} />
            <div>
                <p className="text-amber-900 text-[10px] font-black uppercase tracking-tight">Audit Sentinelle Actif</p>
                <p className="text-amber-700/80 text-[10px] font-medium leading-tight mt-0.5">La conformité et le prestige de votre annonce sont vérifiés en temps réel.</p>
            </div>
            </div>

            <button type="submit" disabled={loading || isGenerating || isRephrasing} className="w-full bg-brand text-white font-bold py-5 rounded-2xl shadow-xl shadow-brand/30 hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
            {loading ? <Loader2 className="animate-spin" /> : "Publier l'annonce"}
            </button>
        </form>
      )}
    </div>
  )
}