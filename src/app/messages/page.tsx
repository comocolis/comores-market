'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MessageCircle, User, Loader2, Plus, ArrowLeft, Send, 
  ShoppingBag, Check, CheckCheck, MoreVertical, Phone, Trash2, ExternalLink, AlertTriangle,
  Camera, X, ZoomIn, ZoomOut, ShieldCheck, Search, CheckCircle2, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { sendNewMessageEmail } from '@/app/actions/email'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { motion, AnimatePresence } from 'framer-motion'

type Message = { id: string, content: string, sender_id: string, created_at: string, is_read: boolean, pending?: boolean, sender_avatar?: string | null }
type Conversation = { id: string, productId: string, productTitle: string, productImage: string | null, productPhone: string | null, counterpartId: string, counterpartName: string, counterpartAvatar: string | null, counterpartIsPro: boolean, lastMessage: string, lastDate: string, unreadCount: number, messages: Message[] }

const textToDigits = (text: string) => {
    const map: { [key: string]: string } = { 'zero': '0', 'un': '1', 'deux': '2', 'trois': '3', 'quatre': '4', 'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9', 'vingt': '20', 'trente': '30' }
    return text.toLowerCase().split(/[\s,.-]+/).map(word => map[word] || word).join('').replace(/[^0-9]/g, "")
}
const containsPhoneNumber = (cleanText: string) => /\d{7,}/.test(cleanText);

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20 bg-[#F0F2F5] h-screen"><Loader2 className="animate-spin text-brand" /></div>}>
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

  useEffect(() => {
    const handleParams = async () => {
        const convId = searchParams.get('id')
        const targetUserId = searchParams.get('user')
        const targetProductId = searchParams.get('product')

        if (convId && conversations.length > 0) {
            const found = conversations.find(c => c.id === convId)
            if (found) {
                setActiveConv(found)
                setView('chat')
                if (found.unreadCount > 0) markAsRead(found)
                return
            }
        } 
        
        if (targetUserId && targetProductId) {
            const compositeKey = `${targetProductId}-${targetUserId}`
            const existing = conversations.find(c => c.id === compositeKey)
            
            if (existing) {
                setActiveConv(existing)
                setView('chat')
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
  }, [searchParams, conversations])

  const fetchAndGroupMessages = async (userId: string) => {
    const { data, error } = await supabase.from('messages').select(`*, sender:profiles!sender_id(full_name, avatar_url, is_pro), receiver:profiles!receiver_id(full_name, avatar_url, is_pro), product:products(title, images, whatsapp_number)`).or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: true })
    if (error || !data) { setLoading(false); return }
    const groups: { [key: string]: Conversation } = {}
    data.forEach((msg: any) => {
        const isMe = msg.sender_id === userId
        const otherId = isMe ? msg.receiver_id : msg.sender_id
        const otherProfile = isMe ? msg.receiver : msg.sender
        const key = `${msg.product_id}-${otherId}`
        let img = null; try { if (msg.product?.images) { const parsed = JSON.parse(msg.product.images); if (Array.isArray(parsed) && parsed.length > 0) img = parsed[0] } } catch {}
        if (!groups[key]) groups[key] = { id: key, productId: msg.product_id, productTitle: msg.product?.title || 'Produit', productImage: img, productPhone: msg.product?.whatsapp_number || null, counterpartId: otherId, counterpartName: otherProfile?.full_name || 'Utilisateur', counterpartAvatar: otherProfile?.avatar_url, counterpartIsPro: otherProfile?.is_pro || false, lastMessage: '', lastDate: '', unreadCount: 0, messages: [] }
        groups[key].messages.push({ ...msg, sender_avatar: msg.sender?.avatar_url })
        groups[key].lastMessage = msg.content.includes('messages_images') ? '📷 Photo' : msg.content
        groups[key].lastDate = msg.created_at
        if (!isMe && !msg.is_read) groups[key].unreadCount++
    })
    setConversations(Object.values(groups).sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()))
    setLoading(false)
  }

  const markAsRead = async (conv: Conversation) => {
    if (!currentUser) return
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    await supabase.from('messages').update({ is_read: true }).eq('product_id', conv.productId).eq('sender_id', conv.counterpartId).eq('receiver_id', currentUser.id).eq('is_read', false)
  }

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
  }, [router, supabase])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeConv?.messages, view])

  const openConversation = (conv: Conversation) => { router.push(`/messages?id=${conv.id}`) }
  const closeConversation = () => { router.push(`/messages`) }

  const handleCall = () => { if (!activeConv?.productPhone) { toast.error("Aucun numéro."); return }; window.open(`tel:${activeConv.productPhone.replace(/\D/g, '')}`, '_self') }

  const handleDeleteConversation = async () => { 
      if (!activeConv || !currentUser) return; 
      try {
          const { data: imgMsgs } = await supabase.from('messages').select('content').eq('product_id', activeConv.productId).or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeConv.counterpartId}),and(sender_id.eq.${activeConv.counterpartId},receiver_id.eq.${currentUser.id})`).filter('content', 'ilike', '%messages_images%');
          if (imgMsgs && imgMsgs.length > 0) {
              const paths = imgMsgs.map(m => m.content.split('messages_images/')[1]).filter(Boolean);
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
        <div className="min-h-screen bg-[#F0F2F5] pb-24 font-sans text-gray-900 overflow-x-hidden">
            {/* Header Uniformisé Accueil */}
            <div className="bg-brand pt-safe px-4 pb-8 sticky top-0 z-30 shadow-md rounded-b-[2.5rem]">
                <div className="flex justify-between items-center mb-5 pt-2 px-2">
                    <div>
                        <h1 className="text-white font-black text-2xl tracking-tight">Discussions</h1>
                        <div className="flex items-center gap-1.5 opacity-60">
                            <Sparkles size={10} className="text-brand" fill="currentColor" />
                            <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Messagerie Privée</p>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                        <MessageCircle size={14} className="text-white" />
                        <span className="text-xs font-black text-white">{conversations.filter(c => c.unreadCount > 0).length}</span>
                    </div>
                </div>
                <div className="relative group px-2">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                        <Search size={18} strokeWidth={2.5} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Rechercher une discussion..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-[#F5F7F9] border-none rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 font-bold placeholder:text-gray-400 focus:ring-4 focus:ring-brand/5 focus:bg-white transition-all shadow-sm" 
                    />
                </div>
            </div>

            <div className="px-5 py-6 space-y-4 max-w-lg mx-auto">
                {loading ? (<div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand" size={32} /></div>) : filteredConvs.length === 0 ? (
                    <div className="text-center text-gray-300 pt-20 flex flex-col items-center">
                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm"><MessageCircle size={40} className="opacity-10" /></div>
                        <p className="font-black text-[10px] uppercase tracking-widest">Aucune discussion active</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredConvs.map((conv, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} onClick={() => openConversation(conv)} 
                            className="bg-white p-4 rounded-[2rem] shadow-sm border border-white flex gap-4 items-center active:scale-[0.98] transition cursor-pointer hover:shadow-xl hover:shadow-black/5 group">
                                <div className="w-16 h-16 bg-gray-50 rounded-[1.4rem] shrink-0 relative overflow-hidden shadow-inner group-hover:scale-95 transition-transform duration-500">
                                    {conv.productImage ? (<Image src={conv.productImage} alt="" fill className="object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag size={24} /></div>)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className={`text-[15px] truncate flex items-center gap-1.5 ${conv.unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>{conv.counterpartName} {conv.counterpartIsPro && <CheckCircle2 size={14} className="text-brand" />}</h3>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${conv.unreadCount > 0 ? 'text-brand' : 'text-gray-300'}`}>{new Date(conv.lastDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <p className="text-[10px] text-brand font-black uppercase tracking-[0.15em] truncate mb-0.5 opacity-60">{conv.productTitle}</p>
                                            <p className={`text-[13px] truncate leading-tight ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                                        </div>
                                        {conv.unreadCount > 0 && (<div className="w-6 h-6 bg-brand rounded-xl flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-brand/20 shrink-0 mb-1">{conv.unreadCount}</div>)}
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

  // --- VUE CHAT ---
  return (
    <div className="fixed inset-0 bg-[#F0F2F5] font-sans text-gray-900 overflow-hidden flex flex-col h-screen">
        {/* Header Uniformisé avec l'Accueil & Liste */}
        <div className="fixed top-0 left-0 w-full bg-brand px-4 pb-8 pt-safe shadow-md z-[150] rounded-b-[2.5rem]">
            <div className="flex items-center gap-3 pt-2">
                <button onClick={closeConversation} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white border border-white/10 active:scale-90 transition">
                    <ArrowLeft size={22} />
                </button>
                <Link href={`/profil/${activeConv?.counterpartId}`} className="flex flex-1 items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 overflow-hidden relative border border-white/10 shrink-0 shadow-inner">
                        {activeConv?.counterpartAvatar ? (<Image src={activeConv.counterpartAvatar} alt="" fill className="object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-white/50"><User size={22} /></div>)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-black truncate text-[15px] text-white tracking-tight flex items-center gap-1.5">{activeConv?.counterpartName} {activeConv?.counterpartIsPro && <CheckCircle2 size={14} className="text-brand fill-white" />}</h2>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest truncate">{activeConv?.productTitle}</p>
                    </div>
                </Link>
                <div className="flex gap-2">
                    {activeConv?.productPhone && (<button onClick={handleCall} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white border border-white/10 active:scale-90 transition"><Phone size={20} /></button>)}
                    <button onClick={() => setShowMenu(!showMenu)} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white border border-white/10 active:scale-90 transition relative"><MoreVertical size={20} /></button>
                </div>
            </div>
            {showMenu && (
                <div className="absolute top-[100%] right-6 mt-2 bg-white shadow-2xl rounded-[1.8rem] border border-gray-100 w-56 py-3 z-[200] animate-in fade-in slide-in-from-top-2">
                    <Link href={`/annonce/${activeConv?.productId}`} className="flex items-center gap-3 px-5 py-4 text-sm text-gray-700 font-bold hover:bg-gray-50 transition"><ExternalLink size={18} className="text-gray-400"/> Voir l'annonce</Link>
                    <button onClick={() => { setShowMenu(false); setShowDeleteModal(true) }} className="w-full flex items-center gap-3 px-5 py-4 text-sm text-red-600 hover:bg-red-50 transition text-left font-black uppercase tracking-tighter"><Trash2 size={18} /> Supprimer</button>
                </div>
            )}
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pt-[110px] pb-[110px]" onClick={() => setShowMenu(false)}>
            <div className="flex flex-col justify-end min-h-full gap-3 pb-4 max-w-2xl mx-auto">
                <AnimatePresence>
                    {activeConv?.messages.map((msg, i) => { 
                        const isMe = msg.sender_id === currentUser?.id; 
                        const isImg = msg.content.includes('messages_images');
                        return (
                            <motion.div key={msg.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && (<div className="w-8 h-8 rounded-xl bg-white overflow-hidden relative shrink-0 mb-1 shadow-sm border border-white">{msg.sender_avatar ? (<Image src={msg.sender_avatar} alt="" fill className="object-cover" />) : (<User size={14} className="m-auto text-gray-300" />)}</div>)}
                                <div className={`max-w-[80%] shadow-sm relative overflow-hidden ${isMe ? 'bg-brand text-white rounded-3xl rounded-tr-sm' : 'bg-white text-gray-800 rounded-3xl rounded-tl-sm border border-white'}`}>
                                    {isImg ? (<div className="cursor-pointer bg-gray-50" onClick={() => setPreviewImage(msg.content)}><Image src={msg.content} alt="Photo" width={300} height={300} className="object-cover w-64 h-64" /></div>) : (<div className="px-5 py-3.5 text-[15px] font-medium whitespace-pre-wrap leading-relaxed tracking-tight">{msg.content}</div>)}
                                    <div className={`flex items-center justify-end gap-1.5 pb-2 pr-3 text-[9px] font-black uppercase tracking-tighter ${isImg ? 'absolute bottom-0 right-0 w-full bg-black/40 p-2 text-white' : (isMe ? 'text-white/70' : 'text-gray-300')}`}>
                                        <span>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        {isMe && (msg.pending ? <Loader2 size={10} className="animate-spin" /> : (msg.is_read ? <CheckCircle2 size={12} strokeWidth={3} /> : <Check size={12} strokeWidth={3} />))}
                                    </div>
                                </div>
                            </motion.div>
                        ) 
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-transparent px-4 pb-safe z-[150]">
            <div className="max-w-2xl mx-auto flex items-end gap-3 bg-white p-3 rounded-[2.5rem] shadow-2xl shadow-black/10 border border-white mb-4">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-3.5 text-gray-400 hover:text-brand bg-[#F5F7F9] rounded-2xl active:scale-90 transition" disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                </button>
                <textarea ref={inputRef} className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[15px] font-medium max-h-32 min-h-[48px] py-3 px-2 resize-none placeholder:text-gray-300" placeholder="Écrivez un message..." rows={1} value={replyContent} onChange={e => setReplyContent(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button onClick={handleSend} disabled={!replyContent.trim()} className="bg-brand text-white p-3.5 rounded-2xl shadow-xl shadow-brand/20 active:scale-90 transition disabled:opacity-30"><Send size={20} /></button>
            </div>
        </div>

        {/* --- ZOOM IMAGE --- */}
        {previewImage && (
            <div className="fixed inset-0 z-[500] bg-black animate-in fade-in duration-300">
                <button onClick={() => setPreviewImage(null)} className="absolute top-12 right-6 text-white p-3 bg-white/10 backdrop-blur-md rounded-full z-[510]"><X size={24} /></button>
                <TransformWrapper centerOnInit={true}><TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }}><img src={previewImage} alt="" className="max-h-screen max-w-full object-contain" /></TransformComponent></TransformWrapper>
            </div>
        )}

        {/* --- MODALE SUPPRESSION PRESTIGE --- */}
        {showDeleteModal && (
            <div className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowDeleteModal(false)}>
                <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center border border-white" onClick={e => e.stopPropagation()}>
                    <div className="bg-red-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertTriangle size={48} className="text-red-500" /></div>
                    <h3 className="font-black text-2xl mb-3 text-gray-900 tracking-tight">Supprimer ?</h3>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">Cette action effacera toute trace de cette discussion pour vous.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleDeleteConversation} className="w-full py-5 rounded-2xl font-black text-white bg-red-600 active:scale-95 transition shadow-xl shadow-red-500/20 uppercase text-xs tracking-widest">Confirmer</button>
                        <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 rounded-2xl font-black text-gray-400 bg-[#F5F7F9] active:scale-95 transition uppercase text-xs tracking-widest">Annuler</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}