'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  ArrowLeft, Sparkles, Zap, Clock, ShieldCheck, 
  MessageCircle, Loader2, CheckCircle2, ShoppingBag 
} from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function BoostLandingPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    const msg = encodeURIComponent(
      `Bonjour ! Je souhaite activer le Boost (250 KMF) pour mon annonce :\n\n` +
      `📌 Titre : ${product?.title}\n` +
      `🆔 ID : ${params.id}\n\n` +
      `J'ai effectué le paiement, merci de l'activer !`
    );
    // REMPLACEZ PAR VOTRE NUMÉRO WHATSAPP RÉEL
    window.open(`https://wa.me/2693200000?text=${msg}`, '_blank');
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-brand" size={32} />
    </div>
  )

  const firstImage = product?.images ? JSON.parse(product.images)[0] : null

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20 overflow-x-hidden">
      
      {/* HEADER FIXE */}
      <div className="p-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <button 
          onClick={() => router.back()} 
          className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-90 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-black text-xl tracking-tight">Propulser mon annonce</h1>
      </div>

      <div className="px-8 pt-6 max-w-md mx-auto">
        
        {/* APERÇU DE L'ANNONCE À BOOSTER */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F5F7F9] p-4 rounded-[2.5rem] mb-10 flex items-center gap-4 border border-white shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden relative bg-gray-200 shrink-0">
            {firstImage && <Image src={firstImage} alt="" fill className="object-cover" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Votre annonce</p>
            <h3 className="font-bold text-sm truncate text-gray-800">{product?.title}</h3>
          </div>
        </motion.div>

        {/* HERO SECTION */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-amber-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Sparkles size={48} className="text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black leading-tight mb-4 tracking-tighter">
            Vendez <span className="text-amber-500 text-shadow-sm">plus vite</span> !
          </h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            Passez devant tout le monde pour seulement <span className="text-brand font-black">250 KMF</span>.
          </p>
        </div>

        {/* LISTE DES BÉNÉFICES */}
        <div className="space-y-8 mb-12">
          {[
            { 
              icon: <Zap className="text-amber-500" />, 
              title: "Position Prioritaire", 
              desc: "Votre annonce remonte en haut de sa catégorie, devant les annonces classiques." 
            },
            { 
              icon: <Clock className="text-brand" />, 
              title: "Visibilité 24 Heures", 
              desc: "Le boost reste actif pendant une journée complète pour toucher un maximum d'acheteurs." 
            },
            { 
              icon: <ShieldCheck className="text-emerald-500" />, 
              title: "Badge Prestige", 
              desc: "Une bordure ambre et un badge spécial 'Boosté' pour attirer l'œil." 
            }
          ].map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="flex gap-5"
            >
              <div className="w-14 h-14 bg-gray-50 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-white shadow-sm">
                {item.icon}
              </div>
              <div>
                <h4 className="font-black text-sm tracking-tight mb-1">{item.title}</h4>
                <p className="text-xs text-gray-400 font-bold leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SECTION PAIEMENT */}
        <div className="bg-[#F5F7F9] p-8 rounded-[3rem] border border-white mb-8 shadow-inner">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 text-center">Instructions de paiement</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100">
               <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Montant unique</span>
               <span className="text-xl font-black text-brand">250 KMF</span>
             </div>
             
             <div className="p-4 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-[10px] text-gray-500 font-bold text-center leading-relaxed italic">
                  Utilisez le même numéro que pour votre abonnement PRO. Une fois le transfert effectué, confirmez ci-dessous.
                </p>
             </div>
          </div>
        </div>

        {/* CTA FINAL */}
        <button 
          onClick={handleConfirmPayment}
          className="w-full bg-brand text-white font-black py-6 rounded-[2rem] shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
        >
          <MessageCircle size={20} /> Confirmer le paiement
        </button>
        
        <p className="text-center mt-6 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
           Activation manuelle sous 30 min
        </p>
      </div>
    </div>
  )
}