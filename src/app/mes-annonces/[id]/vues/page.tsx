'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, User, Users, Loader2, Calendar, 
  ChevronRight, MessageCircle, ShieldCheck 
} from 'lucide-react'

export default function ProductViewersPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const [viewers, setViewers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [productTitle, setProductTitle] = useState('')

  useEffect(() => {
    const fetchData = async () => {
        // 1. Infos produit pour le titre
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
            .not('viewer_id', 'is', null)
            .order('created_at', { ascending: false })

        if (data) {
            const uniqueViewers: any[] = []
            const seenIds = new Set()
            
            data.forEach((entry: any) => {
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
      {/* HEADER */}
      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm pt-safe flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={22} />
        </button>
        <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">Visiteurs intéressés</h1>
            <p className="text-[10px] text-brand font-bold uppercase truncate tracking-tight">{productTitle}</p>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
            <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-brand" /></div>
        ) : viewers.length === 0 ? (
            <div className="text-center text-gray-400 pt-20">
                <Users size={48} className="mx-auto opacity-10 mb-4" />
                <p className="text-sm">Aucun utilisateur connecté n'a encore <br/>consulté cette annonce.</p>
            </div>
        ) : (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1 mb-4">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Prospects récents</p>
                    <span className="bg-brand/10 text-brand text-[10px] px-2 py-0.5 rounded-full font-bold">{viewers.length}</span>
                </div>

                {viewers.map((entry) => (
                    <div 
                        key={entry.profile.id} 
                        className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-gray-100 shadow-sm hover:border-brand/30 transition group"
                    >
                        {/* CLIC SUR L'IMAGE -> PROFIL */}
                        <Link href={`/profil/${entry.profile.id}`} className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden relative border-2 border-white shadow-sm active:scale-90 transition">
                                {entry.profile.avatar_url ? (
                                    <Image src={entry.profile.avatar_url} alt="" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                                )}
                            </div>
                            {entry.profile.is_pro && (
                                <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
                                    <ShieldCheck size={12} className="text-brand fill-brand/10" />
                                </div>
                            )}
                        </Link>

                        {/* INFOS VISITEUR */}
                        <Link href={`/profil/${entry.profile.id}`} className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate text-gray-900 group-hover:text-brand transition">
                                {entry.profile.full_name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                <span className="truncate">{entry.profile.city || 'Comores'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5"><Calendar size={10}/> {new Date(entry.created_at).toLocaleDateString()}</span>
                            </div>
                        </Link>

                        {/* ACTIONS : MESSAGE OU VOIR PROFIL */}
                        <div className="flex items-center gap-2">
                            <Link 
                                href={`/messages?user=${entry.profile.id}&product=${params.id}`}
                                className="p-2.5 bg-brand text-white rounded-xl shadow-lg shadow-brand/20 active:scale-90 transition"
                                title="Contacter"
                            >
                                <MessageCircle size={18} />
                            </Link>
                            <Link href={`/profil/${entry.profile.id}`} className="p-2 text-gray-300 hover:text-gray-600 transition">
                                <ChevronRight size={18} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* PETIT CONSEIL */}
      {!loading && viewers.length > 0 && (
          <div className="mx-4 mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
              <div className="text-blue-500 shrink-0"><MessageCircle size={20} /></div>
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                  <strong>Conseil :</strong> N'hésitez pas à envoyer un message de courtoisie pour savoir si le visiteur a besoin d'informations complémentaires sur votre annonce.
              </p>
          </div>
      )}
    </div>
  )
}