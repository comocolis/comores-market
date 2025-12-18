'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Check, Crown, ShieldCheck, TrendingUp, BarChart3, 
  MessageCircle, Loader2, ArrowLeft, Camera, Facebook 
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleSubscribe = async () => {
    if (!user) return router.push('/auth')
    
    setLoading(true)
    // Simulation d'abonnement (Pour la V1, on active juste le statut)
    // Dans le futur, ici on redirigerait vers Stripe ou Holo
    try {
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1) // +1 Mois

        const { error } = await supabase.from('profiles').update({
            is_pro: true,
            subscription_end_date: endDate.toISOString()
        }).eq('id', user.id)

        if (error) throw error

        toast.success("Félicitations ! Vous êtes maintenant Vendeur PRO.")
        router.push('/compte')
        router.refresh()
    } catch (e) {
        toast.error("Erreur lors de l'activation")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      
      {/* HEADER */}
      <div className="bg-gray-900 text-white p-6 pt-safe rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <Link href="/compte" className="inline-block p-2 bg-white/10 rounded-full mb-4 hover:bg-white/20 transition backdrop-blur-md">
            <ArrowLeft size={20} />
        </Link>
        
        <div className="text-center relative z-10 mb-6">
            <div className="w-16 h-16 bg-mustard rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-mustard/20 rotate-3 transform transition hover:rotate-6">
                <Crown size={32} className="text-gray-900" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Devenez <span className="text-mustard">Vendeur PRO</span></h1>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Boostez vos ventes et débloquez les outils exclusifs des meilleurs vendeurs.</p>
        </div>
      </div>

      {/* AVANTAGES */}
      <div className="px-6 -mt-8 relative z-20 space-y-4">
        
        {/* CARTE PRIX */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 text-center">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Offre de lancement</p>
            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-extrabold text-gray-900">5000</span>
                <div className="text-left leading-none">
                    <span className="block text-xs font-bold text-brand">KMF</span>
                    <span className="block text-xs text-gray-400">/ mois</span>
                </div>
            </div>
            <button 
                onClick={handleSubscribe} 
                disabled={loading}
                className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand/30 hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : "Activer mon Pack PRO"}
            </button>
            <p className="text-[10px] text-gray-400 mt-3">Sans engagement. Annulable à tout moment.</p>
        </div>

        {/* LISTE BÉNÉFICES */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Tout ce qui est inclus :</h3>
            
            <Benefit 
                icon={ShieldCheck} 
                color="text-green-500" 
                title="Badge de Confiance" 
                desc="Rassurez vos clients avec le badge PRO officiel à côté de votre nom." 
            />
            
            <Benefit 
                icon={TrendingUp} 
                color="text-blue-500" 
                title="Visibilité Boostée" 
                desc="Vos annonces apparaissent en priorité et avec une bordure dorée." 
            />
            
            {/* NOUVEAU : PHOTOS DANS LE CHAT */}
            <Benefit 
                icon={Camera} 
                color="text-purple-500" 
                title="Photos dans le Chat" 
                desc="Envoyez des photos en privé pour conclure la vente plus vite."
                isNew
            />

            <Benefit 
                icon={BarChart3} 
                color="text-orange-500" 
                title="Statistiques Avancées" 
                desc="Voyez combien de personnes visitent vos annonces chaque jour." 
            />

            <Benefit 
                icon={MessageCircle} 
                color="text-[#25D366]" 
                title="Lien WhatsApp Direct" 
                desc="Les acheteurs peuvent vous contacter sur WhatsApp en 1 clic." 
            />

            <Benefit 
                icon={Facebook} 
                color="text-[#1877F2]" 
                title="Réseaux Sociaux" 
                desc="Affichez vos liens Facebook et Instagram sur votre profil." 
            />
        </div>

      </div>
    </div>
  )
}

function Benefit({ icon: Icon, color, title, desc, isNew }: any) {
    return (
        <div className="flex gap-4 items-start">
            <div className={`p-3 rounded-2xl bg-gray-50 ${color} shrink-0`}>
                <Icon size={24} />
            </div>
            <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    {title}
                    {isNew && <span className="bg-brand text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-wide">Nouveau</span>}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">{desc}</p>
            </div>
        </div>
    )
}