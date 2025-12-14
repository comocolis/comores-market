'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Smartphone, CreditCard, Send, ShieldCheck, Camera, MessageCircle } from 'lucide-react'

export default function ProPage() {
  const [activeTab, setActiveTab] = useState<'mvola' | 'cb'>('mvola')

  // Numéro de paiement
  const PAYMENT_PHONE = "434 20 63"
  
  // Message pré-rempli pour WhatsApp
  const whatsappMessage = encodeURIComponent(`Bonjour, je viens d'envoyer 2500 KMF par Mvola au ${PAYMENT_PHONE}. Voici mon ID de transaction pour activer mon compte PRO.`)
  const whatsappLink = `https://wa.me/269${PAYMENT_PHONE.replace(/\s/g, '')}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      
      {/* HEADER AVEC BOUTON RETOUR */}
      <div className="bg-brand pt-safe px-4 pb-16 rounded-b-[2.5rem] shadow-sm relative">
        <Link href="/compte" className="absolute top-4 left-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition pt-safe-offset">
            <ArrowLeft size={20} />
        </Link>
        <div className="text-center mt-4">
            <h1 className="text-white font-bold text-xl opacity-90 tracking-wide">OFFRE MENSUELLE</h1>
            <div className="mt-2 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold text-white">2500</span>
                <span className="text-white/80 font-bold">KMF</span>
            </div>
            <p className="text-white/70 text-sm">/ mois</p>
        </div>
      </div>

      {/* CARTE DES AVANTAGES */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full text-brand"><MessageCircle size={20} /></div>
                <span className="text-gray-700 font-medium">Lien WhatsApp Direct</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full text-brand"><ShieldCheck size={20} /></div>
                <span className="text-gray-700 font-medium">Badge "Vendeur Pro"</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full text-brand"><Camera size={20} /></div>
                <span className="text-gray-700 font-medium">10 photos / annonce</span>
            </div>
        </div>
      </div>

      {/* ZONE DE PAIEMENT */}
      <div className="px-4 mt-8">
        {/* Onglets */}
        <div className="bg-gray-200 p-1 rounded-xl flex mb-6">
            <button 
                onClick={() => setActiveTab('mvola')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'mvola' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
                <Smartphone size={16} /> Mvola (Mobile)
            </button>
            <button 
                onClick={() => setActiveTab('cb')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'cb' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
                <CreditCard size={16} /> Carte Bancaire
            </button>
        </div>

        {activeTab === 'mvola' ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-brand text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <h3 className="font-bold text-gray-900">Envoyez le paiement</h3>
                    </div>
                    
                    {/* CORRECTION ICI : Alignement parfait du numéro */}
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 bg-[#FFD700] rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-sm">M</div>
                            <div className="truncate">
                                <p className="font-bold text-gray-900 text-sm">Mvola</p>
                                <p className="text-xs text-gray-500 truncate">Comores Telma</p>
                            </div>
                        </div>
                        {/* whitespace-nowrap empêche le numéro de se couper */}
                        <div className="text-right whitespace-nowrap">
                             <p className="font-bold text-xl text-gray-900 tracking-wide">{PAYMENT_PHONE}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-brand text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <h3 className="font-bold text-gray-900">Confirmez l'activation</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                        Une fois envoyé, cliquez ci-dessous pour nous envoyer la preuve (ID de transaction) sur WhatsApp.
                    </p>
                    
                    <a 
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition transform active:scale-95"
                    >
                        <MessageCircle size={20} /> Envoyer la preuve
                    </a>
                </div>

            </div>
        ) : (
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center animate-in fade-in slide-in-from-bottom-2">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <CreditCard size={32} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Bientôt disponible</h3>
                <p className="text-gray-500 text-sm">Le paiement par carte bancaire sera activé prochainement. Veuillez utiliser Mvola.</p>
            </div>
        )}

      </div>
    </div>
  )
}