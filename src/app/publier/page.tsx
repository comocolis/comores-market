'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
// On s'assure que Image est bien importé depuis next/image pour éviter le conflit
import Image from 'next/image' 
import { Camera, Loader2, DollarSign, MapPin, Tag, Type, X, ChevronLeft, Lock, Crown } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function PublierPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  
  // États Limite & Pro
  const [isPro, setIsPro] = useState(false)
  const [adsCount, setAdsCount] = useState(0)
  
  // --- LIMITES ---
  const FREE_ADS_LIMIT = 3
  const FREE_PHOTOS_LIMIT = 3
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category_id: '1',
    location_island: 'Ngazidja',
    location_city: '',
    whatsapp_number: ''
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth') 
        return
      }

      // 1. Vérifier le profil (PRO ?)
      const { data: profile } = await supabase.from('profiles').select('is_pro, phone_number').eq('id', user.id).single()
      setIsPro(profile?.is_pro || false)
      
      if (profile?.phone_number) {
        setFormData(prev => ({ ...prev, whatsapp_number: profile.phone_number }))
      }

      // 2. Compter les annonces existantes
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setAdsCount(count || 0)
      
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    // 🔒 VÉRIFICATION LIMITATION PHOTOS
    if (!isPro && images.length >= FREE_PHOTOS_LIMIT) {
        toast.error(`Limite atteinte : Les comptes gratuits sont limités à ${FREE_PHOTOS_LIMIT} photos. Passez PRO pour en ajouter plus !`, {
            icon: <Lock size={16} />,
            style: { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5' }
        })
        return
    }
    
    setUploading(true)
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    try {
      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath)
      setImages([...images, publicUrl])
    } catch (error: any) {
      toast.error('Erreur upload: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.price || images.length === 0) {
        toast.error("Veuillez remplir les champs obligatoires et ajouter au moins une image.")
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
            location_island: formData.location_island,
            location_city: formData.location_city,
            images: JSON.stringify(images),
            whatsapp_number: formData.whatsapp_number
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Annonce publiée avec succès !')
            router.push('/')
        }
    }
    setLoading(false)
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  // --- BLOCAGE SI LIMITE D'ANNONCES ATTEINTE ---
  const adsLimitReached = !isPro && adsCount >= FREE_ADS_LIMIT

  if (adsLimitReached) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <Lock size={32} />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Limite atteinte</h1>
                <p className="text-gray-500 mb-6 text-sm">
                    Vous avez atteint la limite de <strong>{FREE_ADS_LIMIT} annonces gratuites</strong>.
                    Passez PRO pour publier en illimité et booster vos ventes !
                </p>
                
                <Link href="/pro" className="block w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 hover:scale-[1.02] transition mb-4">
                    Devenir Vendeur PRO 🚀
                </Link>
                
                <Link href="/mes-annonces" className="text-sm text-gray-400 font-medium hover:text-gray-600 underline">
                    Gérer mes annonces existantes
                </Link>
            </div>
            <Link href="/" className="mt-8 text-gray-400 text-sm flex items-center gap-1 hover:text-gray-600">
                <ChevronLeft size={16} /> Retour à l'accueil
            </Link>
        </div>
    )
  }

  const photosLimitReached = !isPro && images.length >= FREE_PHOTOS_LIMIT

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center gap-3 pt-safe">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
            <ChevronLeft size={24} />
        </button>
        <h1 className="font-extrabold text-xl text-gray-900">Nouvelle annonce</h1>
        <div className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {isPro ? <Crown size={12} className="text-yellow-600" /> : <Lock size={12} />}
            {adsCount} / {isPro ? '∞' : FREE_ADS_LIMIT}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-md mx-auto">
        
        {/* Photos */}
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-gray-700 ml-1">Photos du produit</label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${photosLimitReached ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {images.length} / {isPro ? '∞' : FREE_PHOTOS_LIMIT}
                </span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {/* Bouton Ajouter Photo */}
                <div 
                    onClick={() => {
                        if (photosLimitReached) {
                            toast.error(`Passez PRO pour ajouter plus de ${FREE_PHOTOS_LIMIT} photos !`, { icon: <Lock size={16}/> })
                        } else {
                            fileInputRef.current?.click()
                        }
                    }} 
                    className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center shrink-0 transition group ${
                        photosLimitReached 
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' 
                        : 'bg-gray-100 border-gray-300 cursor-pointer hover:bg-gray-50 hover:border-brand/50'
                    }`}
                >
                    {uploading ? (
                        <Loader2 className="animate-spin text-brand" />
                    ) : (
                        <>
                            {photosLimitReached ? <Lock className="text-gray-400" /> : <Camera className="text-gray-400 group-hover:text-brand" />}
                            <span className="text-[10px] font-bold mt-1 text-gray-400 group-hover:text-brand">
                                {photosLimitReached ? 'Limite' : 'Ajouter'}
                            </span>
                        </>
                    )}
                </div>

                {/* Liste des images */}
                {images.map((img, i) => (
                    <div key={i} className="w-24 h-24 bg-gray-100 rounded-2xl relative shrink-0 overflow-hidden border border-gray-200 shadow-sm">
                        <Image src={img} alt="" fill className="object-cover" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition"><X size={12} /></button>
                    </div>
                ))}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" disabled={photosLimitReached} />
        </div>

        {/* Info Principales */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Titre</label>
                <div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition">
                    <Type size={18} className="text-gray-400" />
                    <input type="text" className="w-full bg-transparent p-3 outline-none text-sm font-medium" placeholder="Ex: iPhone 12 Pro Max" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Prix (KMF)</label>
                <div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition">
                    <DollarSign size={18} className="text-gray-400" />
                    <input type="number" className="w-full bg-transparent p-3 outline-none text-sm font-medium" placeholder="Ex: 150000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Catégorie</label>
                <div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition">
                    <Tag size={18} className="text-gray-400" />
                    <select className="w-full bg-transparent p-3 outline-none text-sm font-medium text-gray-700" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                        <option value="1">Véhicules</option>
                        <option value="2">Immobilier</option>
                        <option value="3">Mode</option>
                        <option value="4">Multimédia</option>
                        <option value="5">Maison</option>
                        <option value="6">Loisirs</option>
                        <option value="7">Alimentation</option>
                        <option value="8">Services</option>
                        <option value="9">Beauté</option>
                        <option value="10">Emploi</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Localisation & Contact */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Île</label>
                    <select className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium border border-gray-200 outline-none focus:border-brand" value={formData.location_island} onChange={e => setFormData({...formData, location_island: e.target.value})}>
                        <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Ville</label>
                    <input type="text" className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium border border-gray-200 outline-none focus:border-brand" placeholder="Ex: Moroni" value={formData.location_city} onChange={e => setFormData({...formData, location_city: e.target.value})} />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Numéro WhatsApp</label>
                <div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition">
                    <span className="text-gray-500 font-bold text-sm mr-1">KM</span>
                    <input type="tel" className="w-full bg-transparent p-3 outline-none text-sm font-medium" placeholder="Ex: 332 00 00" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} />
                </div>
            </div>
        </div>

        {/* Description */}
        <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Description détaillée</label>
            {/* CORRECTION TAILWIND: min-h-30 au lieu de [120px] */}
            <textarea className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-sm font-medium outline-none focus:ring-2 focus:ring-brand/20 transition min-h-30" placeholder="Décrivez votre produit..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>

        <button type="submit" className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-xl shadow-brand/30 hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : "Publier l'annonce"}
        </button>

      </form>
    </div>
  )
}