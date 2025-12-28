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
  const [isGenerating, setIsGenerating] = useState(false) // État pour la Vision IA
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

  // --- FONCTION VISION IA (DESCRIPTION PAR PHOTO) ---
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
          setFormData(prev => ({ ...prev, description: data.text }))
          toast.success("L'IA a rédigé votre description prestige !", { icon: <Sparkles className="text-amber-500" /> })
        }
      } catch (err) {
        toast.error("L'analyse d'image a échoué.")
      } finally {
        setIsGenerating(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const currentPhotoLimit = isPro ? PRO_PHOTOS_LIMIT : FREE_PHOTOS_LIMIT

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > currentPhotoLimit) {
        toast.error(`Limite de ${currentPhotoLimit} photos atteinte.`, { icon: <Lock size={16}/> })
        return
    }
    
    setUploading(true)
    const newImages: string[] = []

    try {
      await Promise.all(files.map(async (file) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file)
          if (uploadError) throw uploadError
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
          newImages.push(publicUrl)
      }))
      setImages(prev => [...prev, ...newImages])
    } catch (error: any) {
      toast.error('Erreur upload: ' + error.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isBanned) return

    if (!formData.title || !formData.price || images.length === 0 || !formData.sub_category) {
        toast.error("Veuillez remplir tous les champs et ajouter au moins une photo.")
        return
    }
    if (formData.whatsapp_number && !isValidPhoneNumber(formData.whatsapp_number)) {
        toast.error("Numéro invalide.")
        return
    }

    setLoading(true)
    
    try {
      // --- PHASE SENTINELLE : MODÉRATION IA ---
      const moderateRes = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const check = await moderateRes.json()

      if (!check.is_safe) {
        toast.error(`Publication bloquée : ${check.reason}`, { icon: <AlertCircle className="text-red-500" /> })
        setLoading(false)
        return
      }

      // --- PHASE INSERTION SUPABASE ---
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          const { error } = await supabase.from('products').insert({
              user_id: user.id,
              title: formData.title,
              price: parseFloat(formData.price),
              description: formData.description,
              category_id: parseInt(formData.category_id),
              sub_category: formData.sub_category,
              location_island: formData.location_island,
              location_city: formData.location_city,
              images: JSON.stringify(images),
              whatsapp_number: formData.whatsapp_number,
              quality_score: check.quality_score // On stocke le score de l'IA
          })

          if (error) throw error
          
          toast.success('Annonce publiée avec succès !')
          router.push('/')
      }
    } catch (err: any) {
      toast.error("Erreur : " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  if (isBanned) {
    return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600"><Ban size={32} /></div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Compte Suspendu</h1>
                <p className="text-gray-500 mb-6 text-sm">Votre compte a été suspendu pour non-respect des règles.</p>
                <div className="space-y-3">
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition"><Mail size={18} /> Email</a>
                    <a href={`https://wa.me/${SUPPORT_WA}`} target="_blank" className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-500/20"><MessageCircle size={18} /> WhatsApp</a>
                </div>
                <Link href="/compte" className="block mt-6 text-sm text-gray-400 hover:underline">Retour</Link>
            </div>
        </div>
    )
  }

  const adsLimitReached = !isPro && adsCount >= FREE_ADS_LIMIT
  if (adsLimitReached) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500"><Lock size={32} /></div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Limite atteinte</h1>
                <p className="text-gray-500 mb-6 text-sm">Passez Élite pour publier en illimité !</p>
                <Link href="/pro" className="block w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 hover:scale-[1.02] transition mb-4">Devenir Vendeur Élite 🚀</Link>
                <Link href="/mes-annonces" className="text-sm text-gray-400 underline">Gérer mes annonces</Link>
            </div>
        </div>
    )
  }

  const photosLimitReached = images.length >= currentPhotoLimit

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      <div className="bg-white px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center gap-3 pt-safe">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={24} /></button>
        <h1 className="font-extrabold text-xl text-gray-900">Publier</h1>
        <div className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{isPro ? <Crown size={12} className="text-yellow-600" /> : <Lock size={12} />}{adsCount} / {isPro ? '∞' : FREE_ADS_LIMIT}</div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-md mx-auto">
        {/* SECTION PHOTOS */}
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-gray-700 ml-1">Photos</label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${photosLimitReached ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{images.length} / {currentPhotoLimit}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <div onClick={() => !photosLimitReached && fileInputRef.current?.click()} className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center shrink-0 transition group ${photosLimitReached ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' : 'bg-gray-100 border-gray-300 cursor-pointer hover:bg-gray-50'}`}>
                    {uploading ? <Loader2 className="animate-spin text-brand" /> : <><Camera className="text-gray-400" /><span className="text-[10px] font-bold mt-1 text-gray-400">Ajouter</span></>}
                </div>
                {images.map((img, i) => (
                    <div key={i} className="w-24 h-24 bg-gray-100 rounded-2xl relative shrink-0 overflow-hidden border border-gray-200"><Image src={img} alt="" fill className="object-cover" /><button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition"><X size={12} /></button></div>
                ))}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" disabled={photosLimitReached} multiple />
        </div>

        {/* CHAMPS INFOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Titre</label><div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200"><Type size={18} className="text-gray-400" /><input type="text" className="w-full bg-transparent p-3 outline-none text-sm font-medium" placeholder="Ex: iPhone 12 Pro" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div></div>
            <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Prix (KMF)</label><div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200"><DollarSign size={18} className="text-gray-400" /><input type="number" className="w-full bg-transparent p-3 outline-none text-sm font-medium" placeholder="150000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Catégorie</label><select className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value, sub_category: '' })}>{CATEGORIES_LIST.map(cat => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}</select></div>
                <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Sous-catégorie</label><select className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none" value={formData.sub_category} onChange={e => setFormData({ ...formData, sub_category: e.target.value })}><option value="">Choisir...</option>{currentSubCats.map((sub, idx) => (<option key={idx} value={sub}>{sub}</option>))}</select></div>
            </div>
        </div>

        {/* LOCALISATION & WHATSAPP */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Île</label><select className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium" value={formData.location_island} onChange={e => setFormData({...formData, location_island: e.target.value})}><option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option></select></div>
                <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Ville</label><input type="text" className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium border border-gray-200" placeholder="Moroni" value={formData.location_city} onChange={e => setFormData({...formData, location_city: e.target.value})} /></div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 flex justify-between">WhatsApp <Link href="/compte" className="text-[10px] text-brand hover:underline flex items-center gap-1"><AlertCircle size={10} /> Modifier</Link></label>
                <div className="flex items-center bg-gray-100 rounded-xl px-3 border border-gray-200 opacity-80"><Phone size={18} className="text-gray-400 mr-2" /><input className="w-full bg-transparent p-3 outline-none text-sm font-bold text-gray-600" value={formData.whatsapp_number} readOnly disabled /><Lock size={14} className="text-gray-400 ml-2" /></div>
            </div>
        </div>

        {/* DESCRIPTION AVEC VISION IA */}
        <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Description</label>
                <button type="button" onClick={() => visionInputRef.current?.click()} disabled={isGenerating} className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 hover:bg-amber-100 transition-all">
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {isGenerating ? "Analyse IA..." : "Décrire par Photo"}
                </button>
                <input type="file" ref={visionInputRef} onChange={handleVisionAI} className="hidden" accept="image/*" />
            </div>
            <textarea className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-sm font-medium min-h-[150px] outline-none focus:ring-2 focus:ring-brand/20 transition" placeholder="Décrivez votre produit..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>

        {/* BADGE SÉCURITÉ IA */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
          <ShieldCheck className="text-amber-600" size={20} />
          <p className="text-amber-900 text-[10px] font-bold uppercase leading-tight">La Sentinelle vérifie la conformité de votre annonce en temps réel.</p>
        </div>

        <button type="submit" disabled={loading || isGenerating} className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-xl shadow-brand/30 hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : "Publier l'annonce"}
        </button>
      </form>
    </div>
  )
}