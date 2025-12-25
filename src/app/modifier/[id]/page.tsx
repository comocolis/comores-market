'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Camera, Loader2, Save, X, 
  MapPin, ChevronRight, Package, Info, Banknote, AlignLeft 
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export default function ModifierAnnoncePage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({
    title: '',
    price: '',
    description: '',
    category: '',
    location_city: '',
    location_island: 'Ngazidja',
    images: []
  })

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('products').select('*').eq('id', params.id).single()
      
      if (data) {
        if (data.user_id !== user?.id) { 
          toast.error("Accès non autorisé")
          router.push('/mes-annonces')
          return 
        }
        let parsedImages = []
        try { 
          const imgs = JSON.parse(data.images)
          parsedImages = Array.isArray(imgs) ? imgs : [data.images]
        } catch { 
          parsedImages = [data.images] 
        }
        setFormData({ ...data, images: parsedImages })
      }
      setLoading(false)
    }
    fetchProduct()
  }, [params.id, router, supabase])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase.from('products').update({
        title: formData.title,
        price: parseFloat(formData.price),
        description: formData.description,
        location_city: formData.location_city,
        location_island: formData.location_island,
        updated_at: new Date()
    }).eq('id', params.id)

    if (error) {
      toast.error("Erreur lors de la mise à jour")
    } else { 
      toast.success("Annonce actualisée avec succès !")
      router.push('/mes-annonces') 
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-brand" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Chargement de votre offre...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 font-sans text-gray-900">
      
      {/* --- HEADER LUXE FIXE --- */}
      <div className="bg-white px-6 pb-6 pt-safe shadow-sm border-b border-gray-50 flex items-center gap-4 sticky top-0 z-50">
        <button 
          onClick={() => router.back()} 
          className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-90 transition shadow-sm"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
            <h1 className="text-xl font-black tracking-tight">Modifier l'annonce</h1>
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              <p className="text-[10px] font-bold text-brand uppercase tracking-widest">Édition en cours</p>
            </div>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="p-5 space-y-8 max-w-lg mx-auto">
        
        {/* --- SECTION PHOTOS (PRESTIGE) --- */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-black/5 border border-white overflow-hidden"
        >
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-brand" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Galerie d'images</h3>
                </div>
                <span className="text-[10px] bg-brand/10 text-brand px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                  {formData.images.length} Photos
                </span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {formData.images.map((img: string, i: number) => (
                    <div key={i} className="w-32 h-32 shrink-0 relative rounded-3xl overflow-hidden bg-gray-100 shadow-md">
                        <Image src={img} alt="" fill className="object-cover" />
                    </div>
                ))}
            </div>
            <p className="mt-4 text-[9px] text-gray-400 italic text-center font-medium">Note : Pour modifier les photos, veuillez supprimer l'annonce et en recréer une.</p>
        </motion.section>

        {/* --- SECTION INFORMATIONS PRINCIPALES --- */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[3rem] shadow-xl shadow-black/5 border border-white space-y-8"
        >
            {/* Titre */}
            <div className="group">
                <div className="flex items-center gap-2 mb-2 ml-1 text-gray-400 group-focus-within:text-brand transition-colors">
                  <Package size={14} />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em]">Désignation de l'article</label>
                </div>
                <input 
                  required type="text" value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full bg-gray-50/80 p-5 rounded-2xl border-none outline-none focus:ring-4 focus:ring-brand/5 focus:bg-white transition-all font-bold text-gray-800" 
                  placeholder="Ex: iPhone 15 Pro Max..."
                />
            </div>

            {/* Prix */}
            <div className="group">
                <div className="flex items-center gap-2 mb-2 ml-1 text-gray-400 group-focus-within:text-brand transition-colors">
                  <Banknote size={14} />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em]">Prix de vente (KMF)</label>
                </div>
                <div className="relative">
                    <input 
                      required type="number" value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      className="w-full bg-gray-50/80 p-5 rounded-2xl border-none outline-none focus:ring-4 focus:ring-brand/5 focus:bg-white transition-all font-black text-brand text-2xl" 
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-100 font-black text-[10px] text-gray-300">KMF</div>
                </div>
            </div>

            {/* Description */}
            <div className="group">
                <div className="flex items-center gap-2 mb-2 ml-1 text-gray-400 group-focus-within:text-brand transition-colors">
                  <AlignLeft size={14} />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em]">Description détaillée</label>
                </div>
                <textarea 
                  maxLength={500} required rows={6} value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-gray-50/80 p-5 rounded-2xl border-none outline-none focus:ring-4 focus:ring-brand/5 focus:bg-white transition-all resize-none text-sm leading-relaxed text-gray-600" 
                  placeholder="Décrivez l'état, les options, les accessoires..."
                />
                <div className="flex justify-end mt-2 px-1">
                    <div className="bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-[9px] font-black text-brand">{formData.description.length}</span>
                      <span className="text-[9px] font-bold text-gray-400"> / 500</span>
                    </div>
                </div>
            </div>
        </motion.section>

        {/* --- SECTION LOCALISATION --- */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[3rem] shadow-xl shadow-black/5 border border-white space-y-8"
        >
            <div className="flex items-center gap-2 mb-2 ml-1 text-gray-400">
              <MapPin size={14} />
              <label className="text-[10px] font-black uppercase tracking-[0.2em]">Emplacement géographique</label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-300 uppercase ml-1">Île</p>
                    <div className="relative">
                      <select 
                        value={formData.location_island} 
                        onChange={e => setFormData({...formData, location_island: e.target.value})} 
                        className="w-full bg-gray-50/80 p-4 rounded-2xl border-none outline-none focus:ring-4 focus:ring-brand/5 transition-all font-bold appearance-none text-sm"
                      >
                          <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option>
                      </select>
                      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" />
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-300 uppercase ml-1">Ville</p>
                    <input 
                      required type="text" value={formData.location_city} 
                      onChange={e => setFormData({...formData, location_city: e.target.value})} 
                      className="w-full bg-gray-50/80 p-4 rounded-2xl border-none outline-none focus:ring-4 focus:ring-brand/5 transition-all font-bold text-sm" 
                    />
                </div>
            </div>
        </motion.section>

        {/* --- BOUTON DE SAUVEGARDE FLOTTANT (PRESTIGE) --- */}
        <div className="fixed bottom-0 left-0 right-0 p-6 z-[60] pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto">
                <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full bg-brand text-white font-black py-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all duration-300 disabled:opacity-50 hover:brightness-110"
                >
                    {saving ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <div className="bg-white/20 p-2 rounded-xl">
                          <Save size={20} strokeWidth={3} />
                        </div>
                        <span className="tracking-tight text-lg">Enregistrer les modifications</span>
                      </>
                    )}
                </button>
            </div>
        </div>
      </form>
    </div>
  )
}