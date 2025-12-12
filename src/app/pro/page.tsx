'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, Smartphone, MessageCircle, Star, Lock } from 'lucide-react'

export default function DevenirProPage() {
  const mvolaNumber = "434 20 63"
  const whatsappLink = `https://wa.me/33758760743?text=${encodeURIComponent("Bonjour, je viens d'envoyer un paiement Mvola pour l'offre Vendeur Pro. Voici la preuve :")}`
  const [activeTab, setActiveTab] = useState<'mobile' | 'card'>('mobile')

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <div className="bg-brand pt-safe px-6 pb-24 rounded-b-[2.5rem] shadow-sm text-center">
        <div className="flex justify-start mb-4"><Link href="/compte" className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition"><ArrowLeft size={24} /></Link></div>
        <h1 className="text-white font-extrabold text-3xl mb-2">Devenir Pro 🚀</h1><p className="text-white/90 text-sm">Boostez vos ventes dès aujourd'hui.</p>
      </div>
      <div className="px-4 -mt-16">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-brand relative">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-linear-to-r from-yellow-400 to-orange-500 text-white font-bold uppercase text-xs px-6 py-2 rounded-full shadow-lg shadow-orange-500/30 flex items-center gap-2 animate-in zoom-in duration-300 delay-150"><Star size={14} className="fill-white" /> Populaire</div>
            <div className="text-center mb-6 mt-4"><p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Offre Mensuelle</p><div className="flex items-center justify-center gap-1 text-brand"><span className="text-4xl font-extrabold">2500</span><span className="text-xl font-bold">KMF</span></div><p className="text-gray-400 text-xs">/ mois</p></div>
            <ul className="space-y-3 mb-2"><li className="flex items-center gap-3 text-gray-700"><div className="bg-green-100 p-1.5 rounded-full text-green-600"><Smartphone size={16} /></div><span className="font-medium text-sm">Lien WhatsApp Direct</span></li><li className="flex items-center gap-3 text-gray-700"><div className="bg-green-100 p-1.5 rounded-full text-green-600"><Star size={16} /></div><span className="font-medium text-sm">Badge "Vendeur Pro"</span></li><li className="flex items-center gap-3 text-gray-700"><div className="bg-green-100 p-1.5 rounded-full text-green-600"><CheckCircle size={16} /></div><span className="font-medium text-sm">10 photos / annonce</span></li></ul>
        </div>
        <div className="flex bg-gray-200 p-1 rounded-xl mb-6"><button onClick={() => setActiveTab('mobile')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mvola (Mobile)</button><button onClick={() => setActiveTab('card')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Carte Bancaire</button></div>
        {activeTab === 'mobile' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span className="bg-brand text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> Envoyez le paiement</h3>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100 mb-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-sm">M</div><div><p className="font-bold text-gray-900">Mvola Comores</p><p className="text-xs text-gray-500">Telma</p></div></div><p className="font-mono font-bold text-xl text-gray-900 select-all tracking-wide">{mvolaNumber}</p></div>
                <div className="border-t border-gray-100 pt-6"><h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span className="bg-brand text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Confirmez l'activation</h3><p className="text-sm text-gray-600 mb-4 leading-relaxed">Une fois envoyé, cliquez ci-dessous pour nous envoyer la preuve (ID de transaction) sur WhatsApp.</p><a href={whatsappLink} target="_blank" className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95"><MessageCircle size={20} /> Envoyer la preuve</a></div>
            </div>
        )}
        {activeTab === 'card' && <div className="bg-white rounded-2xl shadow-sm p-8 text-center animate-in fade-in slide-in-from-bottom-4"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><Lock size={32} /></div><h3 className="font-bold text-gray-900 text-lg mb-2">Bientôt disponible</h3><p className="text-gray-500 text-sm mb-6">Nous travaillons sur l'intégration des paiements sécurisés.</p><button onClick={() => setActiveTab('mobile')} className="mt-8 text-brand font-bold text-sm hover:underline">Payer par Mvola en attendant</button></div>}
        <p className="text-center text-xs text-gray-400 mt-8 mb-4">Activation sous 30 min (9h-18h)</p>
      </div>
    </div>
  )
}