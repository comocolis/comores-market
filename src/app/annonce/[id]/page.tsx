'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, MessageCircle, User, ArrowLeft, Share2, Clock, Send, Loader2, Flag, BadgeCheck, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react'

const formatPrice = (amount: number) => new Intl.NumberFormat('fr-KM', { style: 'currency', currency: 'KMF', maximumFractionDigits: 0 }).format(amount)
const timeAgo = (dateString: string) => { const diff = new Date().getTime() - new Date(dateString).getTime(); const days = Math.floor(diff / (1000 * 3600 * 24)); return days === 0 ? "Aujourd'hui" : days === 1 ? "Hier" : `Il y a ${days} jours` }

export default function AnnoncePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [showChatBox, setShowChatBox] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    const getData = async () => {
      const { id } = await params
      const { data } = await supabase.from('products').select('*, profiles(*)').eq('id', id).single()
      const { data: { user } } = await supabase.auth.getUser()
      setProduct(data)
      setCurrentUser(user)
      setLoading(false)
    }
    getData()
  }, [supabase, params])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!currentUser) { alert("Connectez-vous !"); router.push('/publier'); return }
    setSending(true)
    const { error } = await supabase.from('messages').insert({ content: messageText, sender_id: currentUser.id, receiver_id: product.user_id, product_id: product.id })
    if (error) alert(error.message); else { alert("Message envoyé !"); setMessageText(''); setShowChatBox(false); router.push('/messages') }
    setSending(false)
  }

  if (loading || !product) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  let images = []; try { images = JSON.parse(product.images) } catch { images = [product.images] }
  const isPro = product.profiles?.is_pro === true
  const whatsappLink = `https://wa.me/${(product.profiles?.phone_number || product.whatsapp_number || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Intéressé par "${product.title}"`)}`

  return (
    <div className="min-h-screen bg-white font-sans pb-28">
      <div className="relative w-full h-[55vh] group cursor-pointer" onClick={() => images.length > 0 && setIsFullScreen(true)}>
        <div className="absolute top-0 left-0 w-full p-4 pt-safe z-20 flex justify-between items-start" onClick={e => e.stopPropagation()}><Link href="/" className="w-10 h-10 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-sm"><ArrowLeft size={20} /></Link><div className="flex gap-2"><button className="w-10 h-10 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 shadow-sm"><Share2 size={20} /></button></div></div>
        {images.length > 0 ? <Image src={images[currentImageIndex]} alt={product.title} fill className="object-cover" priority /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">Pas d'image</div>}
        {images.length > 1 && <><button onClick={(e) => {e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg z-10"><ChevronLeft size={24} /></button><button onClick={(e) => {e.stopPropagation(); setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg z-10"><ChevronRight size={24} /></button><div className="absolute bottom-6 right-6 bg-black/30 p-2 rounded-full text-white z-10"><Maximize2 size={18} /></div></>}
      </div>
      <div className="relative -mt-12 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-6 shadow-lg min-h-[50vh]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 opacity-60"></div>
        <div className="mb-8"><h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{product.title}</h1><p className="text-4xl font-extrabold text-brand mb-4 tracking-tight">{formatPrice(product.price)}</p><div className="flex items-center gap-4 text-sm text-gray-500"><div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"><MapPin size={16} className="text-brand" /> <span className="font-medium text-gray-700">{product.location_city}</span></div><div className="flex items-center gap-1.5"><Clock size={16} className="text-gray-400" /> <span>{timeAgo(product.created_at)}</span></div></div></div>
        <hr className="border-gray-100 mb-8" />
        <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100/50"><div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-brand font-bold text-xl border-2 border-white shadow-sm relative overflow-hidden">{product.profiles?.avatar_url ? <Image src={product.profiles.avatar_url} alt="Avatar" fill className="object-cover" /> : <User />}</div><div className="flex-1"><p className="font-bold text-gray-900 text-lg">{product.profiles?.full_name || 'Vendeur'}</p>{isPro ? <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 mt-1"><BadgeCheck size={12} /> PRO</span> : <span className="text-xs text-gray-400 mt-1 block">Particulier</span>}</div></div>
        <div className="mb-24"><h3 className="font-bold text-gray-900 mb-2">Description</h3><p className="text-gray-600 leading-relaxed whitespace-pre-line text-[15px]">{product.description || "Aucune description."}</p></div>
      </div>
      {showChatBox && <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"><div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10"><h3 className="font-bold text-lg mb-4 text-gray-900">Envoyer un message</h3><textarea className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none h-32 resize-none text-gray-800" placeholder="Bonjour..." value={messageText} onChange={(e) => setMessageText(e.target.value)} autoFocus /><div className="flex gap-3 mt-4"><button onClick={() => setShowChatBox(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition">Annuler</button><button onClick={handleSendMessage} disabled={sending} className="flex-1 bg-[#06b6d4] text-white font-bold py-3 rounded-xl hover:bg-[#0891b2] transition shadow-md disabled:opacity-50">{sending ? 'Envoi...' : 'Envoyer'}</button></div></div></div>}
      {isFullScreen && images.length > 0 && <div className="fixed inset-0 z-100 bg-black flex items-center justify-center animate-in fade-in duration-200"><button onClick={() => setIsFullScreen(false)} className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/30 transition z-20"><X size={24} /></button><div className="relative w-full h-full max-h-[85vh] p-4"><Image src={images[currentImageIndex]} alt="Plein écran" fill className="object-contain" priority /></div><button onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)} className="absolute left-4 text-white bg-white/10 p-4 rounded-full hover:bg-white/30 transition z-20"><ChevronLeft size={32} /></button><button onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)} className="absolute right-4 text-white bg-white/10 p-4 rounded-full hover:bg-white/30 transition z-20"><ChevronRight size={32} /></button></div>}
      <div className="fixed bottom-6 left-0 w-full px-6 z-40">
        {isPro ? (
            <div className="w-full max-w-md mx-auto flex gap-3"><button onClick={() => setShowChatBox(true)} className="flex-1 flex items-center justify-center gap-2 bg-[#06b6d4] text-white font-bold py-4 rounded-2xl shadow-xl shadow-cyan-500/20 hover:bg-[#0891b2] active:scale-95 transition"><Send size={20} strokeWidth={2.5} /> <span className="text-sm">Message</span></button><a href={whatsappLink} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-[#20bd5a] active:scale-95 transition"><MessageCircle size={20} strokeWidth={2.5} /> <span className="text-sm">WhatsApp</span></a></div>
        ) : (
            <button onClick={() => setShowChatBox(true)} className="w-full max-w-md mx-auto flex items-center justify-center gap-3 bg-[#06b6d4] text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-cyan-500/20 hover:bg-[#0891b2] active:scale-95 transition"><Send size={24} strokeWidth={2.5} /> <span>Envoyer un message</span></button>
        )}
      </div>
    </div>
  )
}