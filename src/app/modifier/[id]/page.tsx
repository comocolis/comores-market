'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, ChangeEvent } from 'react'
import { Loader2, Camera, X } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner' // Ajout de Sonner

export default function ModifierPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [formData, setFormData] = useState<any>(null)
  const [productId, setProductId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { id } = await params
      setProductId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/publier'); return }
      const { data: product } = await supabase.from('products').select('*').eq('id', id).single()
      
      // Sécurité : Vérifier le propriétaire
      if (product.user_id !== user.id) { 
          toast.error("Accès refusé. Ce n'est pas votre annonce.") // Remplacé alert
          router.push('/')
          return 
      }
      
      setFormData({
        title: product.title, price: product.price, category: 'Véhicules',
        island: product.location_island, city: product.location_city, 
        description: product.description, phone: product.whatsapp_number
      })
      let imgs = []; try { imgs = JSON.parse(product.images) } catch {}
      setExistingImages(imgs)
      setLoading(false)
    }
    init()
  }, [params, supabase, router])

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selected = Array.from(e.target.files)
    setFiles([...files, ...selected])
    setPreviews([...previews, ...selected.map(f => URL.createObjectURL(f))])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setUploading(true)
    try {
      let newUrls = []
      for (const file of files) {
        const fileName = `${productId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`
        await supabase.storage.from('products').upload(fileName, file)
        const { data } = supabase.storage.from('products').getPublicUrl(fileName)
        newUrls.push(data.publicUrl)
      }
      const finalImages = [...existingImages, ...newUrls]
      const { error } = await supabase.from('products').update({
        title: formData.title, price: parseInt(formData.price),
        location_island: formData.island, location_city: formData.city,
        description: formData.description, whatsapp_number: formData.phone,
        images: JSON.stringify(finalImages)
      }).eq('id', productId)
      
      if (error) throw error
      
      toast.success("Annonce modifiée avec succès !") // Remplacé alert
      router.push('/compte')
      
    } catch (e: any) { 
        toast.error("Erreur : " + e.message) // Remplacé alert
    } finally { 
        setUploading(false) 
    }
  }

  if (loading || !formData) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 font-sans">
       <h1 className="font-bold text-lg mb-4">Modifier l'annonce</h1>
       <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div><label className="block text-sm font-bold mb-1">Titre</label><input type="text" className="w-full p-3 border rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
          <div><label className="block text-sm font-bold mb-1">Prix</label><input type="number" className="w-full p-3 border rounded-lg" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
          
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((src, i) => (<div key={i} className="relative aspect-square"><Image src={src} alt="" fill className="object-cover rounded-lg" /><button onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"><X size={12}/></button></div>))}
            {previews.map((src, i) => (<div key={i} className="relative aspect-square"><Image src={src} alt="" fill className="object-cover rounded-lg opacity-50" /></div>))}
            <label className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed"><Camera /><input type="file" multiple hidden onChange={handleImageChange} /></label>
          </div>

          <button onClick={handleSubmit} disabled={uploading} className="w-full bg-brand text-white font-bold py-3 rounded-lg">{uploading ? '...' : 'Sauvegarder'}</button>
       </div>
    </div>
  )
}