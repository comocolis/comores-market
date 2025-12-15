'use client'

import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Search, MessageCircle, User, Plus } from 'lucide-react'

export default function BottomNav() {
  const supabase = createClient()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  // DÉTECTION INTELLIGENTE : Est-on dans une conversation active ?
  // Si on est sur /messages ET qu'il y a un ?id=... dans l'URL, c'est qu'on chatte.
  const isChatOpen = pathname === '/messages' && searchParams.get('id');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        updateUnreadCount(user.id)
      }
    }
    init()
  }, [])

  const updateUnreadCount = async (uid: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', uid)
      .eq('is_read', false)
    
    setUnreadCount(count || 0)
  }

  useEffect(() => {
    if (!userId) return
    const channel = supabase.channel('nav-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, 
      () => updateUnreadCount(userId))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // 🚀 SI LE CHAT EST OUVERT, ON CACHE LA BARRE DE NAVIGATION
  if (isChatOpen) return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2">
        <NavBtn href="/" icon={Home} label="Accueil" active={pathname === '/'} />
        
        {/* LIEN CORRECT VERS LA PAGE RECHERCHE */}
        <NavBtn href="/recherche" icon={Search} label="Recherche" active={pathname === '/recherche'} />
        
        <div className="flex justify-center relative -top-6">
          <Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 border-4 border-white hover:scale-105 transition transform active:scale-95">
            <Plus strokeWidth={3} size={28} />
          </Link>
        </div>

        <Link href="/messages" className={`flex flex-col items-center justify-center gap-1 h-full w-full transition relative ${pathname === '/messages' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className="relative">
                <MessageCircle size={24} strokeWidth={pathname === '/messages' ? 2.5 : 2} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>
            <span className="text-[9px] font-bold">Messages</span>
        </Link>

        <NavBtn href="/compte" icon={User} label="Compte" active={pathname === '/compte' || pathname === '/admin'} />
      </div>
    </nav>
  )
}

function NavBtn({ href, icon: Icon, label, active }: any) {
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-1 h-full w-full transition ${active ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[9px] font-bold">{label}</span>
    </Link>
  )
}