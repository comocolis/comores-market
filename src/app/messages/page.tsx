'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MessageCircle, User, Loader2, Plus, ArrowLeft, Send, 
  ShoppingBag, Check, CheckCheck, MoreVertical, Phone, Trash2, ExternalLink, AlertTriangle,
  Camera, X, ZoomIn, ZoomOut, ShieldCheck 
} from 'lucide-react'
import { toast } from 'sonner'
import { sendNewMessageEmail } from '@/app/actions/email'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type Message = { id: string, content: string, sender_id: string, created_at: string, is_read: boolean, pending?: boolean, sender_avatar?: string | null }
type Conversation = { id: string, productId: string, productTitle: string, productImage: string | null, productPhone: string | null, counterpartId: string, counterpartName: string, counterpartAvatar: string | null, counterpartIsPro: boolean, lastMessage: string, lastDate: string, unreadCount: number, messages: Message[] }

const textToDigits = (text: string) => {
    const map: { [key: string]: string } = { 'zero': '0', 'un': '1', 'deux': '2', 'trois': '3', 'quatre': '4', 'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9', 'vingt': '20', 'trente': '30' }
    return text.toLowerCase().split(/[\s,.-]+/).map(word => map[word] || word).join('').replace(/[^0-9]/g, "")
}
const containsPhoneNumber = (cleanText: string) => /\d{7,}/.test(cleanText);

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand" /></div>}>
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
  const activeConvRef = useRef<Conversation | null>(null)

  useEffect(() => { activeConvRef.current = activeConv }, [activeConv])

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
                        setActiveConv(stubConv)
                        setView('chat')
                    }
                } catch (e) { console.error(e) }
            }
        } else {
            setView('list')
            setActiveConv(null)
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
      
      const channel = supabase.channel('chat-room').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
            fetchAndGroupMessages(user.id)
        }).subscribe()
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
          const { data: messagesWithImages } = await supabase.from('messages').select('content').eq('product_id', activeConv.productId).or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeConv.counterpartId}),and(sender_id.eq.${activeConv.counterpartId},receiver_id.eq.${currentUser.id})`).filter('content', 'ilike', '%messages_images%');
          if (messagesWithImages && messagesWithImages.length > 0) {
              const pathsToDelete = messagesWithImages.map(msg => msg.content.split('messages_images/')[1]).filter(Boolean);
              if (pathsToDelete.length > 0) await supabase.storage.from('messages_images').remove(pathsToDelete);
          }
          const deleteSent = supabase.from('messages').delete().match({ product_id: activeConv.productId, sender_id: currentUser.id, receiver_id: activeConv.counterpartId });
          const deleteReceived = supabase.from('messages').delete().match({ product_id: activeConv.productId, sender_id: activeConv.counterpartId, receiver_id: currentUser.id });
          await Promise.all([deleteSent, deleteReceived]);
          setConversations(prev => prev.filter(c => c.id !== activeConv.id));
          toast.success("Discussion supprimée");
          setShowDeleteModal(false);
          closeConversation();
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
        sendNewMessageEmail(activeConv!.counterpartId, currentUser.user_metadata?.full_name, "📷 Photo", activeConv!.productId)
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

  if (view === 'list') {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
            <div className="bg-brand pt-12 px-6 pb-4 sticky top-0 z-30 shadow-md"><h1 className="text-white font-extrabold text-2xl">Discussions</h1></div>
            <div className="px-4 py-4 space-y-3">
                {loading ? (<div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand" /></div>) : conversations.length === 0 ? (<div className="text-center text-gray-400 pt-20 flex flex-col items-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><MessageCircle size={32} className="opacity-30" /></div><p>Aucune discussion.</p></div>) : (conversations.map(conv => (<div key={conv.id} onClick={() => openConversation(conv)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center active:scale-[0.98] transition cursor-pointer hover:shadow-md"><div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0 relative overflow-hidden border border-gray-100">{conv.productImage ? (<Image src={conv.productImage} alt="" fill className="object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag size={20} /></div>)}</div><div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h3 className={`text-sm truncate flex items-center gap-1 ${conv.unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>{conv.counterpartName} {conv.counterpartIsPro && <ShieldCheck size={12} className="text-brand" />}</h3><span className={`text-[10px] ${conv.unreadCount > 0 ? 'text-brand font-bold' : 'text-gray-400'}`}>{new Date(conv.lastDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span></div><div className="flex justify-between items-center"><div className="flex flex-col min-w-0 pr-2"><p className="text-[10px] text-brand font-bold uppercase truncate mb-0.5">{conv.productTitle}</p><p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{conv.lastMessage}</p></div>{conv.unreadCount > 0 && (<div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0">{conv.unreadCount}</div>)}</div></div></div>)))}
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-dvh bg-white font-sans text-gray-900 overflow-hidden">
        
        {/* --- HEADER CHAT (FIXE) --- */}
        <div className="bg-brand px-4 pb-3 pt-safe shadow-md flex items-center gap-3 z-40 text-white min-h-[75px] shrink-0">
            <button onClick={closeConversation} className="p-2 -ml-2 text-white/80 active:scale-90 transition"><ArrowLeft size={22} /></button>
            <Link href={`/profil/${activeConv?.counterpartId}`} className="flex flex-1 items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden relative border border-white/20 shrink-0">
                    {activeConv?.counterpartAvatar ? (<Image src={activeConv.counterpartAvatar} alt="" fill className="object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-white"><User size={20} /></div>)}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold truncate text-sm flex items-center gap-1">{activeConv?.counterpartName} {activeConv?.counterpartIsPro && <ShieldCheck size={12} className="text-white" />}</h2>
                    <div className="flex items-center gap-1.5 opacity-90"><p className="text-[11px] font-medium truncate">{activeConv?.productTitle}</p></div>
                </div>
            </Link>
            <div className="flex gap-1">
                {activeConv?.counterpartIsPro && (<button onClick={handleCall} className="p-2 text-white/80 active:scale-90 transition"><Phone size={20} /></button>)}
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-white/80 active:scale-90 transition"><MoreVertical size={20} /></button>
                {showMenu && (
                    <div className="absolute top-14 right-4 bg-white shadow-2xl rounded-2xl border border-gray-100 w-52 py-2 z-50 animate-in fade-in zoom-in-95">
                        <Link href={`/annonce/${activeConv?.productId}`} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"><ExternalLink size={18} className="text-gray-400"/> Voir l'annonce</Link>
                        <button onClick={() => { setShowMenu(false); setShowDeleteModal(true) }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition text-left font-semibold"><Trash2 size={18} /> Supprimer la discussion</button>
                    </div>
                )}
            </div>
        </div>
        
        {/* --- ZONE MESSAGES --- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50" onClick={() => setShowMenu(false)}>
            <div className="flex flex-col justify-end min-h-full gap-2 pb-24">
                {activeConv?.messages.map((msg, i) => { 
                    const isMe = msg.sender_id === currentUser?.id; 
                    const isImg = msg.content.includes('messages_images');
                    return (
                        <div key={msg.id || i} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                            {!isMe && (<div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative shrink-0 mb-1 shadow-sm border border-white">{msg.sender_avatar ? (<Image src={msg.sender_avatar} alt="" fill className="object-cover" />) : (<User size={14} className="m-auto text-gray-400" />)}</div>)}
                            <div className={`max-w-[80%] shadow-sm relative overflow-hidden ${isMe ? 'bg-brand text-white rounded-2xl rounded-tr-sm' : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'}`}>
                                {isImg ? (<div className="cursor-pointer bg-gray-100" onClick={() => setPreviewImage(msg.content)}><Image src={msg.content} alt="Photo" width={300} height={300} className="object-cover w-64 h-64" /></div>) : (<div className="px-4 py-3 text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</div>)}
                                <div className={`flex items-center justify-end gap-1 pb-1.5 pr-2 text-[9px] ${isImg ? 'absolute bottom-0 right-0 w-full bg-black/40 p-1 text-white' : (isMe ? 'text-white/70' : 'text-gray-400')}`}>
                                    <span>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {isMe && (msg.pending ? <Loader2 size={10} className="animate-spin" /> : (msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />))}
                                </div>
                            </div>
                        </div>
                    ) 
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>

        {/* --- BARRE D'ENVOI (LUXE & SANS RECTANGLE NOIR) --- */}
        <div className="bg-white px-3 py-3 pb-safe z-[100] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
            <div className="max-w-md mx-auto flex items-end gap-3 bg-gray-100/80 p-2 rounded-[2rem] transition-all">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-brand bg-white rounded-full shadow-sm active:scale-90 transition" disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                </button>

                {/* SUPPRESSION DU BORD NOIR ICI : outline-none et ring-0 */}
                <textarea 
                    ref={inputRef} 
                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[15px] max-h-32 min-h-[44px] py-2.5 px-2 resize-none placeholder:text-gray-400" 
                    placeholder="Écrivez votre message..." 
                    rows={1} 
                    value={replyContent} 
                    onChange={e => setReplyContent(e.target.value)} 
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                />
                
                <button 
                    onClick={handleSend} 
                    disabled={!replyContent.trim()} 
                    className="bg-brand text-white p-3 rounded-full shadow-lg shadow-brand/20 active:scale-90 disabled:opacity-30 transition"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>

        {/* MODALES ET LIGHTBOX (Sommet du DOM) */}
        {previewImage && (
            <div className="fixed inset-0 z-[200] bg-black animate-in fade-in duration-300">
                <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 text-white p-3 bg-white/10 backdrop-blur-md rounded-full z-50"><X size={24} /></button>
                <TransformWrapper centerOnInit={true}><TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }}><img src={previewImage} alt="" className="max-h-screen max-w-full object-contain" /></TransformComponent></TransformWrapper>
            </div>
        )}

        {showDeleteModal && (
            <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowDeleteModal(false)}>
                <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
                    <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={40} className="text-red-500" /></div>
                    <h3 className="font-bold text-xl mb-2 text-gray-900">Supprimer la discussion ?</h3>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">Cette action effacera tous vos messages et photos partagées dans ce chat.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleDeleteConversation} className="w-full py-4 rounded-2xl font-bold text-white bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition">Oui, supprimer</button>
                        <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 active:scale-95 transition">Annuler</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}