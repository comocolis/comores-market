'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Search, MessageCircle, User, Loader2, Plus, ArrowLeft, Send, ShoppingBag, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

// Type étendu pour la gestion locale
type Message = {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
  pending?: boolean // Pour l'effet "Envoi en cours"
}

type Conversation = {
  id: string
  productId: string
  productTitle: string
  productImage: string | null
  counterpartId: string
  counterpartName: string
  counterpartAvatar: string | null
  lastMessage: string
  lastDate: string
  unreadCount: number
  messages: Message[]
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // --- CHARGEMENT DES DONNÉES ---
  const fetchAndGroupMessages = async (userId: string) => {
    const { data, error } = await supabase.from('messages')
        .select(`
            *, 
            sender:profiles!sender_id(full_name, avatar_url), 
            receiver:profiles!receiver_id(full_name, avatar_url), 
            product:products(title, images)
        `)
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
        const otherProfile = isMe ? msg.receiver : msg.sender
        const otherName = otherProfile?.full_name || 'Utilisateur'
        const otherAvatar = otherProfile?.avatar_url
        
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
                counterpartAvatar: otherAvatar,
                lastMessage: '',
                lastDate: '',
                unreadCount: 0,
                messages: []
            }
        }
        
        groups[key].messages.push(msg)
        groups[key].lastMessage = msg.content
        groups[key].lastDate = msg.created_at
        
        // Comptage des non-lus (Si je suis le destinataire et que ce n'est pas lu)
        if (!isMe && !msg.is_read) {
            groups[key].unreadCount++
        }
    })

    const sortedConvs = Object.values(groups).sort((a, b) => 
        new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    )

    setConversations(sortedConvs)
    setLoading(false)
    
    // Mise à jour temps réel de la conversation active
    if (activeConv) {
        const updated = sortedConvs.find(c => c.id === activeConv.id)
        if (updated) {
            // On ne remplace pas tout brutalement pour éviter le saut d'écran, 
            // on ajoute juste les nouveaux messages si nécessaire
            if (updated.messages.length > activeConv.messages.length) {
                setActiveConv(updated)
            }
        }
    }
  }

  // --- MARQUER COMME LU ---
  const markAsRead = async (conv: Conversation) => {
    if (conv.unreadCount > 0) {
        // Optimistic update local
        const updatedConvs = conversations.map(c => 
            c.id === conv.id ? { ...c, unreadCount: 0 } : c
        )
        setConversations(updatedConvs)

        // Update DB
        await supabase.from('messages')
            .update({ is_read: true })
            .eq('product_id', conv.productId)
            .eq('sender_id', conv.counterpartId) // On marque ceux reçus de l'autre
            .eq('receiver_id', currentUser.id)
            .eq('is_read', false)
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
            // Si je suis concerné, je rafraîchis
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

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages, view])

  // Au clic sur une conversation
  const openConversation = (conv: Conversation) => {
    setActiveConv(conv)
    setView('chat')
    markAsRead(conv)
  }

  // --- ENVOI INSTANTANÉ (OPTIMISTIC UI) ---
  const handleSend = async () => {
    if (!replyContent.trim() || !activeConv || !currentUser) return
    
    const tempId = Date.now().toString()
    const content = replyContent
    setReplyContent('') // Reset input immédiatement
    inputRef.current?.focus() // Garder le clavier ouvert

    // 1. Création message temporaire (Optimistic)
    const optimisticMsg: Message = {
        id: tempId,
        content: content,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
        is_read: false,
        pending: true // Indicateur visuel "En cours"
    }

    // 2. Mise à jour immédiate de l'affichage
    const updatedConv = {
        ...activeConv,
        messages: [...activeConv.messages, optimisticMsg],
        lastMessage: content,
        lastDate: new Date().toISOString()
    }
    setActiveConv(updatedConv)

    // 3. Envoi réel au serveur
    const { error } = await supabase.from('messages').insert({
        content: content,
        sender_id: currentUser.id,
        receiver_id: activeConv.counterpartId,
        product_id: activeConv.productId
    })

    if (error) {
        toast.error("Échec de l'envoi")
        // En cas d'erreur, on pourrait retirer le message, 
        // mais le rafraîchissement temps réel va corriger l'état rapidement.
    }
  }

  // --- VUE LISTE ---
  if (view === 'list') {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <div className="bg-brand pt-12 px-6 pb-4 shadow-sm sticky top-0 z-30">
                <h1 className="text-white font-bold text-xl mt-2">Discussions</h1>
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
                            onClick={() => openConversation(conv)}
                            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center active:scale-[0.98] transition cursor-pointer relative"
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
                                    <h3 className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                                        {conv.counterpartName}
                                    </h3>
                                    <span className={`text-[10px] whitespace-nowrap ml-2 ${conv.unreadCount > 0 ? 'text-brand font-bold' : 'text-gray-400'}`}>
                                        {new Date(conv.lastDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                    </span>
                                </div>
                                <p className="text-xs text-brand font-bold truncate mb-0.5">{conv.productTitle}</p>
                                <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                    {conv.lastMessage}
                                </p>
                            </div>

                            {/* Badge NON LU */}
                            {conv.unreadCount > 0 && (
                                <div className="absolute right-3 top-1/2 mt-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm animate-in zoom-in">
                                    {conv.unreadCount}
                                </div>
                            )}
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

  // --- VUE CHAT ---
  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5] font-sans">
        <div className="bg-white px-4 pb-3 pt-12 shadow-sm flex items-center gap-3 sticky top-0 z-40">
            <button onClick={() => { setView('list'); fetchAndGroupMessages(currentUser.id) }} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
            </button>
            
            {/* Avatar Interlocuteur */}
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative border border-gray-100">
                {activeConv?.counterpartAvatar ? (
                    <Image src={activeConv.counterpartAvatar} alt="" fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 truncate text-sm">{activeConv?.counterpartName}</h2>
                <p className="text-xs text-brand font-medium truncate flex items-center gap-1">
                    <ShoppingBag size={10} /> {activeConv?.productTitle}
                </p>
            </div>
        </div>

        {/* Zone Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-[url('/chat-bg-pattern.png')] bg-repeat bg-opacity-5">
            <div className="flex flex-col justify-end min-h-full space-y-2">
                {activeConv?.messages.map((msg, i) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                        <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                            <div 
                                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm relative group ${
                                    isMe 
                                    ? 'bg-brand text-white rounded-br-sm' 
                                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                }`}
                            >
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                                    <span>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {isMe && (
                                        msg.pending ? <Loader2 size={10} className="animate-spin" /> : 
                                        (msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />)
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>

        {/* Input Zone */}
        <div className="bg-white p-3 border-t border-gray-200 pb-safe">
            <div className="flex items-end gap-2 bg-gray-100 p-2 rounded-3xl border border-transparent focus-within:border-brand/30 focus-within:bg-white focus-within:shadow-sm transition-all">
                <textarea 
                    ref={inputRef}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm max-h-32 min-h-10 py-2.5 px-2 resize-none"
                    placeholder="Écrivez un message..."
                    rows={1}
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <button 
                    onClick={handleSend}
                    disabled={!replyContent.trim()}
                    className="bg-brand text-white p-2.5 rounded-full shadow-md hover:bg-brand-dark transition disabled:opacity-50 disabled:scale-90 active:scale-95 mb-0.5"
                >
                    <Send size={18} className="ml-0.5" />
                </button>
            </div>
        </div>
    </div>
  )
}