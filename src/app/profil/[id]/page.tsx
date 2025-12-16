'use client'

import { createClient } from '@/utils/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Calendar, User, ShieldCheck, ArrowLeft, Loader2, Package } from 'lucide-react'

export default function PublicProfilePage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getData = async () => {
      // 1. Récupérer les infos du vendeur
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()
      
      setProfile(profileData)

      // 2. Récupérer ses annonces actives
      if (profileData) {
        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', params.id)
            .eq('status', 'active') // On ne montre que les actifs
            .order('created_at', { ascending: false })
        
        setProducts(productsData || [])
      }
      setLoading(false)
    }
    getData()
  }, [params.id, supabase])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-gray-500">Utilisateur introuvable.</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* HEADER AVEC RETOUR */}
      <div className="bg-brand p-4 pt-safe sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-white/80 hover:bg-white/20 rounded-full transition">
                <ArrowLeft size={22} />
            </button>
            <h1 className="text-white font-bold text-lg">Profil Vendeur</h1>
        </div>
      </div>

      {/* CARTE VENDEUR */}
      <div className="bg-white p-6 pb-8 -mt-4 rounded-b-3xl shadow-sm relative z-10 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-white shadow-md relative -mt-2 mb-3 overflow-hidden">
            {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={40} /></div>
            )}
        </div>
        
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 justify-center">
            {profile.full_name || "Utilisateur"}
            {profile.is_pro && <ShieldCheck size={20} className="text-green-500 fill-green-100" />}
        </h2>
        
        {profile.is_pro && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full mt-1">VENDEUR PROFESSIONNEL</span>}

        <div className="flex gap-4 mt-4 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1"><MapPin size={14} /> {profile.city || 'Comores'}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> Membre depuis {new Date(profile.created_at).getFullYear()}</span>
        </div>
      </div>

      {/* LISTE DES ANNONCES */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-brand" /> 
            Annonces en ligne ({products.length})
        </h3>

        {products.length === 0 ? (
            <div className="text-center text-gray-400 py-10 italic">Aucune autre annonce active.</div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                {products.map(product => {
                    let img = null; try { img = JSON.parse(product.images)[0] } catch { img = product.images }
                    return (
                        <Link key={product.id} href={`/annonce/${product.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                            <div className="relative w-full aspect-square bg-gray-100">
                                {img ? <Image src={img} alt="" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><Package /></div>}
                                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded z-10 font-medium">
                                    {product.location_island}
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">{product.title}</h3>
                                <p className="text-brand font-extrabold text-sm">{new Intl.NumberFormat('fr-KM').format(product.price)} KMF</p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        )}
      </div>
    </div>
  )
}