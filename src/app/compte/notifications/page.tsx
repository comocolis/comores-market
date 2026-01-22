'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, ChevronLeft, ShieldCheck, Star, Info, 
  CheckCheck, Clock, Trash2, Loader2, MessageCircle 
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

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

    // 1. Charger les notifications
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

    // 2. Marquer comme lu (DÉCLENCHE LE REALTIME DE LA BOTTOMNAV)
    const unreadIds = data?.filter((n: any) => !n.is_read).map((n: any) => n.id) || []
    if (unreadIds.length > 0) {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds) // On ne met à jour que les IDs affichés

      if (updateError) console.error("Erreur marqueur 'lu':", updateError)
    }
  }

  useEffect(() => {
    loadNotifs()
  }, [])

  // SUPPRESSION SÉCURISÉE
  const deleteNotif = async (id: string) => {
    // On ne filtre pas l'UI tout de suite pour vérifier si la base accepte
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("❌ Échec de suppression en base:", error.message)
      toast.error("Action impossible : " + error.message)
    } else {
      // Succès : On met à jour l'écran
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success("Notification supprimée")
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'sentinel': 
        return <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600"><ShieldCheck size={20} /></div>
      case 'elite': 
        return <div className="bg-yellow-100 p-2.5 rounded-xl text-yellow-600"><Star size={20} /></div>
      case 'message': 
        return <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><MessageCircle size={20} /></div>
      default: 
        return <div className="bg-gray-100 p-2.5 rounded-xl text-gray-400"><Info size={20} /></div>
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-24">
      {/* HEADER BAR */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-xl z-30 border-b border-gray-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition active:scale-90">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Notifications</h1>
        <div className="ml-auto p-2 text-brand/30">
          <CheckCheck size={20} />
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 shadow-inner">
              <Bell size={40} />
            </div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Aucune alerte</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-5 rounded-[2.2rem] border transition-all duration-500 flex gap-4 relative animate-in slide-in-from-bottom-3 ${
                notif.is_read 
                  ? 'bg-white border-gray-100 grayscale-[0.5] opacity-80' 
                  : 'bg-white border-amber-100 shadow-xl shadow-amber-900/5 ring-1 ring-amber-50'
              }`}
            >
              <div className="shrink-0">{getIcon(notif.type)}</div>

              <div className="flex-1 pr-6">
                <h3 className={`text-sm font-black tracking-tight mb-1 ${notif.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                  {notif.title}
                </h3>
                <p className="text-xs font-medium text-gray-500 leading-relaxed">
                  {notif.message}
                </p>
                
                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-300 uppercase tracking-wider mt-3">
                  <Clock size={10} strokeWidth={3} />
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                </div>
              </div>

              {/* BOUTON SUPPRIMER */}
              <button 
                onClick={(e) => {
                    e.preventDefault();
                    deleteNotif(notif.id);
                }}
                className="absolute top-5 right-5 p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90"
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