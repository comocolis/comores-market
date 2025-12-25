'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Loader2, Save, X, AlertTriangle, MapPin, ChevronRight, Package } from 'lucide-react'
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
        if (data.user_id !== user?.id) { router.push('/mes-annonces'); return }
        let parsedImages = []
        try { parsedImages = JSON.parse(data.images) } catch { parsedImages = [data.images] }
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

    if (error) toast.error("Erreur mise à jour")
    else { toast.success("Annonce actualisée !"); router.push('/mes-annonces') }
    setSaving(false)
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans text-gray-900">
      {/* Header Luxe */}
      <div className="bg-white px-4 pb-6 pt-safe shadow-sm border-b border-gray-100 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-2.5 bg-gray-50 rounded-full text-gray-500 active:scale-90 transition"><ArrowLeft size={22} /></button>
        <div>
            <h1 className="text-xl font-black tracking-tight">Modifier</h1>
            <p className="text-[10px] font-bold text-brand uppercase tracking-widest opacity-60">Révision de votre offre</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="p-5 space-y-6 max-w-md mx-auto">
        {/* Section Photos (Read-only Premium) */}
        <section className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[11px] font-black uppercase tracking-tighter text-gray-400">Photos de l'annonce</h3>
                <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">{formData.images.length} images</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {formData.images.map((img: string, i: number) => (
                    <motion.div whileHover={{ scale: 1.05 }} key={i} className="aspect-square relative rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
                        <Image src={img} alt="" fill className="object-cover" />
                    </motion.div>
                ))}
            </div>
        </section>

        {/* Section Informations */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom de l'article</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
                className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-brand/20 outline-none transition font-bold" />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prix de vente (KMF)</label>
                <div className="relative">
                    <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} 
                    className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-brand/20 outline-none transition font-black text-brand text-lg" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-300">KMF</span>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description (max. 500)</label>
                <textarea maxLength={500} required rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-brand/20 outline-none transition resize-none text-sm leading-relaxed" />
                <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Évitez les descriptions trop courtes</p>
                    <p className="text-[10px] font-black text-brand">{formData.description.length}/500</p>
                </div>
            </div>
        </section>

        {/* Section Localisation */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Île</label>
                <select value={formData.location_island} onChange={e => setFormData({...formData, location_island: e.target.value})} 
                className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-brand/20 outline-none font-bold appearance-none">
                    <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option>
                </select>
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ville</label>
                <input required type="text" value={formData.location_city} onChange={e => setFormData({...formData, location_city: e.target.value})} 
                className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-brand/20 outline-none font-bold" />
            </div>
        </section>

        {/* Bouton de sauvegarde flottant */}
        <div className="fixed bottom-6 left-0 right-0 px-5 z-40 max-w-md mx-auto">
            <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-brand text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-brand/40 flex items-center justify-center gap-3 active:scale-95 transition disabled:opacity-50"
            >
                {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} strokeWidth={3} /> Mettre à jour l'annonce</>}
            </button>
        </div>
      </form>
    </div>
  )
}