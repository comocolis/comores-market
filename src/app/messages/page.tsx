'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Search, MessageCircle, User, Loader2, Plus, ArrowLeft, Send, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'

type Conversation = {
  id: string
  productId: string
  productTitle: string
  productImage: string | null
  counterpartId: string
  counterpartName: string
  lastMessage: string
  lastDate: string
  messages: any[]
}

export default function MessagesPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [view, setView] = useState<'list' | 'chat'>('list')
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchAndGroupMessages = async (userId: string) => {
    const { data, error } = await supabase.from('messages')
        .select('*, sender:profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name), product:products(title, images)')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true })

    if (error || !data) {
        setLoading(false)
        return
    }

    const groups: { [key: string]: Conversation } = {}

    data.forEach((msg) => {
        const isMe = msg.sender_id === userId
        const otherId = isMe ? msg.receiver_id : msg.sender_id
        const otherName = (isMe ? msg.receiver?.full_name : msg.sender?.full_name) || 'Utilisateur'
        
        const key = `${msg.product_id}-${otherId}`
        
        let img = null
        try { 
            if (msg.product?.images) {
                const parsed = JSON.parse(msg.product.images)
                if (Array.isArray(parsed) && parsed.length > 0) img = parsed[0]
            }
        } catch {}

        if (!groups[key]) {
            groups[key] = {
                id: key,
                productId: msg.product_id,
                productTitle: msg.product?.title || 'Produit',
                productImage: img,
                counterpartId: otherId,
                counterpartName: otherName,
                lastMessage: '',
                lastDate: '',
                messages: []
            }
        }
        
        groups[key].messages.push(msg)
        groups[key].lastMessage = msg.content
        groups[key].lastDate = msg.created_at
    })

    const sortedConvs = Object.values(groups).sort((a, b) => 
        new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    )

    setConversations(sortedConvs)
    setLoading(false)
    
    if (activeConv) {
        const updatedActive = sortedConvs.find(c => c.id === activeConv.id)
        if (updatedActive) setActiveConv(updatedActive)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/publier'); return }
      setCurrentUser(user)
      await fetchAndGroupMessages(user.id)

      const channel = supabase.channel('chat-room')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
            const m = payload.new as any
            if (m.sender_id === user.id || m.receiver_id === user.id) {
                fetchAndGroupMessages(user.id)
            }
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    init()
  }, [router, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv])

  const handleSend = async () => {
    if (!replyContent.trim() || !activeConv || !currentUser) return
    setSending(true)

    const { error } = await supabase.from('messages').insert({
        content: replyContent,
        sender_id: currentUser.id,
        receiver_id: activeConv.counterpartId,
        product_id: activeConv.productId
    })

    if (error) toast.error("Erreur d'envoi")
    else setReplyContent('')
    setSending(false)
  }

  if (view === 'list') {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <div className="bg-brand pt-12 px-6 pb-4 shadow-sm sticky top-0 z-30">
                <h1 className="text-white font-bold text-xl mt-2">Mes Messages</h1>
            </div>

            <div className="px-4 py-4 space-y-2">
                {loading ? (
                    <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand" /></div>
                ) : conversations.length === 0 ? (
                    <div className="text-center text-gray-400 pt-20">
                        <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Aucune discussion.</p>
                    </div>
                ) : (
                    conversations.map(conv => (
                        <div 
                            key={conv.id} 
                            onClick={() => { setActiveConv(conv); setView('chat') }}
                            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center active:scale-[0.98] transition cursor-pointer"
                        >
                            <div className="w-14 h-14 bg-gray-100 rounded-full shrink-0 relative overflow-hidden border border-gray-200">
                                {conv.productImage ? (
                                    <Image src={conv.productImage} alt="" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag size={20} /></div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-gray-900 truncate text-sm">{conv.counterpartName}</h3>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                        {new Date(conv.lastDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-xs text-brand font-bold truncate mb-0.5">{conv.productTitle}</p>
                                <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe z-50 shadow-md">
                <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2">
                <Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><Home size={24} /><span className="text-[9px] font-bold">Accueil</span></Link>
                <Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><Search size={24} /><span className="text-[9px] font-bold">Recherche</span></Link>
                <div className="flex justify-center relative -top-6"><Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 border-4 border-white"><Plus strokeWidth={3} size={28} /></Link></div>
                <Link href="/messages" className="flex flex-col items-center justify-center gap-1 h-full text-brand"><MessageCircle size={24} /><span className="text-[9px] font-bold">Messages</span></Link>
                <Link href="/compte" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><User size={24} /><span className="text-[9px] font-bold">Compte</span></Link>
                </div>
            </nav>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
        <div className="bg-white px-4 pb-3 pt-12 shadow-sm flex items-center gap-3 sticky top-0 z-40">
            <button onClick={() => setView('list')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 truncate">{activeConv?.counterpartName}</h2>
                <p className="text-xs text-brand font-medium truncate flex items-center gap-1">
                    <ShoppingBag size={10} /> {activeConv?.productTitle}
                </p>
            </div>
            {activeConv?.productImage && (
                <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-gray-100">
                    <Image src={activeConv.productImage} alt="" fill className="object-cover" />
                </div>
            )}
        </div>

        {/* MESSAGES : FIX SCROLL BOTTOM */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5]/10">
            <div className="flex flex-col justify-end min-h-full space-y-3">
                {activeConv?.messages.map((msg, i) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div 
                                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm relative ${
                                    isMe 
                                    ? 'bg-brand text-white rounded-br-none' 
                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                }`}
                            >
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>

        <div className="bg-white p-3 border-t border-gray-200 pb-safe">
            <div className="flex items-end gap-2 bg-gray-100 p-2 rounded-2xl">
                <textarea 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm max-h-32 min-h-10 py-2 resize-none"
                    placeholder="Écrivez votre message..."
                    rows={1}
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                />
                <button 
                    onClick={handleSend}
                    disabled={sending || !replyContent.trim()}
                    className="bg-brand text-white p-2.5 rounded-full shadow-md hover:bg-brand-dark transition disabled:opacity-50 disabled:scale-95"
                >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                </button>
            </div>
        </div>
    </div>
  )
}