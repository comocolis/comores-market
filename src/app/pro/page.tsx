'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, Crown, ShieldCheck, Zap, Smartphone, MessageCircle, ArrowLeft, CreditCard, LayoutGrid, Instagram, Image as ImageIcon, LogIn, Loader2, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'
// AJOUT : Import du tracking
import { trackProSubscription, trackAdsConversion } from '@/lib/analytics'

export default function ProPage() {
  const supabase = createClient()
  const router = useRouter()

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<'mvola' | 'card'>('mvola')
  
  // États pour l'authentification
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [supabase])

  // INFOS PAIEMENT
  const MVOLA_NUMBER = "434 20 63"
  const WHATSAPP_CONTACT = "2693376132"
  
  const getWhatsAppMessage = (plan: 'monthly' | 'yearly') => {
      const amount = plan === 'monthly' ? '2500' : '25000'
      const type = plan === 'monthly' ? 'MENSUEL' : 'ANNUEL'
      const userEmail = user?.email ? `\n(Compte : ${user.email})` : ''
      
      return encodeURIComponent(
          `Bonjour, je viens d'envoyer ${amount} KMF par Mvola au ${MVOLA_NUMBER}.\n` +
          `Voici mon ID de transaction pour activer mon compte PRO ${type}.${userEmail}`
      )
  }

  // GESTION DU CLIC SUR LE BOUTON PAIEMENT
  const handlePaymentClick = () => {
      const price = selectedPlan === 'monthly' ? 2500 : 25000;
      const duration = selectedPlan === 'monthly' ? '1 mois' : '1 an';

      // 1. GA4 : On enregistre l'achat (ou l'intention d'achat forte)
      trackProSubscription(price, duration);

      // 2. Google Ads : On signale une conversion importante
      // Remplacez 'VOTRE_LABEL_ABONNEMENT' par le label Ads correspondant si vous en avez un
      trackAdsConversion('VOTRE_LABEL_ABONNEMENT', price);
  }

  // LISTE COMPLÈTE DES AVANTAGES
  const benefits = [
    { text: "Badge 'Vendeur Vérifié' (Gold)", icon: <ShieldCheck size={18} className="text-brand" /> },
    { text: "Visibilité Boostée (Tête de liste)", icon: <Zap size={18} className="text-amber-500" /> },
    { text: "Galerie jusqu'à 10 photos", icon: <LayoutGrid size={18} className="text-blue-500" /> },
    { text: "Photos illimitées dans le chat", icon: <ImageIcon size={18} className="text-purple-500" /> },
    { text: "Lien WhatsApp direct sur l'annonce", icon: <MessageCircle size={18} className="text-green-500" /> },
    { text: "Liens Réseaux Sociaux (FB/Insta)", icon: <Instagram size={18} className="text-pink-500" /> },
    { text: "Statistiques de vues détaillées", icon: <Check size={18} className="text-gray-400" /> },
  ]

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      
      {/* HEADER HERO */}
      <div className="bg-gray-900 text-white pt-8 pb-20 px-6 rounded-b-[2.5rem] relative overflow-hidden">
        <Link href="/compte" className="absolute top-8 left-6 bg-white/10 p-2 rounded-full hover:bg-white/20 transition z-20">
            <ArrowLeft size={20} />
        </Link>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 text-center mt-8">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full mb-6 border border-white/10 backdrop-blur-md">
            <Crown size={16} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Devenez l'Élite</span>
          </div>
          <h1 className="text-3xl font-black mb-4 leading-tight">
            Passez au niveau<br />
            <span className="text-brand">Supérieur.</span>
          </h1>
        </div>
      </div>

      <div className="px-6 -mt-14 relative z-20 space-y-6">
        
        {/* SÉLECTEUR DE PLAN (Mensuel / Annuel) */}
        <div className="bg-white p-1.5 rounded-2xl shadow-lg flex mb-2">
            <button 
                onClick={() => setSelectedPlan('monthly')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${selectedPlan === 'monthly' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Mensuel
            </button>
            <button 
                onClick={() => setSelectedPlan('yearly')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${selectedPlan === 'yearly' ? 'bg-brand text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Annuel
                {selectedPlan !== 'yearly' && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold animate-bounce">-17%</span>}
            </button>
        </div>

        {/* CARTE PRINCIPALE */}
        <motion.div 
          key={selectedPlan}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`p-6 rounded-4xl shadow-xl border-2 relative overflow-hidden bg-white ${selectedPlan === 'yearly' ? 'border-amber-400' : 'border-white'}`}
        >
          {selectedPlan === 'yearly' && (
             <div className="absolute top-0 right-0 bg-amber-400 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                2 mois offerts
             </div>
          )}

          {/* PRIX */}
          <div className="text-center mb-8 mt-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{selectedPlan === 'monthly' ? 'Sans engagement' : 'Paiement unique'}</p>
            <div className="flex items-baseline justify-center gap-1">
               <span className="text-5xl font-black text-gray-900 tracking-tighter">
                 {selectedPlan === 'monthly' ? '2 500' : '25 000'}
               </span>
               <span className="text-lg font-bold text-gray-400">KMF</span>
            </div>
            {selectedPlan === 'yearly' && <p className="text-xs text-amber-500 font-bold mt-2">Soit 2 083 KMF / mois</p>}
          </div>

          {/* LISTE DES AVANTAGES (Complète) */}
          <ul className="space-y-4 mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-100">
            {benefits.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-700 font-bold">
                <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100 shrink-0">
                    {item.icon}
                </div>
                {item.text}
              </li>
            ))}
          </ul>

          <div className="h-px bg-gray-100 w-full mb-6" />

          {/* SÉLECTEUR DE PAIEMENT (Mvola / Carte) */}
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Moyen de paiement</h3>
          <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setPaymentMethod('mvola')}
                className={`flex-1 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'mvola' ? 'border-brand bg-green-50 text-green-800' : 'border-gray-100 bg-white text-gray-400 grayscale'}`}
              >
                  <Smartphone size={20} />
                  <span className="text-[10px] font-black uppercase">Mvola</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'card' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-100 bg-white text-gray-400'}`}
              >
                  <CreditCard size={20} />
                  <span className="text-[10px] font-black uppercase">Carte</span>
              </button>
          </div>

          {/* CONTENU DU PAIEMENT (PROTÉGÉ) */}
          {paymentMethod === 'mvola' ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                  {!user ? (
                      // --- VISITEUR NON CONNECTÉ ---
                      <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200 border-dashed">
                          <Lock size={24} className="mx-auto text-gray-400 mb-3" />
                          <p className="text-xs font-bold text-gray-500 mb-4">Connectez-vous pour voir les instructions de paiement et activer votre compte.</p>
                          <Link 
                            href="/auth"
                            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
                          >
                              <LogIn size={16} /> Se connecter
                          </Link>
                      </div>
                  ) : (
                      // --- UTILISATEUR CONNECTÉ ---
                      <>
                          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#FFD700] rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm">M</div>
                                  <div>
                                      <p className="text-[10px] font-bold text-gray-500 uppercase">Envoyer au</p>
                                      <p className="text-lg font-black text-gray-900 tracking-wider">{MVOLA_NUMBER}</p>
                                  </div>
                              </div>
                          </div>
                          
                          <a 
                            href={`https://wa.me/${WHATSAPP_CONTACT}?text=${getWhatsAppMessage(selectedPlan)}`}
                            target="_blank"
                            onClick={handlePaymentClick}
                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition transform active:scale-95 uppercase text-xs tracking-widest"
                          >
                            <MessageCircle size={18} fill="currentColor" />
                            Envoyer la preuve
                          </a>
                          <p className="text-[10px] text-center text-gray-400 mt-3 font-medium">Activation sous 15 min après envoi.</p>
                      </>
                  )}
              </div>
          ) : (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-300">
                      <CreditCard size={24} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Bientôt disponible</p>
                  <p className="text-xs text-gray-500 mt-1">Le paiement sécurisé par carte sera activé prochainement.</p>
              </div>
          )}

        </motion.div>

        {/* Pied de page */}
        <div className="text-center px-4 pt-4 pb-8 flex items-center justify-center gap-2 text-gray-300 opacity-60">
            <ShieldCheck size={14} />
            <p className="text-[10px] font-medium uppercase tracking-widest">Paiement Sécurisé & Support 24/7</p>
        </div>

      </div>
    </div>
  )
}