'use client'

import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Heart, MessageCircle, User, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function BottomNav() {
  const supabase = createClient()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  const isChatOpen = pathname === '/messages' && searchParams.get('id')
  const isAuthPage = pathname === '/auth'

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        fetchUnreadCount(user.id)
      }
    }
    init()
  }, [])

  const fetchUnreadCount = async (uid: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', uid)
      .eq('is_read', false)
    
    setUnreadCount(count || 0)
  }

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('nav-notifications')
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `receiver_id=eq.${userId}` 
        }, 
        (payload) => {
            fetchUnreadCount(userId)
            
            // Ne pas afficher de toast si on est déjà sur la page des messages
            if (!window.location.pathname.includes('/messages')) {
                const content = payload.new.content || ''
                
                // CORRECTION ICI : Si c'est une image, on affiche un texte propre
                const displayText = (content.includes('messages_images') && content.startsWith('http'))
                    ? '📷 Photo reçue'
                    : content

                toast.message('Nouveau message !', {
                    description: displayText,
                    action: { label: 'Voir', onClick: () => router.push('/messages') },
                    duration: 4000,
                })
            }
        }
      )
      .subscribe()

    const channelUpdate = supabase.channel('nav-badges-update')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, () => fetchUnreadCount(userId))
        .subscribe()

    return () => { 
        supabase.removeChannel(channel) 
        supabase.removeChannel(channelUpdate)
    }
  }, [userId, router])

  if (isChatOpen || isAuthPage) return null

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2 relative">
        <NavBtn href="/" icon={Home} label="Accueil" active={pathname === '/'} />
        <NavBtn href="/favoris" icon={Heart} label="Favoris" active={pathname === '/favoris'} />
        
        <div className="flex justify-center relative -top-5">
          <Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 border-4 border-white hover:scale-105 transition transform active:scale-95">
            <Plus strokeWidth={3} size={28} />
          </Link>
        </div>

        <Link href="/messages" className={`flex flex-col items-center justify-center gap-1 h-full w-full transition relative ${pathname === '/messages' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className="relative">
                <MessageCircle size={24} strokeWidth={pathname === '/messages' ? 2.5 : 2} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in border border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>
            <span className="text-[9px] font-bold">Messages</span>
        </Link>

        <NavBtn href="/compte" icon={User} label="Compte" active={pathname === '/compte' || pathname === '/admin' || pathname === '/mes-annonces'} />
      </div>
    </nav>
  )
}

function NavBtn({ href, icon: Icon, label, active }: any) {
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-1 h-full w-full transition ${active ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} className={active ? "fill-brand text-brand" : ""} />
        <span className="text-[9px] font-bold">{label}</span>
    </Link>
  )
}