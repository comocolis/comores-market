'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  ArrowLeft, Sparkles, Zap, Clock, ShieldCheck, 
  MessageCircle, Loader2, Smartphone, CreditCard, Mail
} from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
// AJOUT : Import du tracking
import { trackBoostPurchase, trackAdsConversion } from '@/lib/analytics'

export default function BoostLandingPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'mvola' | 'cb'>('mvola')

  // --- PARAMÈTRES DE PAIEMENT ---
  const MVOLA_NUMBER = "434 20 63"
  const WHATSAPP_CONTACT = "33758760743"
  const CONTACT_EMAIL = "contact.comoresmarket@gmail.com"

  useEffect(() => {
    const getProduct = async () => {
      const { data } = await supabase
        .from('products')
        .select('title, images, price')
        .eq('id', params.id)
        .single()
      setProduct(data)
      setLoading(false)
    }
    getProduct()
  }, [params.id, supabase])

  const handleConfirmPayment = () => {
    // 1. GA4 : On enregistre l'achat du boost
    trackBoostPurchase(params.id as string, '24h_visibility', 250);

    // 2. Google Ads : On signale la conversion
    // Remplacez 'VOTRE_LABEL_BOOST' par le label Ads correspondant
    trackAdsConversion('VOTRE_LABEL_BOOST', 250);

    const msg = encodeURIComponent(
      `Bonjour ! Je souhaite activer le Boost (250 KMF) pour mon annonce :\n\n` +
      `📌 Titre : ${product?.title}\n` +
      `🆔 ID : ${params.id}\n\n` +
      `J'ai effectué le paiement via Mvola, merci de l'activer !`
    );
    window.open(`https://wa.me/${WHATSAPP_CONTACT}?text=${msg}`, '_blank');
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-brand" size={32} />
    </div>
  )

  const firstImage = product?.images ? JSON.parse(product.images)[0] : null

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 overflow-x-hidden">
      
      {/* HEADER PREMIUM (Thème Ambre pour le Boost) */}
      <div className="bg-amber-500 pt-14 px-4 pb-24 rounded-b-[2.5rem] shadow-sm relative">
        <button 
          onClick={() => router.back()} 
          className="absolute top-14 left-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center mt-4">
            <h1 className="text-white font-bold opacity-90 tracking-widest uppercase text-xs mb-1">Option Visibilité</h1>
            <div className="flex items-center justify-center gap-2">
                <span className="text-6xl font-extrabold text-white tracking-tighter">250</span>
                <div className="flex flex-col items-start leading-none pt-2">
                    <span className="text-lg font-bold text-white">KMF</span>
                    <span className="text-xs font-medium text-white/80">/ 24h</span>
                </div>
            </div>
            <p className="text-white/80 text-sm mt-2 font-medium">Propulsez votre annonce en tête 🚀</p>
        </div>
      </div>

      {/* APERÇU DE L'OFFRE & AVANTAGES */}
      <div className="px-4 -mt-16 relative z-10 max-w-md mx-auto">
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-white space-y-6">
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
               <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 bg-gray-200 shadow-sm">
                  {firstImage && <Image src={firstImage} alt="" fill className="object-cover" />}
               </div>
               <div className="min-w-0">
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Annonce sélectionnée</p>
                  <h3 className="text-sm font-bold text-gray-900 truncate">{product?.title}</h3>
               </div>
            </div>

            <div className="space-y-4 pt-2">
                {[
                  { icon: <Zap size={18} />, color: 'bg-amber-100 text-amber-600', text: "Position prioritaire devant tout le monde" },
                  { icon: <Clock size={18} />, color: 'bg-blue-100 text-blue-600', text: "Visibilité maximale pendant 24 heures" },
                  { icon: <ShieldCheck size={18} />, color: 'bg-emerald-100 text-emerald-600', text: "Badge Prestige 'Boosté' exclusif" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`${item.color} p-2 rounded-xl shrink-0`}>{item.icon}</div>
                    <p className="text-xs font-bold text-gray-600">{item.text}</p>
                  </div>
                ))}
            </div>
        </div>
      </div>

      {/* SÉLECTEUR DE PAIEMENT */}
      <div className="px-4 mt-10 max-w-md mx-auto">
        <h3 className="font-black text-gray-900 mb-4 ml-1 uppercase text-[10px] tracking-widest opacity-50">Moyen de paiement</h3>
        
        <div className="bg-gray-200 p-1 rounded-2xl flex mb-6">
            <button 
                onClick={() => setActiveTab('mvola')}
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'mvola' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500'}`}
            >
                <Smartphone size={16} /> Mvola
            </button>
            <button 
                onClick={() => setActiveTab('cb')}
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'cb' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500'}`}
            >
                <CreditCard size={16} /> Carte
            </button>
        </div>

        {activeTab === 'mvola' ? (
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-white space-y-8 animate-in fade-in slide-in-from-bottom-2">
                {/* ÉTAPE 1 */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                        <h3 className="font-black text-gray-900 text-sm">Envoyez 250 KMF</h3>
                    </div>
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black text-lg">M</div>
                           <div>
                              <p className="font-black text-gray-900 text-xs">Mvola Comores</p>
                              <p className="text-[10px] text-amber-600 font-bold">Telma Money</p>
                           </div>
                        </div>
                        <span className="font-black text-xl text-gray-900 tracking-tighter">{MVOLA_NUMBER}</span>
                    </div>
                </div>

                {/* ÉTAPE 2 */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                        <h3 className="font-black text-gray-900 text-sm">Confirmation</h3>
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold leading-relaxed mb-6 px-1">
                        Une fois le transfert effectué, cliquez sur le bouton ci-dessous pour nous envoyer votre preuve de paiement.
                    </p>
                    <button 
                        onClick={handleConfirmPayment}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-5 rounded-[1.8rem] flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 transition transform active:scale-95 uppercase text-[10px] tracking-widest"
                    >
                        <MessageCircle size={20} /> Confirmer sur WhatsApp
                    </button>
                </div>

                <div className="pt-4 text-center border-t border-gray-50">
                   <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      <Mail size={12} /> {CONTACT_EMAIL}
                   </p>
                </div>
            </div>
        ) : (
            <div className="bg-white p-12 rounded-[2.5rem] text-center border border-white shadow-sm animate-in fade-in">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <CreditCard size={32} />
                </div>
                <h3 className="font-black text-gray-900 mb-2">Bientôt disponible</h3>
                <p className="text-gray-400 text-xs font-bold leading-relaxed">
                  Le paiement par carte bancaire (Stripe/PayPal) arrive prochainement. Pour l'instant, merci d'utiliser Mvola.
                </p>
            </div>
        )}

        <p className="text-center mt-8 text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
           Activation sous 30 minutes
        </p>
      </div>
    </div>
  )
}