'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Loader2, Save, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

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
      const { data, error } = await supabase.from('products').select('*').eq('id', params.id).single()
      
      if (data) {
        if (data.user_id !== user?.id) {
            router.push('/mes-annonces')
            return
        }
        let parsedImages = []
        try { parsedImages = JSON.parse(data.images) } catch { parsedImages = [data.images] }
        setFormData({ ...data, images: parsedImages })
      }
      setLoading(false)
    }
    fetchProduct()
  }, [params.id, supabase, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
        .from('products')
        .update({
            title: formData.title,
            price: parseFloat(formData.price),
            description: formData.description,
            category: formData.category,
            location_city: formData.location_city,
            location_island: formData.location_island,
            updated_at: new Date()
        })
        .eq('id', params.id)

    if (error) toast.error("Erreur lors de la mise à jour")
    else {
        toast.success("Annonce mise à jour !")
        router.push('/mes-annonces')
    }
    setSaving(false)
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm pt-safe flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600"><ArrowLeft size={22} /></button>
            <h1 className="text-xl font-bold text-gray-900">Modifier l'annonce</h1>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="p-4 space-y-6">
        {/* APERÇU PHOTOS (Lecture seule pour la modification simple ici) */}
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3 items-center text-amber-700 text-xs">
            <AlertTriangle size={16} />
            <p>La modification des photos n'est pas encore disponible ici.</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
            {formData.images.map((img: string, i: number) => (
                <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-gray-200">
                    <Image src={img} alt="" fill className="object-cover" />
                </div>
            ))}
        </div>

        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Titre de l'annonce</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand/20 transition shadow-sm" />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Prix (KMF)</label>
                <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand/20 transition shadow-sm font-bold text-brand" />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Description (max. 500)</label>
                <textarea maxLength={500} required rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand/20 transition shadow-sm resize-none" />
                <p className="text-right text-[10px] text-gray-400 font-bold">{formData.description.length} / 500</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Île</label>
                    <select value={formData.location_island} onChange={e => setFormData({...formData, location_island: e.target.value})} className="w-full bg-white p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand/20 shadow-sm appearance-none">
                        <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ville</label>
                    <input required type="text" value={formData.location_city} onChange={e => setFormData({...formData, location_city: e.target.value})} className="w-full bg-white p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand/20 shadow-sm" />
                </div>
            </div>
        </div>

        <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand/20 flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
        >
            {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Enregistrer les modifications</>}
        </button>
      </form>
    </div>
  )
}