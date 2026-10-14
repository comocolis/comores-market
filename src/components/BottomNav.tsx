'use client'

import { getSupabase, hasSessionCookie } from '@/utils/supabase/lazy'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Home, Heart, MessageCircle, User, Plus, Bell, LucideIcon } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const pathnameRef = useRef(pathname)

  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0) 
  const [userId, setUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const isChatOpen = pathname === '/messages' && (searchParams.get('id') || searchParams.get('user'))
  const isAuthPage = pathname === '/auth'

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    setMounted(true)
    if (!hasSessionCookie()) return

    let cancelled = false
    const getUser = async () => {
      const supabase = await getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && !cancelled) {
        setUserId(user.id)
        refreshCounts(user.id)
      }
    }
    getUser()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (userId && !isChatOpen) {
        refreshCounts(userId)
    }
  }, [pathname, searchParams, isChatOpen, userId])

  const refreshCounts = async (uid: string) => {
    const supabase = await getSupabase()
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', uid)
      .eq('is_read', false)
    
    setUnreadCount(msgCount || 0)

    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('is_read', false)
    
    setUnreadNotifCount(notifCount || 0)
  }

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    let client: Awaited<ReturnType<typeof getSupabase>> | null = null
    let channel: ReturnType<Awaited<ReturnType<typeof getSupabase>>['channel']> | null = null

    getSupabase().then((supabase) => {
      if (cancelled) return
      client = supabase
      channel = supabase.channel('bottom-nav-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
          (payload: any) => {
              setTimeout(() => refreshCounts(userId), 500)
              if (payload.eventType === 'INSERT' && !pathnameRef.current?.includes('/messages')) {
                  import('sonner').then(({ toast }) => toast.message('Nouveau message !', {
                      description: payload.new.content ? payload.new.content.substring(0, 40) + '...' : 'Message reçu',
                      action: { label: 'Voir', onClick: () => router.push('/messages') },
                  }))
              }
          }
        )
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
          (payload: any) => {
              setTimeout(() => refreshCounts(userId), 500)
              if (payload.eventType === 'INSERT') {
                  import('sonner').then(({ toast }) => toast.info(payload.new.title, {
                      description: payload.new.message,
                      icon: <Bell size={16} className="text-amber-500" />,
                      action: { label: 'Voir', onClick: () => router.push('/compte/notifications') },
                  }))
              }
          }
        )
        .subscribe()
    })

    return () => { 
        cancelled = true
        if (client && channel) client.removeChannel(channel)
    }
  }, [userId])

  if (!mounted || isChatOpen || isAuthPage) return null

  const favoritesHref = userId ? '/favoris' : '/auth'
  const publishHref = userId ? '/publier' : '/auth'
  const messagesHref = userId ? '/messages' : '/auth'
  const accountHref = userId ? '/compte' : '/auth'
  const prefetchAuthTargets = userId ? undefined : false

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] transition-colors duration-200">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2 relative text-gray-900 dark:text-slate-100">
        <NavBtn href="/" icon={Home} label="Accueil" active={pathname === '/'} />
        <NavBtn href={favoritesHref} icon={Heart} label="Favoris" active={pathname === '/favoris'} prefetch={prefetchAuthTargets} />
        
        <div className="flex justify-center relative -top-5">
          <Link href={publishHref} prefetch={prefetchAuthTargets} aria-label="Publier une annonce" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 border-4 border-white dark:border-slate-900 hover:scale-105 transition transform active:scale-95">
            <Plus strokeWidth={3} size={28} />
          </Link>
        </div>

        {/* MESSAGES */}
        <Link href={messagesHref} prefetch={prefetchAuthTargets} className={`flex flex-col items-center justify-center gap-1 h-full w-full transition relative ${pathname === '/messages' ? 'text-brand font-semibold' : 'text-gray-600 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
            <div className="relative">
                <MessageCircle size={24} strokeWidth={pathname === '/messages' ? 2.5 : 2} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in border border-white dark:border-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>
            <span className="text-[9px] font-bold">Messages</span>
        </Link>

        {/* COMPTE */}
        <Link href={accountHref} prefetch={prefetchAuthTargets} className={`flex flex-col items-center justify-center gap-1 h-full w-full transition relative ${pathname.includes('/compte') ? 'text-brand font-semibold' : 'text-gray-600 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
            <div className="relative">
                <User size={24} strokeWidth={pathname.includes('/compte') ? 2.5 : 2} className={pathname.includes('/compte') ? "fill-brand text-brand" : ""} />
                {unreadNotifCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in border border-white dark:border-slate-900">
                        {unreadNotifCount}
                    </span>
                )}
            </div>
            <span className="text-[9px] font-bold">Compte</span>
        </Link>
      </div>
    </nav>
  )
}

interface NavBtnProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  prefetch?: boolean;
}

function NavBtn({ href, icon: Icon, label, active, prefetch }: NavBtnProps) {
  return (
    <Link href={href} prefetch={prefetch} className={`flex flex-col items-center justify-center gap-1 h-full w-full transition ${active ? 'text-brand font-semibold' : 'text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'}`}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} className={active ? "fill-brand text-brand" : ""} />
        <span className="text-[9px] font-bold">{label}</span>
    </Link>
  )
}
