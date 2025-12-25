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
import { motion } from 'framer-motion'

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
          toast.error("Accès réservé au propriétaire")
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
      toast.error("Erreur de mise à jour")
    } else { 
      toast.success("Modifications enregistrées")
      router.push('/mes-annonces') 
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F0F2F5] gap-4">
      <Loader2 className="animate-spin text-brand" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Authentification de l'offre</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-32 font-sans text-gray-900">
      
      {/* --- HEADER PROFOND (Fixe) --- */}
      <div className="bg-[#1A4D2E] px-6 pb-8 pt-safe shadow-xl flex items-center gap-5 sticky top-0 z-50 rounded-b-[2.5rem]">
        <button 
          onClick={() => router.back()} 
          className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white active:scale-90 transition border border-white/10"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
            <h1 className="text-xl font-black tracking-tight text-white">Édition Premium</h1>
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em]">Révision de votre annonce active</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="p-5 space-y-8 max-w-lg mx-auto">
        
        {/* --- SECTION PHOTOS (EFFET GALERIE) --- */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100"
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand/5 rounded-xl"><Camera size={16} className="text-brand" /></div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Visuels</h3>
                </div>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {formData.images.map((img: string, i: number) => (
                    <div key={i} className="w-28 h-28 shrink-0 relative rounded-[1.5rem] overflow-hidden bg-gray-50 shadow-inner group">
                        <Image src={img} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                ))}
            </div>
        </motion.section>

        {/* --- SECTION DÉTAILS (FOND GRISÉ POUR MOINS DE LUMINOSITÉ) --- */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 space-y-8"
        >
            {/* Titre */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Titre de l'objet</label>
                <input 
                  required type="text" value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full bg-[#F5F7F9] p-5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand/10 focus:bg-white transition-all font-bold text-gray-800" 
                />
            </div>

            {/* Prix avec effet flottant */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Prix demandé</label>
                <div className="relative">
                    <input 
                      required type="number" value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      className="w-full bg-[#F5F7F9] p-6 rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand/10 focus:bg-white transition-all font-black text-brand text-2xl" 
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-xs text-gray-300">KMF</div>
                </div>
            </div>

            {/* Description sans bordures agressives */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Description</label>
                <textarea 
                  maxLength={500} required rows={5} value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-[#F5F7F9] p-5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand/10 focus:bg-white transition-all resize-none text-sm leading-relaxed text-gray-600" 
                />
            </div>
        </motion.section>

        {/* --- SECTION LOCALISATION --- */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 grid grid-cols-2 gap-4"
        >
            <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Emplacement</label>
            </div>
            <div className="relative">
                <select 
                  value={formData.location_island} 
                  onChange={e => setFormData({...formData, location_island: e.target.value})} 
                  className="w-full bg-[#F5F7F9] p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand/10 transition-all font-bold appearance-none text-sm"
                >
                    <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option>
                </select>
                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" />
            </div>
            <input 
              required type="text" value={formData.location_city} 
              onChange={e => setFormData({...formData, location_city: e.target.value})} 
              className="w-full bg-[#F5F7F9] p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-brand/10 transition-all font-bold text-sm" 
              placeholder="Ville"
            />
        </motion.section>

        {/* --- ACTIONS DE BAS DE PAGE --- */}
        <div className="pt-4 space-y-4">
            <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-brand text-white font-black py-5 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
                {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Valider les changements</>}
            </button>
            
            <button 
                type="button"
                onClick={() => router.back()}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-600 transition-colors"
            >
                Annuler et quitter
            </button>
        </div>
      </form>
    </div>
  )
}