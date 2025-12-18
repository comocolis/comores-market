'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Smartphone, CreditCard, ShieldCheck, 
  Camera, MessageCircle, Mail, Crown, BarChart3, Share2, ImageIcon 
} from 'lucide-react'

export default function ProPage() {
  const [activeTab, setActiveTab] = useState<'mvola' | 'cb'>('mvola')

  // 1. Numéro Mvola (Pour le paiement)
  const MVOLA_NUMBER = "434 20 63"
  
  // 2. Numéro WhatsApp (Pour la réception de preuve)
  const WHATSAPP_CONTACT = "33758760743"
  const CONTACT_EMAIL = "contact.comoresmarket@gmail.com"
  
  const whatsappMessage = encodeURIComponent(`Bonjour, je viens d'envoyer 2500 KMF par Mvola au ${MVOLA_NUMBER}. Voici mon ID de transaction pour activer mon compte PRO.`)
  const whatsappLink = `https://wa.me/${WHATSAPP_CONTACT}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      
      {/* HEADER */}
      <div className="bg-brand pt-14 px-4 pb-24 rounded-b-[2.5rem] shadow-sm relative">
        <Link href="/compte" className="absolute top-14 left-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition">
            <ArrowLeft size={20} />
        </Link>
        <div className="text-center mt-4">
            <h1 className="text-white font-bold opacity-90 tracking-widest uppercase text-xs mb-1">Offre Mensuelle</h1>
            
            <div className="flex items-center justify-center gap-2">
                <span className="text-6xl font-extrabold text-white tracking-tighter">2500</span>
                <div className="flex flex-col items-start leading-none pt-2">
                    <span className="text-lg font-bold text-white">KMF</span>
                    <span className="text-xs font-medium text-white/80">/ mois</span>
                </div>
            </div>
            <p className="text-white/80 text-sm mt-2 font-medium">Devenez un Vendeur d'Élite 🚀</p>
        </div>
      </div>

      {/* CARTE DES AVANTAGES */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-5">
            
            {/* Boost Visibilité */}
            <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2.5 rounded-full text-yellow-600 shrink-0"><Crown size={20} /></div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">Visibilité Boostée ⚡</p>
                    <p className="text-xs text-gray-500">Vos annonces apparaissent en premier avec un design Gold distinctif.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-full text-blue-600 shrink-0"><BarChart3 size={20} /></div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">Statistiques de Vues 📈</p>
                    <p className="text-xs text-gray-500">Sachez exactement combien de clients consultent vos produits.</p>
                </div>
            </div>

            {/* Réseaux Sociaux */}
            <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2.5 rounded-full text-purple-600 shrink-0"><Share2 size={20} /></div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">Réseaux Sociaux 🌐</p>
                    <p className="text-xs text-gray-500">Affichez vos liens Facebook & Instagram sur votre profil public.</p>
                </div>
            </div>

            {/* NOUVEAU : Photos Chat */}
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2.5 rounded-full text-indigo-600 shrink-0"><ImageIcon size={20} /></div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">Photos dans le chat 📸</p>
                    <p className="text-xs text-gray-500">Envoyez des photos dans les messages privés pour convaincre l'acheteur.</p>
                </div>
            </div>

            <div className="h-px bg-gray-50 w-full" />

            {/* Liste Simple (Badge, WhatsApp, etc.) */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0"><MessageCircle size={18} /></div>
                    <span className="text-gray-700 font-medium text-sm">Lien WhatsApp Direct sur l'annonce</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full text-gray-600 shrink-0"><ShieldCheck size={18} /></div>
                    <span className="text-gray-700 font-medium text-sm">Badge Certifié "PRO"</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0"><Camera size={18} /></div>
                    <span className="text-gray-700 font-medium text-sm">Galerie jusqu'à 10 photos</span>
                </div>
            </div>

        </div>
      </div>

      {/* ZONE DE PAIEMENT */}
      <div className="px-4 mt-8">
        <h3 className="font-bold text-gray-900 mb-3 ml-1">Moyen de paiement</h3>
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
                    
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 bg-[#FFD700] rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-sm">M</div>
                            <div className="truncate">
                                <p className="font-bold text-gray-900 text-sm">Mvola</p>
                                <p className="text-xs text-gray-500 truncate">Comores Telma</p>
                            </div>
                        </div>
                        <div className="text-right whitespace-nowrap">
                             <p className="font-bold text-xl text-gray-900 tracking-wide">{MVOLA_NUMBER}</p>
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

                <div className="border-t border-gray-100 pt-6 mt-2 text-center">
                    <p className="text-xs text-gray-400 mb-2 font-medium">Besoin d'aide ou autre moyen de paiement ?</p>
                    <a 
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="inline-flex items-center gap-2 text-brand font-bold text-sm bg-brand/5 px-4 py-2 rounded-full hover:bg-brand/10 transition"
                    >
                        <Mail size={16} /> {CONTACT_EMAIL}
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
