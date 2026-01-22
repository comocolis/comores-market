'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MessageCircle, User, Loader2, ArrowLeft, Send, 
  ShoppingBag, Check, MoreVertical, Phone, Trash2, ExternalLink, AlertTriangle,
  Camera, X, CheckCircle2, Sparkles, Search, ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { sendNewMessageEmail } from '@/app/actions/email'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { motion, AnimatePresence } from 'framer-motion'

// UTILITAIRE
const getOptimizedImage = (url: string | null, width = 200) => {
  if (!url) return null;
  if (url.includes('supabase.co')) {
    return `${url}?width=${width}&quality=75&resize=contain`;
  }
  return url;
};

type Message = { id: string, content: string, sender_id: string, created_at: string, is_read: boolean, pending?: boolean, sender_avatar?: string | null }
type Conversation = { id: string, productId: string, productTitle: string, productImage: string | null, productPhone: string | null, counterpartId: string, counterpartName: string, counterpartAvatar: string | null, counterpartIsPro: boolean, lastMessage: string, lastDate: string, unreadCount: number, messages: Message[] }

const textToDigits = (text: string) => {
    const map: { [key: string]: string } = { 'zero': '0', 'un': '1', 'deux': '2', 'trois': '3', 'quatre': '4', 'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9', 'vingt': '20', 'trente': '30' }
    return text.toLowerCase().split(/[\s,.-]+/).map(word => map[word] || word).join('').replace(/[^0-9]/g, "")
}
const containsPhoneNumber = (cleanText: string) => /\d{7,}/.test(cleanText);

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-dvh bg-[#F8FAFC]"><Loader2 className="animate-spin text-brand" size={32} /></div>}>
      <MessagesContent />
    </Suspense>
  )
}

function MessagesContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isBanned, setIsBanned] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [view, setView] = useState<'list' | 'chat'>('list')
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showMenu, setShowMenu] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const filteredConvs = conversations.filter(conv => 
    conv.counterpartName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.productTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const fetchAndGroupMessages = useCallback(async (userId: string) => {
    const { data, error } = await supabase
        .from('messages')
        .select(`
            id, content, sender_id, receiver_id, product_id, created_at, is_read,
            sender:profiles!sender_id(full_name, avatar_url, is_pro),
            receiver:profiles!receiver_id(full_name, avatar_url, is_pro),
            product:products(title, images, whatsapp_number)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true })

    if (error || !data) { setLoading(false); return }
    const groups: { [key: string]: Conversation } = {}
    
    data.forEach((msg: any) => {
        const isMe = msg.sender_id === userId
        const otherId = isMe ? msg.receiver_id : msg.sender_id
        const otherProfile = isMe ? msg.receiver : msg.sender
        const key = `${msg.product_id}-${otherId}`
        
        let img = null; 
        try { 
            if (msg.product?.images) { 
                const parsed = JSON.parse(msg.product.images); 
                img = Array.isArray(parsed) ? parsed[0] : parsed 
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
                counterpartName: otherProfile?.full_name || 'Utilisateur', 
                counterpartAvatar: otherProfile?.avatar_url, 
                counterpartIsPro: otherProfile?.is_pro || false, 
                lastMessage: '', 
                lastDate: '', 
                unreadCount: 0, 
                messages: [] 
            }
        }
        groups[key].messages.push({ ...msg, sender_avatar: msg.sender?.avatar_url })
        groups[key].lastMessage = msg.content.includes('messages_images') ? '📷 Photo' : msg.content
        groups[key].lastDate = msg.created_at
        if (!isMe && !msg.is_read) groups[key].unreadCount++
    })
    
    setConversations(Object.values(groups).sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()))
    setLoading(false)
  }, [supabase])

  const markAsRead = useCallback(async (conv: Conversation) => {
    if (!currentUser) return
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    await supabase.from('messages').update({ is_read: true }).match({ product_id: conv.productId, sender_id: conv.counterpartId, receiver_id: currentUser.id, is_read: false })
  }, [currentUser, supabase])

  useEffect(() => {
    const handleParams = async () => {
        const convId = searchParams.get('id')
        const targetUserId = searchParams.get('user')
        const targetProductId = searchParams.get('product')

        if (convId && conversations.length > 0) {
            const found = conversations.find(c => c.id === convId)
            if (found) { setActiveConv(found); setView('chat'); if (found.unreadCount > 0) markAsRead(found); return }
        } 
        
        if (targetUserId && targetProductId) {
            const compositeKey = `${targetProductId}-${targetUserId}`
            const existing = conversations.find(c => c.id === compositeKey)
            
            if (existing) {
                setActiveConv(existing); setView('chat');
            } else {
                try {
                    const [pRes, uRes] = await Promise.all([
                        supabase.from('products').select('title, images, whatsapp_number').eq('id', targetProductId).single(),
                        supabase.from('profiles').select('full_name, avatar_url, is_pro').eq('id', targetUserId).single()
                    ])
                    if (pRes.data && uRes.data) {
                        let img = null; try { if (pRes.data.images) { const parsed = JSON.parse(pRes.data.images); img = Array.isArray(parsed) ? parsed[0] : parsed } } catch {}
                        const stubConv: Conversation = { id: compositeKey, productId: targetProductId, productTitle: pRes.data.title, productImage: img, productPhone: pRes.data.whatsapp_number, counterpartId: targetUserId, counterpartName: uRes.data.full_name, counterpartAvatar: uRes.data.avatar_url, counterpartIsPro: uRes.data.is_pro, lastMessage: '', lastDate: new Date().toISOString(), unreadCount: 0, messages: [] }
                        setActiveConv(stubConv); setView('chat');
                    }
                } catch (e) { console.error(e) }
            }
        } else {
            setView('list'); setActiveConv(null);
        }
    }
    handleParams()
  }, [searchParams, conversations, markAsRead, supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setCurrentUser(user)
      
      const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', user.id).single()
      if (profile?.is_banned) setIsBanned(true)
      
      await fetchAndGroupMessages(user.id)
      
      const channel = supabase.channel('chat-room').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { fetchAndGroupMessages(user.id) }).subscribe()
      return () => { supabase.removeChannel(channel) }
    }
    init()
  }, [router, supabase, fetchAndGroupMessages])

  // Scroll automatique amélioré
  useEffect(() => { 
    if(view === 'chat' && activeConv) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
    }
  }, [activeConv?.messages, view])

  const openConversation = (conv: Conversation) => { router.push(`/messages?id=${conv.id}`) }
  const closeConversation = () => { router.push(`/messages`) }

  const handleCall = () => { 
    if (!activeConv?.productPhone) { toast.error("Aucun numéro."); return }; 
    window.open(`tel:${activeConv.productPhone.replace(/\D/g, '')}`, '_self') 
  }

  const handleDeleteConversation = async () => { 
      if (!activeConv || !currentUser) return; 
      try {
          const { data: imgMsgs } = await supabase.from('messages').select('content').eq('product_id', activeConv.productId).or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeConv.counterpartId}),and(sender_id.eq.${activeConv.counterpartId},receiver_id.eq.${currentUser.id})`).filter('content', 'ilike', '%messages_images%');
          if (imgMsgs && imgMsgs.length > 0) {
              const paths = imgMsgs.map((m: any) => m.content.split('messages_images/')[1]).filter(Boolean);
              if (paths.length > 0) await supabase.storage.from('messages_images').remove(paths);
          }
          const del1 = supabase.from('messages').delete().match({ product_id: activeConv.productId, sender_id: currentUser.id, receiver_id: activeConv.counterpartId });
          const del2 = supabase.from('messages').delete().match({ product_id: activeConv.productId, sender_id: activeConv.counterpartId, receiver_id: currentUser.id });
          await Promise.all([del1, del2]);
          setConversations(prev => prev.filter(c => c.id !== activeConv.id));
          toast.success("Discussion supprimée");
          setShowDeleteModal(false); closeConversation();
      } catch (err) { toast.error("Erreur suppression"); }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', currentUser.id).single()
    if (!profile?.is_pro) { toast.error("Réservé aux membres PRO"); return }
    setIsUploading(true)
    try {
        const fileName = `${currentUser.id}/${Date.now()}.${file.name.split('.').pop()}`
        await supabase.storage.from('messages_images').upload(fileName, file)
        const { data: { publicUrl } } = supabase.storage.from('messages_images').getPublicUrl(fileName)
        await supabase.from('messages').insert({ content: publicUrl, sender_id: currentUser.id, receiver_id: activeConv?.counterpartId, product_id: activeConv?.productId })
    } catch (error) { toast.error("Erreur image") } 
    finally { setIsUploading(false); if(fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleSend = async () => {
    if (!replyContent.trim() || !activeConv || !currentUser) return
    if (isBanned) { toast.error("Compte suspendu."); return }
    const myHistory = activeConv.messages.filter(m => m.sender_id === currentUser.id && !m.content.includes('messages_images')).slice(-5).map(m => textToDigits(m.content)).join("")
    if (containsPhoneNumber(myHistory + textToDigits(replyContent))) { toast.error("Coordonnées interdites."); return }
    const content = replyContent; setReplyContent(''); 
    const { error } = await supabase.from('messages').insert({ content, sender_id: currentUser.id, receiver_id: activeConv.counterpartId, product_id: activeConv.productId })
    if (!error) sendNewMessageEmail(activeConv.counterpartId, currentUser.user_metadata?.full_name || 'Utilisateur', content, activeConv.productId)
  }

  // --- VUE LISTE ---
  if (view === 'list') {
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-gray-900 overflow-x-hidden flex flex-col">
            {/* Header Fixe avec constraints Mobile */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-120 bg-brand pt-safe px-4 pb-6 z-30 shadow-md rounded-b-[2.5rem]">
                <div className="flex justify-between items-center mb-5 pt-4 px-2">
                    <div>
                        <h1 className="text-white font-black text-2xl tracking-tighter">Messages</h1>
                        <div className="flex items-center gap-1.5 opacity-60">
                            <Sparkles size={10} className="text-white" fill="currentColor" />
                            <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Messagerie Elite</p>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                        <MessageCircle size={14} className="text-white" />
                        <span className="text-xs font-black text-white">{conversations.filter(c => c.unreadCount > 0).length}</span>
                    </div>
                </div>
                <div className="relative group px-2">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} strokeWidth={3} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Chercher un contact..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-bold placeholder:text-gray-300 shadow-sm outline-none focus:ring-2 focus:ring-white/20 transition" 
                    />
                </div>
            </div>

            {/* Contenu Scrollable avec Padding pour Header et BottomNav */}
            <div className="flex-1 overflow-y-auto pt-44 pb-24 px-5 space-y-4">
                {loading ? (<div className="flex justify-center pt-10"><Loader2 className="animate-spin text-brand" size={32} /></div>) : filteredConvs.length === 0 ? (
                    <div className="text-center text-gray-300 pt-20 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm"><MessageCircle size={32} className="opacity-10" /></div>
                        <p className="font-black text-[10px] uppercase tracking-widest">Boîte de réception vide</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredConvs.map((conv, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} onClick={() => openConversation(conv)} 
                            className="bg-white p-4 rounded-4xl shadow-sm border border-white flex gap-4 items-center active:scale-[0.98] transition cursor-pointer hover:shadow-lg group">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl shrink-0 relative overflow-hidden shadow-inner">
                                    {conv.productImage ? (
                                      <Image src={getOptimizedImage(conv.productImage, 150) || '/placeholder.jpg'} alt="" fill className="object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag size={24} /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className={`text-[14px] truncate flex items-center gap-1.5 tracking-tight ${conv.unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-500'}`}>
                                            {conv.counterpartName} 
                                            {conv.counterpartIsPro && <ShieldCheck size={12} className="text-brand fill-brand/10" />}
                                        </h3>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${conv.unreadCount > 0 ? 'text-brand' : 'text-gray-300'}`}>{new Date(conv.lastDate).toLocaleDateString(undefined, {day:'numeric', month:'short'})}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <p className="text-[9px] text-brand font-black tracking-widest truncate mb-0.5 opacity-50">{conv.productTitle}</p>
                                            <p className={`text-[13px] truncate leading-tight ${conv.unreadCount > 0 ? 'font-black text-gray-900' : 'text-gray-400 font-medium'}`}>{conv.lastMessage}</p>
                                        </div>
                                        {conv.unreadCount > 0 && (<div className="w-5 h-5 bg-brand rounded-lg flex items-center justify-center text-[9px] text-white font-black shadow-lg shadow-brand/20 shrink-0">{conv.unreadCount}</div>)}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
  }

  // --- VUE CHAT (CORRIGÉE : Cadre Mobile Centré) ---
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-120 h-dvh bg-[#F8FAFC] font-sans text-gray-900 flex flex-col z-200 shadow-2xl border-x border-gray-100/50">
        
        {/* HEADER CHAT (Absolute dans le cadre) */}
        <div className="absolute top-0 left-0 w-full bg-brand px-4 pb-6 pt-safe shadow-md z-150 rounded-b-[2.5rem]">
            <div className="flex items-center gap-3 pt-4">
                <button onClick={closeConversation} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white border border-white/10 active:scale-90 transition">
                    <ArrowLeft size={22} />
                </button>
                <Link href={`/profil/${activeConv?.counterpartId}`} className="flex flex-1 items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 overflow-hidden relative border border-white/10 shrink-0">
                        {activeConv?.counterpartAvatar ? (
                          <Image src={getOptimizedImage(activeConv.counterpartAvatar, 100) || '/placeholder.jpg'} alt="" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50"><User size={22} /></div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-black truncate text-[14px] text-white tracking-tight flex items-center gap-1.5 leading-none">
                            {activeConv?.counterpartName}
                            {activeConv?.counterpartIsPro && <ShieldCheck size={14} className="text-white fill-white/20" />}
                        </h2>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest truncate mt-1.5">{activeConv?.productTitle}</p>
                    </div>
                </Link>
                <div className="flex gap-2">
                    {activeConv?.productPhone && (<button onClick={handleCall} className="p-3 bg-white/10 rounded-2xl text-white border border-white/10 active:scale-90 transition"><Phone size={20} /></button>)}
                    <button onClick={() => setShowMenu(!showMenu)} className="p-3 bg-white/10 rounded-2xl text-white border border-white/10 active:scale-90 transition"><MoreVertical size={20} /></button>
                </div>
            </div>
            {showMenu && (
                <div className="absolute top-full right-6 mt-2 bg-white shadow-2xl rounded-4xl border border-gray-100 w-52 py-3 z-200 animate-in fade-in slide-in-from-top-2">
                    <Link href={`/annonce/${activeConv?.productId}`} className="flex items-center gap-3 px-5 py-4 text-[10px] text-gray-700 font-black uppercase tracking-widest hover:bg-gray-50 transition"><ExternalLink size={16}/> Voir l'annonce</Link>
                    <button onClick={() => { setShowMenu(false); setShowDeleteModal(true) }} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] text-red-600 hover:bg-red-50 transition text-left font-black uppercase tracking-widest"><Trash2 size={16} /> Supprimer</button>
                </div>
            )}
        </div>
        
        {/* MESSAGES SCROLLABLE (Flex-1 dans le cadre) */}
        <div className="flex-1 overflow-y-auto px-4 pt-32 pb-28 scroll-smooth" onClick={() => setShowMenu(false)}>
            <div className="flex flex-col justify-end min-h-full gap-4 max-w-2xl mx-auto">
                <AnimatePresence>
                    {activeConv?.messages.map((msg, i) => { 
                        const isMe = msg.sender_id === currentUser?.id; 
                        const isImg = msg.content.includes('messages_images');
                        return (
                            <motion.div key={msg.id || i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && (
                                  <div className="w-8 h-8 rounded-xl bg-white overflow-hidden relative shrink-0 mb-1 border border-white shadow-sm">
                                    {msg.sender_avatar ? (
                                      <Image src={getOptimizedImage(msg.sender_avatar, 80) || '/placeholder.jpg'} alt="" fill className="object-cover" />
                                    ) : (
                                      <User size={14} className="m-auto text-gray-200 pt-2" />
                                    )}
                                  </div>
                                )}
                                <div className={`max-w-[82%] relative overflow-hidden ${isMe ? 'bg-brand text-white rounded-[1.8rem] rounded-tr-none shadow-xl shadow-brand/10' : 'bg-white text-gray-800 rounded-[1.8rem] rounded-tl-none border border-white shadow-sm'}`}>
                                    {isImg ? (
                                      <div className="cursor-pointer bg-gray-50" onClick={() => setPreviewImage(msg.content)}>
                                        <Image src={getOptimizedImage(msg.content, 400) || '/placeholder.jpg'} alt="Photo" width={300} height={300} className="object-cover w-60 h-60" />
                                      </div>
                                    ) : (
                                      <div className="px-5 py-3.5 text-[14px] font-bold leading-relaxed tracking-tight">{msg.content}</div>
                                    )}
                                    <div className={`flex items-center justify-end gap-1.5 pb-2 pr-4 text-[8px] font-black uppercase tracking-tighter ${isImg ? 'absolute bottom-0 right-0 w-full bg-black/30 p-2 text-white' : (isMe ? 'text-white/60' : 'text-gray-300')}`}>
                                        <span>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        {isMe && (msg.pending ? <Loader2 size={8} className="animate-spin" /> : (msg.is_read ? <Check size={10} strokeWidth={4} /> : <Check size={10} strokeWidth={4} className="opacity-40" />))}
                                    </div>
                                </div>
                            </motion.div>
                        ) 
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>
        </div>

        {/* INPUT ZONE (Absolute dans le cadre) */}
        <div className="absolute bottom-0 left-0 w-full px-4 pb-safe z-150 bg-linear-to-t from-[#F8FAFC] to-transparent pt-4">
            <div className="flex items-end gap-3 bg-white p-3 rounded-[2.5rem] shadow-2xl shadow-black/10 border border-white mb-4">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-4 text-gray-300 bg-gray-50 rounded-2xl active:scale-90 transition hover:bg-gray-100" disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                </button>
                <textarea ref={inputRef} className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[14px] font-bold max-h-32 min-h-13 py-4 px-2 resize-none placeholder:text-gray-300" placeholder="Votre message..." rows={1} value={replyContent} onChange={e => setReplyContent(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button onClick={handleSend} disabled={!replyContent.trim()} className="bg-brand text-white p-4 rounded-2xl shadow-xl shadow-brand/20 active:scale-90 transition disabled:opacity-20"><Send size={20} /></button>
            </div>
        </div>

        {/* ZOOM IMAGE */}
        {previewImage && (
            <div className="fixed inset-0 z-500 bg-black animate-in fade-in duration-300 flex justify-center">
                <div className="w-full max-w-120 h-full relative">
                    <button onClick={() => setPreviewImage(null)} className="absolute top-12 right-6 text-white p-3 bg-white/10 backdrop-blur-md rounded-2xl z-510 active:scale-90"><X size={24} /></button>
                    <TransformWrapper centerOnInit={true}><TransformComponent wrapperStyle={{ width: "100%", height: "100vh" }}><img src={previewImage} alt="" className="max-h-screen max-w-full object-contain" /></TransformComponent></TransformWrapper>
                </div>
            </div>
        )}

        {/* MODALE SUPPRESSION */}
        {showDeleteModal && (
            <div className="fixed inset-0 z-500 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowDeleteModal(false)}>
                <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center" onClick={e => e.stopPropagation()}>
                    <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"><AlertTriangle size={32} className="text-red-500" /></div>
                    <h3 className="font-black text-xl mb-2 uppercase tracking-tight">Supprimer ?</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-8 leading-relaxed">Cette conversation sera effacée pour vous.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleDeleteConversation} className="w-full py-4 rounded-2xl font-black text-white bg-red-600 shadow-xl shadow-red-500/20 text-[10px] uppercase tracking-widest active:scale-95 transition">Confirmer</button>
                        <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 rounded-2xl font-black text-gray-400 bg-gray-50 text-[10px] uppercase tracking-widest active:scale-95 transition">Annuler</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}