'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Mail, Lock, User, ArrowRight, Phone } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// Liste stricte des pays autorisés
const ALLOWED_COUNTRIES = [
  { label: '🇰🇲 Comores', code: '+269', placeholder: '332 00 00' },
  { label: '🇾🇹 Mayotte', code: '+262', placeholder: '639 00 00 00' },
  { label: '🇷🇪 La Réunion', code: '+262', placeholder: '692 00 00 00' },
  { label: '🇫🇷 France', code: '+33', placeholder: '6 12 34 56 78' },
]

export default function AuthPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login')
  const [loading, setLoading] = useState(false)
  
  // États du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneBody: '' // Le numéro sans le préfixe
  })
  
  const [selectedCountry, setSelectedCountry] = useState(ALLOWED_COUNTRIES[0])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (view === 'register') {
        // 1. Validation du numéro
        if (!formData.phoneBody.trim()) {
            throw new Error("Le numéro de téléphone est obligatoire.")
        }

        // 2. Construction du numéro complet (Ex: +2693320000)
        // On enlève le 0 au début si l'utilisateur l'a mis (ex: 06...)
        const cleanBody = formData.phoneBody.replace(/^0/, '').replace(/\D/g, '')
        const fullPhone = `${selectedCountry.code}${cleanBody}`

        // 3. Inscription avec métadonnées
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { 
                full_name: formData.fullName,
                phone_number: fullPhone, // On sauvegarde le numéro
                country_origin: selectedCountry.label // Optionnel : pour savoir d'où il vient
            }
          }
        })
        if (error) throw error
        toast.success("Compte créé ! Vérifiez vos emails pour valider.")
        setView('login')
      } 
      
      else if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        toast.success("Connexion réussie")
        router.push('/compte')
        router.refresh()
      }

      else if (view === 'forgot') {
        const origin = window.location.origin
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
            redirectTo: `${origin}/auth/callback?next=/compte`,
        })
        if (error) throw error
        toast.success("Email de réinitialisation envoyé !")
        setView('login')
      }

    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* LOGO */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Comores<span className="text-brand">Market</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">Achat et vente entre les îles</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
        
        {/* ONGLETS */}
        {view !== 'forgot' && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button 
                    onClick={() => setView('login')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${view === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Connexion
                </button>
                <button 
                    onClick={() => setView('register')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${view === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Inscription
                </button>
            </div>
        )}

        {view === 'forgot' && (
            <div className="mb-6 text-center">
                <h2 className="text-lg font-bold text-gray-900">Mot de passe oublié ?</h2>
                <p className="text-xs text-gray-500 mt-1">Entrez votre email pour le réinitialiser</p>
            </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
            
            {/* CHAMPS INSCRIPTION UNIQUEMENT */}
            {view === 'register' && (
                <>
                    <div className="relative group">
                        <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand transition" size={20} />
                        <input 
                            type="text" 
                            placeholder="Nom complet" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition font-medium"
                            value={formData.fullName}
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                            required
                        />
                    </div>

                    {/* SÉLECTEUR DE PAYS + TÉLÉPHONE */}
                    <div className="flex gap-2">
                        <div className="w-1/3 relative">
                            <select 
                                className="w-full h-full bg-gray-50 border border-gray-200 rounded-xl px-2 text-sm font-bold outline-none focus:border-brand appearance-none text-center cursor-pointer"
                                value={selectedCountry.code}
                                onChange={e => {
                                    const country = ALLOWED_COUNTRIES.find(c => c.code === e.target.value) || ALLOWED_COUNTRIES[0]
                                    setSelectedCountry(country)
                                }}
                            >
                                {ALLOWED_COUNTRIES.map((c, i) => (
                                    <option key={i} value={c.code}>{c.label.split(' ')[0]} {c.code}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative group flex-1">
                            <Phone className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-brand transition" size={18} />
                            <input 
                                type="tel" 
                                placeholder={selectedCountry.placeholder}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition font-medium"
                                value={formData.phoneBody}
                                onChange={e => setFormData({...formData, phoneBody: e.target.value})}
                                required
                            />
                        </div>
                    </div>
                </>
            )}

            {/* CHAMPS COMMUNS */}
            <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand transition" size={20} />
                <input 
                    type="email" 
                    placeholder="Adresse email" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition font-medium"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>

            {view !== 'forgot' && (
                <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand transition" size={20} />
                    <input 
                        type="password" 
                        placeholder="Mot de passe" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition font-medium"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        required
                    />
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                        {view === 'login' && 'Se connecter'}
                        {view === 'register' && 'Créer mon compte'}
                        {view === 'forgot' && 'Envoyer le lien'}
                        <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>

        <div className="mt-6 text-center">
            {view === 'login' && (
                <button onClick={() => setView('forgot')} className="text-xs text-gray-400 hover:text-brand font-medium underline">
                    Mot de passe oublié ?
                </button>
            )}
            {view === 'forgot' && (
                <button onClick={() => setView('login')} className="text-xs text-gray-400 hover:text-brand font-medium underline">
                    Retour à la connexion
                </button>
            )}
        </div>

      </div>
      
      <Link href="/" className="mt-8 text-gray-400 text-sm hover:text-gray-600">
        Continuer sans compte
      </Link>
    </div>
  )
}