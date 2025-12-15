'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Home, Search, MessageCircle, User, Loader2, Plus, ArrowLeft, Send, 
  ShoppingBag, Check, CheckCheck, MoreVertical, Phone, Trash2, ExternalLink 
} from 'lucide-react'
import { toast } from 'sonner'

// Types
type Message = {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
  pending?: boolean
  sender_avatar?: string | null 
}

type Conversation = {
  id: string
  productId: string
  productTitle: string
  productImage: string | null
  productPhone: string | null
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
  const [showMenu, setShowMenu] = useState(false)
  
  const [replyContent, setReplyContent] = useState('')
  
  // Refs pour gérer l'état sans re-render intempestif
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeConvIdRef = useRef<string | null>(null) // ASTUCE: Garde l'ID actif en mémoire pour le temps réel

  // --- CHARGEMENT ---
  const fetchAndGroupMessages = async (userId: string) => {
    const { data, error } = await supabase.from('messages')
        .select(`
            *, 
            sender:profiles!sender_id(full_name, avatar_url), 
            receiver:profiles!receiver_id(full_name, avatar_url), 
            product:products(title, images, whatsapp_number)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true })

    if (error || !data) {
        setLoading(false)
        return
    }

    const groups: { [key: string]: Conversation } = {}

    data.forEach((msg: any) => {
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
                productPhone: msg.product?.whatsapp_number || null,
                counterpartId: otherId,
                counterpartName: otherName,
                counterpartAvatar: otherAvatar,
                lastMessage: '',
                lastDate: '',
                unreadCount: 0,
                messages: []
            }
        }
        
        const messageWithAvatar: Message = {
            ...msg,
            sender_avatar: msg.sender?.avatar_url
        }
        
        groups[key].messages.push(messageWithAvatar)
        groups[key].lastMessage = msg.content
        groups[key].lastDate = msg.created_at
        
        if (!isMe && !msg.is_read) {
            groups[key].unreadCount++
        }
    })

    const sortedConvs = Object.values(groups).sort((a, b) => 
        new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    )

    setConversations(sortedConvs)
    setLoading(false)
    
    // MISE À JOUR LIVE DE LA CONVERSATION ACTIVE
    // On utilise la Ref pour savoir quelle conv est ouverte sans dépendre du state
    const currentOpenId = activeConvIdRef.current
    if (currentOpenId) {
        const updatedActive = sortedConvs.find(c => c.id === currentOpenId)
        if (updatedActive) {
            setActiveConv(updatedActive)
            // Scroll vers le bas si un nouveau message arrive
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
    }
  }

  const markAsRead = async (conv: Conversation) => {
    if (conv.unreadCount > 0) {
        const updatedConvs = conversations.map(c => 
            c.id === conv.id ? { ...c, unreadCount: 0 } : c
        )
        setConversations(updatedConvs)

        await supabase.from('messages')
            .update({ is_read: true })
            .eq('product_id', conv.productId)
            .eq('sender_id', conv.counterpartId)
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

      // Abonnement Temps Réel
      const channel = supabase.channel('chat-room')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
            const m = payload.new as any
            // Si le message me concerne (envoyé ou reçu)
            if (m.sender_id === user.id || m.receiver_id === user.id) {
                // On recharge les messages, ce qui mettra à jour l'interface grâce à activeConvIdRef
                fetchAndGroupMessages(user.id)
            }
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    init()
  }, [router, supabase])

  // Scroll initial
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [view])

  const openConversation = (conv: Conversation) => {
    setActiveConv(conv)
    activeConvIdRef.current = conv.id // On mémorise l'ID actif
    setView('chat')
    setShowMenu(false)
    markAsRead(conv)
  }

  const closeConversation = () => {
    setView('list')
    setActiveConv(null)
    activeConvIdRef.current = null // On oublie l'ID
    fetchAndGroupMessages(currentUser.id) // Rafraîchir la liste
  }

  // --- ACTIONS ---

  const handleCall = () => {
    if (!activeConv?.productPhone) {
        toast.error("Aucun numéro disponible.")
        return
    }
    const cleanNumber = activeConv.productPhone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanNumber}`, '_blank')
  }

  const handleDeleteConversation = async () => {
    if (!activeConv || !currentUser) return
    if (!confirm("Supprimer cette conversation ?")) return

    const { error } = await supabase.from('messages')
        .delete()
        .eq('product_id', activeConv.productId)
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeConv.counterpartId}),and(sender_id.eq.${activeConv.counterpartId},receiver_id.eq.${currentUser.id})`)

    if (error) {
        toast.error("Erreur suppression")
    } else {
        toast.success("Supprimée")
        closeConversation()
    }
  }

  const handleSend = async () => {
    if (!replyContent.trim() || !activeConv || !currentUser) return
    
    const tempId = Date.now().toString()
    const content = replyContent
    setReplyContent('') 
    inputRef.current?.focus() 

    const optimisticMsg: Message = {
        id: tempId,
        content: content,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
        is_read: false,
        pending: true
    }

    // Mise à jour immédiate locale
    const updatedConv = {
        ...activeConv,
        messages: [...activeConv.messages, optimisticMsg],
        lastMessage: content,
        lastDate: new Date().toISOString()
    }
    setActiveConv(updatedConv)
    // Scroll forcé
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const { error } = await supabase.from('messages').insert({
        content: content,
        sender_id: currentUser.id,
        receiver_id: activeConv.counterpartId,
        product_id: activeConv.productId
    })

    if (error) toast.error("Échec envoi")
  }

  // --- VUE LISTE ---
  if (view === 'list') {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* HEADER VERT (IDENTITÉ) */}
            <div className="bg-brand pt-12 px-6 pb-4 sticky top-0 z-30 shadow-md">
                <h1 className="text-white font-extrabold text-2xl tracking-tight">Discussions</h1>
            </div>

            <div className="px-4 py-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand" /></div>
                ) : conversations.length === 0 ? (
                    <div className="text-center text-gray-400 pt-20 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle size={32} className="opacity-30" />
                        </div>
                        <p>Aucune discussion pour le moment.</p>
                    </div>
                ) : (
                    conversations.map(conv => (
                        <div key={conv.id} onClick={() => openConversation(conv)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center active:scale-[0.98] transition cursor-pointer hover:shadow-md relative">
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0 relative overflow-hidden border border-gray-100">
                                {conv.productImage ? (<Image src={conv.productImage} alt="" fill className="object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag size={20} /></div>)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>{conv.counterpartName}</h3>
                                    <span className={`text-[10px] whitespace-nowrap ${conv.unreadCount > 0 ? 'text-brand font-bold' : 'text-gray-400'}`}>{new Date(conv.lastDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <p className="text-[10px] text-brand font-bold uppercase tracking-wide truncate mb-0.5">{conv.productTitle}</p>
                                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                                    </div>
                                    {conv.unreadCount > 0 && (<div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm animate-in zoom-in shrink-0">{conv.unreadCount}</div>)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"><div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2"><Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><Home size={24} /><span className="text-[9px] font-bold">Accueil</span></Link><Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><Search size={24} /><span className="text-[9px] font-bold">Recherche</span></Link><div className="flex justify-center relative -top-6"><Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 border-4 border-white"><Plus strokeWidth={3} size={28} /></Link></div><Link href="/messages" className="flex flex-col items-center justify-center gap-1 h-full text-brand"><MessageCircle size={24} /><span className="text-[9px] font-bold">Messages</span></Link><Link href="/compte" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><User size={24} /><span className="text-[9px] font-bold">Compte</span></Link></div></nav>
        </div>
    )
  }

  // --- VUE CHAT ---
  return (
    <div className="flex flex-col h-screen bg-[#F7F8FA] font-sans">
        
        {/* HEADER VERT (IDENTITÉ) */}
        <div className="bg-brand px-4 pb-3 pt-12 shadow-md flex items-center gap-3 sticky top-0 z-40 text-white">
            <button onClick={closeConversation} className="p-2 -ml-2 text-white/80 hover:bg-white/20 rounded-full transition">
                <ArrowLeft size={22} />
            </button>
            
            <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden relative border border-white/30">
                {activeConv?.counterpartAvatar ? (<Image src={activeConv.counterpartAvatar} alt="" fill className="object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-white"><User size={20} /></div>)}
            </div>

            <div className="flex-1 min-w-0">
                <h2 className="font-bold text-white truncate text-sm">{activeConv?.counterpartName}</h2>
                <div className="flex items-center gap-1.5 opacity-90">
                    <div className="w-4 h-4 rounded-md overflow-hidden relative bg-white/20 shrink-0">
                         {activeConv?.productImage && <Image src={activeConv.productImage} alt="" fill className="object-cover" />}
                    </div>
                    <p className="text-xs text-white/80 font-medium truncate max-w-40">{activeConv?.productTitle}</p>
                </div>
            </div>
            
            {/* Boutons actions */}
            <div className="flex gap-1 relative">
                <button onClick={handleCall} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition" title="WhatsApp">
                    <Phone size={20} />
                </button>
                
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition">
                    <MoreVertical size={20} />
                </button>

                {/* Menu Déroulant (Texte noir car sur fond blanc) */}
                {showMenu && (
                    <div className="absolute top-12 right-0 bg-white shadow-xl rounded-xl border border-gray-100 w-48 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                        <Link href={`/annonce/${activeConv?.productId}`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <ExternalLink size={16} /> Voir l'annonce
                        </Link>
                        <button onClick={handleDeleteConversation} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition text-left">
                            <Trash2 size={16} /> Supprimer
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Zone Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowMenu(false)}>
            <div className="flex flex-col justify-end min-h-full gap-2">
                
                <div className="flex justify-center my-2">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-200/50 px-3 py-1 rounded-full">Aujourd'hui</span>
                </div>

                {activeConv?.messages.map((msg, i) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                        <div key={msg.id || i} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-200`}>
                            
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative shrink-0 mb-1 shadow-sm border border-white">
                                    {msg.sender_avatar ? (<Image src={msg.sender_avatar} alt="" fill className="object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400"><User size={14} /></div>)}
                                </div>
                            )}

                            <div 
                                className={`max-w-[70%] px-4 py-2.5 shadow-sm text-[14px] leading-relaxed relative group ${
                                    isMe 
                                    ? 'bg-brand text-white rounded-2xl' // Vert Brand pour moi
                                    : 'bg-white text-gray-800 rounded-2xl' // Blanc pour l'autre
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                    <span>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {isMe && (msg.pending ? <Loader2 size={10} className="animate-spin" /> : (msg.is_read ? <CheckCheck size={12} strokeWidth={2} /> : <Check size={12} strokeWidth={2} />))}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>

        {/* Input Zone */}
        <div className="bg-white p-2 pb-safe border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
            <div className="flex items-end gap-2 bg-[#F2F4F7] p-1.5 rounded-3xl border border-transparent focus-within:border-brand/20 focus-within:bg-white focus-within:shadow-md transition-all duration-200">
                <button className="p-2.5 text-gray-400 hover:text-brand transition rounded-full hover:bg-gray-200/50">
                    <Plus size={20} />
                </button>
                <textarea 
                    ref={inputRef}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] max-h-32 min-h-11 py-2.5 px-1 resize-none placeholder:text-gray-400"
                    placeholder="Message..."
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
                <button onClick={handleSend} disabled={!replyContent.trim()} className="bg-brand text-white p-2.5 rounded-full shadow-md hover:bg-brand-dark transition disabled:opacity-50 disabled:scale-90 active:scale-95 mb-0.5">
                    <Send size={18} className="ml-0.5" />
                </button>
            </div>
        </div>
    </div>
  )
}