'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image' 
import { 
  Camera, Loader2, DollarSign, Tag, Type, X, ChevronLeft, 
  Lock, Crown, Layers, Phone, Ban, Mail, MessageCircle, 
  AlertCircle, Sparkles, CheckCircle2, MapPin, AlignLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// --- CONSTANTES ---
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
  const [images, setImages] = useState<string[]>([])
  const [isPro, setIsPro] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [adsCount, setAdsCount] = useState(0)
  
  const FREE_ADS_LIMIT = 3
  const FREE_PHOTOS_LIMIT = 3
  const PRO_PHOTOS_LIMIT = 10
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const currentPhotoLimit = isPro ? PRO_PHOTOS_LIMIT : FREE_PHOTOS_LIMIT

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > currentPhotoLimit) {
        toast.error(`Limite de ${currentPhotoLimit} photos atteinte.`, { icon: <Lock size={16}/> })
        return
    }
    
    setUploading(true)
    const newImagesUrls: string[] = []

    try {
      await Promise.all(files.map(async (file) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file)
          if (uploadError) throw uploadError
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
          newImagesUrls.push(publicUrl)
      }))
      setImages(prev => [...prev, ...newImagesUrls])
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
        toast.error("Veuillez remplir tous les champs et ajouter une photo.")
        return
    }
    if (formData.whatsapp_number && !isValidPhoneNumber(formData.whatsapp_number)) {
        toast.error("Numéro invalide. Utilisez un numéro Comores (+269) ou France (+33).")
        return
    }

    setLoading(true)
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
            whatsapp_number: formData.whatsapp_number
        })

        if (error) {
            toast.error("Erreur : " + error.message)
        } else {
            toast.success('Annonce publiée avec succès !')
            router.push('/')
        }
    }
    setLoading(false)
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F0F2F5]"><Loader2 className="animate-spin text-brand" size={40} /></div>

  // --- ECRAN BANNI (Luxe Stone Red) ---
  if (isBanned) {
    return (
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full border border-red-50">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500 shadow-inner"><Ban size={36} /></div>
                <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Compte Suspendu</h1>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">Votre accès à la publication a été restreint. Veuillez contacter notre conciergerie pour plus de détails.</p>
                
                <div className="space-y-4">
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center justify-center gap-3 w-full bg-[#F5F7F9] hover:bg-gray-100 text-gray-800 font-bold py-4 rounded-2xl transition-all">
                        <Mail size={18} /> Email Support
                    </a>
                    <a href={`https://wa.me/${SUPPORT_WA}`} target="_blank" className="flex items-center justify-center gap-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-emerald-500/20">
                        <MessageCircle size={18} /> WhatsApp Direct
                    </a>
                </div>
                <Link href="/compte" className="block mt-8 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-brand transition">Mon Compte</Link>
            </motion.div>
        </div>
    )
  }

  // --- ECRAN LIMITE ATTEINTE (Luxe Stone Gold) ---
  const adsLimitReached = !isPro && adsCount >= FREE_ADS_LIMIT
  if (adsLimitReached) {
    return (
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full">
                <div className="w-20 h-20 bg-yellow-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-yellow-600 shadow-inner"><Crown size={36} /></div>
                <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Limite atteinte</h1>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">Vous avez utilisé vos <strong>{FREE_ADS_LIMIT} privilèges gratuits</strong>. Élevez votre compte au statut PRO pour publier sans limite.</p>
                <Link href="/pro" className="block w-full bg-brand text-white font-black py-5 rounded-2xl shadow-xl shadow-brand/30 hover:brightness-110 transition mb-6 text-lg">Devenir Vendeur PRO 🚀</Link>
                <Link href="/mes-annonces" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-brand underline decoration-brand/30 underline-offset-4 transition">Gérer mon catalogue</Link>
            </motion.div>
            <Link href="/" className="mt-10 text-gray-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:text-brand transition"><ChevronLeft size={16} /> Accueil</Link>
        </div>
    )
  }

  const photosLimitReached = images.length >= currentPhotoLimit

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans pb-32 overflow-x-hidden">
      
      {/* --- HEADER STONE (Deep Green) --- */}
      <div className="bg-[#1A4D2E] px-6 pb-12 pt-safe shadow-2xl flex items-center gap-5 sticky top-0 z-50 rounded-b-[3.5rem]">
        <button onClick={() => router.back()} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white active:scale-90 border border-white/10 transition">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight text-white">Publier</h1>
            <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-brand" fill="currentColor" />
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Offre Prestige</p>
            </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
            {isPro ? <Crown size={14} className="text-yellow-400" /> : <Lock size={14} className="text-white/60" />}
            <span className="text-xs font-black text-white">{adsCount} / {isPro ? '∞' : FREE_ADS_LIMIT}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-8 max-w-lg mx-auto -mt-8 relative z-10">
        
        {/* --- ZONE VISUELS --- */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-white">
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand/5 rounded-xl"><Camera size={18} className="text-brand" /></div>
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Captures</label>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${photosLimitReached ? 'bg-red-50 text-red-500' : 'bg-[#F5F7F9] text-gray-400'}`}>{images.length} / {currentPhotoLimit}</span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <motion.div whileTap={{ scale: 0.95 }} onClick={() => { if (photosLimitReached) { toast.error(isPro ? "Max 10 photos" : `Passez PRO pour plus !`, { icon: <Lock size={16}/> }) } else { fileInputRef.current?.click() } }} 
                    className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center shrink-0 transition-all ${photosLimitReached ? 'bg-[#F5F7F9] border-gray-100 cursor-not-allowed opacity-40' : 'bg-[#F5F7F9] border-gray-200 cursor-pointer hover:bg-white hover:border-brand/40'}`}>
                    {uploading ? <Loader2 className="animate-spin text-brand" /> : <><Camera className="text-gray-300" size={24} /><span className="text-[9px] font-black uppercase mt-2 text-gray-400">{photosLimitReached ? 'Max' : 'Ajouter'}</span></>}
                </motion.div>
                
                <AnimatePresence>
                    {images.map((img, i) => (
                        <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="w-24 h-24 bg-[#F5F7F9] rounded-2xl relative shrink-0 overflow-hidden shadow-inner group border border-gray-50">
                            <Image src={img} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/40 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-red-500 transition-all active:scale-90"><X size={12} /></button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" disabled={photosLimitReached} multiple />
        </motion.section>

        {/* --- DÉTAILS PRODUIT --- */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-white space-y-8">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Titre de l'annonce</label>
                <div className="flex items-center bg-[#F5F7F9] rounded-2xl px-4 focus-within:ring-4 focus-within:ring-brand/5 focus-within:bg-white transition-all">
                    <Type size={18} className="text-gray-300" />
                    <input type="text" className="w-full bg-transparent p-5 outline-none text-[15px] font-bold text-gray-800" placeholder="Ex: iPhone 12 Pro..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Prix (KMF)</label>
                <div className="flex items-center bg-[#F5F7F9] rounded-2xl px-4 focus-within:ring-4 focus-within:ring-brand/5 focus-within:bg-white transition-all">
                    <DollarSign size={18} className="text-gray-300" />
                    <input type="number" className="w-full bg-transparent p-5 outline-none text-xl font-black text-brand" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Catégorie</label>
                    <div className="relative bg-[#F5F7F9] rounded-2xl focus-within:ring-4 focus-within:ring-brand/5 focus-within:bg-white transition-all">
                        <select className="w-full bg-transparent p-4 outline-none text-sm font-bold text-gray-700 appearance-none pr-10" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value, sub_category: '' })}>
                            {CATEGORIES_LIST.map(cat => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}
                        </select>
                        <Tag size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Sous-catégorie</label>
                    <div className="relative bg-[#F5F7F9] rounded-2xl focus-within:ring-4 focus-within:ring-brand/5 focus-within:bg-white transition-all">
                        <select className="w-full bg-transparent p-4 outline-none text-sm font-bold text-gray-700 appearance-none pr-10" value={formData.sub_category} onChange={e => setFormData({ ...formData, sub_category: e.target.value })}>
                            <option value="">Choisir...</option>
                            {currentSubCats.map((sub, idx) => (<option key={idx} value={sub}>{sub}</option>))}
                        </select>
                        <Layers size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    </div>
                </div>
            </div>
        </motion.section>

        {/* --- LOCALISATION & WHATSAPP --- */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-white space-y-8">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Île</label>
                    <div className="relative bg-[#F5F7F9] rounded-2xl">
                        <select className="w-full bg-transparent p-4 outline-none text-sm font-bold text-gray-700 appearance-none pr-10" value={formData.location_island} onChange={e => setFormData({...formData, location_island: e.target.value})}><option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option><option>La Réunion</option></select>
                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Ville</label>
                    <input type="text" className="w-full bg-[#F5F7F9] p-4 rounded-2xl text-sm font-bold border-none outline-none focus:ring-4 focus:ring-brand/5 focus:bg-white transition-all" placeholder="Moroni" value={formData.location_city} onChange={e => setFormData({...formData, location_city: e.target.value})} />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex justify-between items-center">
                    Numéro WhatsApp
                    <Link href="/compte" className="text-[9px] font-black text-brand flex items-center gap-1 opacity-70 hover:opacity-100 transition"><AlertCircle size={10} /> Modifier</Link>
                </label>
                <div className="flex items-center bg-[#F5F7F9] rounded-2xl px-5 border-none opacity-60 cursor-not-allowed">
                    <Phone size={18} className="text-gray-300 mr-3" />
                    <input type="tel" className="w-full bg-transparent p-5 outline-none text-sm font-black text-gray-600 cursor-not-allowed" value={formData.whatsapp_number} readOnly disabled />
                    <Lock size={14} className="text-gray-300 ml-3" />
                </div>
            </div>
        </motion.section>

        {/* --- DESCRIPTION --- */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-8 rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-white space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex justify-between">
                Description de l'offre
                <span className="text-brand opacity-60 font-black">{formData.description.length}/500</span>
            </label>
            <textarea maxLength={500} className="w-full bg-[#F5F7F9] p-6 rounded-3xl text-sm font-medium outline-none focus:ring-4 focus:ring-brand/5 focus:bg-white transition min-h-32 resize-none leading-relaxed text-gray-600" placeholder="Décrivez l'état de votre produit, ses points forts..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </motion.section>

        {/* --- BOUTON DE PUBLICATION FIXE --- */}
        <div className="fixed bottom-0 left-0 right-0 p-6 z-[60] bg-gradient-to-t from-[#F0F2F5] via-[#F0F2F5]/90 to-transparent">
            <div className="max-w-md mx-auto">
                <button type="submit" disabled={loading} className="w-full bg-brand text-white font-black py-5 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all duration-300 disabled:opacity-50 hover:brightness-110">
                    {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={22} /><span className="text-lg">Confirmer et Publier</span></>}
                </button>
            </div>
        </div>

      </form>
    </div>
  )
}