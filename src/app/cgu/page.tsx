'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
// AJOUT : Import du tracking pour suivre les demandes de contact
import { trackEvent } from '@/lib/analytics'

export default function CGUPage() {
  const router = useRouter()
  const CONTACT_EMAIL = "contact.comoresmarket@gmail.com"

  const handleContactClick = () => {
    // 📊 TRACKING : Savoir que quelqu'un clique sur l'email depuis les CGU
    trackEvent('contact_support_click', {
        source: 'cgu_page'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans pb-24">
      <div className="flex items-center gap-4 mb-8 pt-safe">
        <button 
          onClick={() => router.back()} 
          aria-label="Retour" 
          className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition"
        >
            <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Mentions Légales</h1>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm text-sm text-gray-600 leading-relaxed">
        <section>
            <h2 className="text-gray-900 font-bold mb-2">1. Éditeur</h2>
            <p>L'application Comores Market est une plateforme de mise en relation entre particuliers aux Comores.</p>
        </section>

        <section>
            <h2 className="text-gray-900 font-bold mb-2">2. Responsabilité</h2>
            <p>Comores Market agit en tant qu'hébergeur d'annonces. Nous ne sommes pas responsables des produits vendus, de leur qualité, ou des transactions entre acheteurs et vendeurs. Soyez vigilants lors de vos échanges.</p>
        </section>

        <section>
            <h2 className="text-gray-900 font-bold mb-2">3. Données Personnelles</h2>
            <p>Vos données (email, téléphone) sont utilisées uniquement pour le fonctionnement de l'application. Vous disposez d'un droit d'accès, de modification et de suppression de vos données via votre page "Compte".</p>
        </section>

        <section>
            <h2 className="text-gray-900 font-bold mb-2">4. Contenu Interdit</h2>
            <p>Il est interdit de vendre des produits illicites, dangereux, ou contraires aux bonnes mœurs. Tout contenu abusif sera supprimé sans préavis.</p>
        </section>

        {/* SECTION CONTACT */}
        <section className="pt-4 border-t border-gray-100 mt-4">
            <h2 className="text-gray-900 font-bold mb-3">5. Contact & Support</h2>
            <p className="mb-3">Pour toute question, signalement ou demande de suppression de compte, contactez-nous :</p>
            <Link 
              href="/contact"
                onClick={handleContactClick}
                className="flex items-center gap-2 text-brand font-bold bg-brand/5 p-3 rounded-xl hover:bg-brand/10 transition justify-center"
            >
                <Mail size={18} /> {CONTACT_EMAIL}
            </Link>
        </section>

        <div className="pt-8 text-xs text-center text-gray-500">
            © 2025 Comores Market. Tous droits réservés.
        </div>
      </div>
    </div>
  )
}