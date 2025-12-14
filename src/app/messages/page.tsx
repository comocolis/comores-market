'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Home, Search, MessageCircle, User, Loader2, Plus, ArrowRight, Inbox } from 'lucide-react'
import { toast } from 'sonner'

export default function MessagesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  // 1. Fonction pour récupérer les messages (réutilisable)
  const fetchMessages = useCallback(async (userId: string) => {
    const { data } = await supabase.from('messages')
        .select('*, sender:profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name), product:products(title)')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
    
    if (data) setMessages(data)
    setLoading(false)
  }, [supabase])

  // 2. Initialisation + Abonnement Temps Réel
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/publier'); return }
      
      setCurrentUser(user)
      await fetchMessages(user.id)

      // --- C'EST ICI QUE LA MAGIE OPÈRE (REALTIME) ---
      const channel = supabase
        .channel('realtime-messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const newMessage = payload.new as any
            
            // Si le message est pour moi OU envoyé par moi (sur un autre appareil)
            if (newMessage.receiver_id === user.id || newMessage.sender_id === user.id) {
                // On recharge la liste pour avoir les infos complètes (nom, produit...)
                fetchMessages(user.id)
                
                // Petit son ou notif visuelle si c'est reçu
                if (newMessage.receiver_id === user.id) {
                    toast.info("Nouveau message reçu !")
                }
            }
          }
        )
        .subscribe()

      // Nettoyage quand on quitte la page
      return () => {
        supabase.removeChannel(channel)
      }
    }

    init()
  }, [router, supabase, fetchMessages])

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans flex flex-col">
      
      {/* HEADER FIXE */}
      <div className="bg-brand pt-safe px-6 pb-4 shadow-sm sticky top-0 z-30">
        <h1 className="text-white font-bold text-xl mt-3">Messages</h1>
      </div>

      {/* CONTENU */}
      <div className="px-4 py-4 flex-1 flex flex-col">
        {loading ? (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-brand" />
            </div>
        ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60 pb-20">
                <div className="bg-gray-200 p-4 rounded-full mb-3">
                    <Inbox size={32} />
                </div>
                <p className="font-medium">Aucun message pour le moment.</p>
            </div>
        ) : (
            <div className="space-y-3">
                {messages.map(m => {
                    const isMe = m.sender_id === currentUser?.id
                    return (
                        <div key={m.id} className={`p-4 rounded-xl shadow-sm border active:scale-[0.98] transition-transform ${isMe ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-bold text-brand uppercase tracking-wider">{m.product?.title || 'Annonce supprimée'}</p>
                                <span className="text-[9px] text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <p className="text-gray-800 text-sm mb-2 line-clamp-2">
                                {isMe && <span className="text-gray-400 font-bold mr-1">Moi:</span>}
                                {m.content}
                            </p>
                            
                            <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 border-t border-gray-200/50 pt-2">
                                <span className="flex items-center gap-1">
                                    <User size={10} /> 
                                    {isMe ? `À : ${m.receiver?.full_name}` : `De : ${m.sender?.full_name}`}
                                </span>
                                <Link href={`/annonce/${m.product_id}`} className="flex items-center gap-1 text-brand font-bold bg-brand/10 px-2 py-1 rounded-full hover:bg-brand hover:text-white transition">
                                    Répondre <ArrowRight size={10} />
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand transition"><Home size={24} /><span className="text-[9px] font-bold">Accueil</span></Link>
          <Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand transition"><Search size={24} /><span className="text-[9px] font-bold">Recherche</span></Link>
          <div className="flex justify-center relative -top-6">
            <Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 border-4 border-white hover:scale-105 transition"><Plus strokeWidth={3} size={28} /></Link>
          </div>
          <Link href="/messages" className="flex flex-col items-center justify-center gap-1 h-full text-brand"><MessageCircle size={24} /><span className="text-[9px] font-bold">Messages</span></Link>
          <Link href="/compte" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand transition"><User size={24} /><span className="text-[9px] font-bold">Compte</span></Link>
        </div>
      </nav>
    </div>
  )
}