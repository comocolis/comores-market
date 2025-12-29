'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

export default function NotificationBell() {
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log("🚀 [DEBUG] NotificationBell est monté sur l'écran !")

    const channel = supabase
      .channel('test-global')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        (payload) => {
          console.log("🔥 SIGNAL REÇU EN DIRECT !", payload)
          setUnreadCount(prev => prev + 1)
          toast.success("Signal détecté !")
        }
      )
      .subscribe((status) => {
        console.log("📡 Statut Realtime :", status)
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!mounted) return null

  return (
    <div className="relative p-2 bg-gray-100 rounded-full">
      <Bell size={22} className={unreadCount > 0 ? "text-red-500" : "text-gray-600"} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 rounded-full font-bold">
          {unreadCount}
        </span>
      )}
    </div>
  )
}