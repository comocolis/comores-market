'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, ChevronLeft, ShieldCheck, Star, Info, 
  CheckCheck, Clock, Trash2, Loader2, MessageCircle 
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from '@/utils/dateUtils'

export default function NotificationsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.error("Erreur chargement:", error)
      toast.error("Erreur lors de la récupération des alertes")
    } else {
      setNotifications(data || [])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadNotifs()
  }, [])

  const handleClick = async (notif: any) => {
    if (notif.is_read && !notif.link) return;

    setNotifications(prev => prev.map(n =>
        n.id === notif.id ? { ...n, is_read: true } : n
    ))

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id)

    if (error) console.error("Erreur lecture:", error)

    if (notif.link) {
        router.push(notif.link)
    }
  }

  const deleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("❌ Échec de suppression en base:", error.message)
      toast.error("Action impossible : " + error.message)
    } else {
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success("Notification supprimée")
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'sentinel': 
        return <div className="bg-amber-100 dark:bg-amber-950/50 p-2.5 rounded-xl text-amber-600 dark:text-amber-400"><ShieldCheck size={20} /></div>
      case 'elite': 
        return <div className="bg-yellow-100 dark:bg-yellow-950/50 p-2.5 rounded-xl text-yellow-600 dark:text-yellow-400"><Star size={20} /></div>
      case 'message': 
        return <div className="bg-blue-100 dark:bg-blue-950/50 p-2.5 rounded-xl text-blue-600 dark:text-blue-400"><MessageCircle size={20} /></div>
      default: 
        return <div className="bg-gray-100 dark:bg-slate-800 p-2.5 rounded-xl text-gray-500 dark:text-slate-400"><Info size={20} /></div>
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-900 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand dark:text-emerald-400" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-900 font-sans pb-24 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      {/* HEADER BAR */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-30 border-b border-gray-50 dark:border-slate-800">
        <button onClick={() => router.back()} aria-label="Retour" className="p-2 -ml-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition active:scale-90">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Notifications</h1>
        <div className="ml-auto p-2 text-brand/30 dark:text-emerald-400/30">
          <CheckCheck size={20} />
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-gray-200 dark:text-slate-600 shadow-inner">
              <Bell size={40} />
            </div>
            <p className="text-sm font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">Aucune alerte</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => handleClick(notif)}
              className={`p-5 rounded-[2.2rem] border transition-all duration-500 flex gap-4 relative animate-in slide-in-from-bottom-3 cursor-pointer active:scale-[0.98] ${
                notif.is_read 
                  ? 'bg-white dark:bg-slate-800/90 border-gray-100 dark:border-slate-700/50 grayscale-[0.5] opacity-80'
                  : 'bg-white dark:bg-slate-800/90 border-amber-100 dark:border-amber-900/50 shadow-xl shadow-amber-900/5 ring-1 ring-amber-50 dark:ring-amber-900/20'
              }`}
            >
              <div className="shrink-0">{getIcon(notif.type)}</div>

              <div className="flex-1 pr-6">
                <h3 className={`text-sm font-black tracking-tight mb-1 ${notif.is_read ? 'text-gray-600 dark:text-slate-300' : 'text-gray-900 dark:text-slate-100'}`}>
                  {notif.title}
                </h3>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 leading-relaxed">
                  {notif.message}
                </p>
                
                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-300 dark:text-slate-500 uppercase tracking-wider mt-3">
                  <Clock size={10} strokeWidth={3} />
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </div>
              </div>

              <button
                onClick={(e) => deleteNotif(e, notif.id)}
                aria-label="Supprimer la notification"
                className="absolute top-5 right-5 p-2 text-gray-200 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-all active:scale-90"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
