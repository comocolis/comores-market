'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, User, Users, Loader2, Calendar, ChevronRight } from 'lucide-react'

export default function ProductViewersPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const [viewers, setViewers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [productTitle, setProductTitle] = useState('')

  useEffect(() => {
    const fetchData = async () => {
        // 1. Titre du produit
        const { data: prod } = await supabase.from('products').select('title').eq('id', params.id).single()
        if (prod) setProductTitle(prod.title)

        // 2. Récupérer les vues avec les profils associés
        const { data, error } = await supabase
            .from('product_views')
            .select(`
                created_at,
                viewer_id,
                profiles (
                    id, full_name, avatar_url, city, is_pro
                )
            `)
            .eq('product_id', params.id)
            .not('viewer_id', 'is', null) // Uniquement les utilisateurs connectés
            .order('created_at', { ascending: false })

        if (data) {
            const uniqueViewers: any[] = []
            const seenIds = new Set()
            
            data.forEach((entry: any) => {
                // On vérifie que le profil existe et qu'on ne l'a pas déjà ajouté
                if (entry.profiles && !seenIds.has(entry.viewer_id)) {
                    seenIds.add(entry.viewer_id)
                    uniqueViewers.push({
                        created_at: entry.created_at,
                        profile: entry.profiles
                    })
                }
            })
            setViewers(uniqueViewers)
        }
        setLoading(false)
    }
    fetchData()
  }, [params.id, supabase])

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm pt-safe flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600"><ArrowLeft size={22} /></button>
        <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">Visiteurs uniques</h1>
            <p className="text-[10px] text-brand font-bold uppercase truncate">{productTitle}</p>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
            <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-brand" /></div>
        ) : viewers.length === 0 ? (
            <div className="text-center text-gray-400 pt-20">
                <Users size={48} className="mx-auto opacity-20 mb-4" />
                <p>Aucun utilisateur connecté n'a encore <br/>vu cette annonce.</p>
            </div>
        ) : (
            <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-4 font-medium px-1">Personnes ayant consulté votre annonce :</p>
                {viewers.map((entry) => (
                    <Link 
                        key={entry.profile.id} 
                        href={`/profil/${entry.profile.id}`}
                        className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-gray-100 shadow-sm active:scale-[0.98] transition group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden relative border-2 border-white shadow-sm">
                            {entry.profile.avatar_url ? (
                                <Image src={entry.profile.avatar_url} alt="" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate flex items-center gap-1">
                                {entry.profile.full_name}
                                {entry.profile.is_pro && <div className="w-2 h-2 bg-brand rounded-full" />}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <span>{entry.profile.city}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5"><Calendar size={10}/> {new Date(entry.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-brand transition" />
                    </Link>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}