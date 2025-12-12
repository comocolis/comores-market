'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, Search, MessageCircle, User, Loader2, Plus, ArrowRight } from 'lucide-react'

export default function MessagesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/publier'); return }
      const { data } = await supabase.from('messages').select('*, sender:profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name), product:products(title)').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false })
      setMessages(data || [])
      setLoading(false)
    }
    getData()
  }, [router, supabase])

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-brand pt-safe px-6 pb-6 shadow-sm"><h1 className="text-white font-bold text-xl mt-4">Messages</h1></div>
      <div className="px-4 py-6">
        {messages.length === 0 ? <div className="text-center py-20"><p className="text-gray-400">Aucun message pour le moment.</p></div> : (
            <div className="space-y-3">{messages.map(m => (<div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-brand mb-1">{m.product?.title || 'Annonce'}</p><p className="text-gray-800 text-sm mb-2">{m.content}</p><div className="flex justify-between items-center text-[10px] text-gray-400"><span>{new Date(m.created_at).toLocaleDateString()}</span><Link href={`/annonce/${m.product_id}`} className="flex items-center gap-1 text-brand font-bold">Voir l'annonce <ArrowRight size={12} /></Link></div></div>))}</div>
        )}
      </div>
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe z-50"><div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2"><Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><Home size={24} /><span className="text-[9px] font-bold">Accueil</span></Link><Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><Search size={24} /><span className="text-[9px] font-bold">Recherche</span></Link><div className="flex justify-center relative -top-6"><Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 border-4 border-white"><Plus strokeWidth={3} size={28} /></Link></div><Link href="/messages" className="flex flex-col items-center justify-center gap-1 h-full text-brand"><MessageCircle size={24} /><span className="text-[9px] font-bold">Messages</span></Link><Link href="/compte" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><User size={24} /><span className="text-[9px] font-bold">Compte</span></Link></div></nav>
    </div>
  )
}