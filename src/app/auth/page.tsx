'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, ChangeEvent } from 'react'
import Image from 'next/image'
import { Loader2, Mail, Lock, User, Phone, MapPin, Camera, Eye, EyeOff, X, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'
import { sendAdminAlert } from '@/lib/edge-functions'

// ✅ FONCTION DE CONVERSION GOOGLE ADS
const triggerRegistrationConversion = () => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      'send_to': 'AW-16447515729/-voaCKWeu_EbENHY5KI9',
      'value': 1.0,
      'currency': 'EUR'
    });
    console.log("✅ Conversion Inscription Google Ads envoyée !");
  }
}

const ALLOWED_COUNTRIES = [
  { label: '🇰🇲 Comores', code: '+269', placeholder: '334 20 63 / 434 20 63', regex: /^(3[234]\d{5}|4\d{6})$/ },
  { label: '🇾🇹 Mayotte', code: '+262', placeholder: '639 00 00 00', regex: /^(639\d{6})$/ },
  { label: '🇷🇪 La Réunion', code: '+262', placeholder: '692 00 00 00', regex: /^(69[23]\d{6})$/ },
  { label: '🇫🇷 France', code: '+33', placeholder: '6 12 34 56 78', regex: /^[67]\d{8}$/ }, 
]

export default function AuthPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'magic_link'>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneBody: '',
    island: 'Ngazidja',
    city: ''
  })
  
  const [selectedCountry, setSelectedCountry] = useState(ALLOWED_COUNTRIES[0])

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            toast.error("L'image est trop volumineuse (Max 5MB)")
            return
        }
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const removeAvatar = (e: React.MouseEvent) => {
    e.stopPropagation() 
    e.preventDefault()
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ✅ CONNEXION / INSCRIPTION AVEC GOOGLE
  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const origin = window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })
      if (error) throw error
      trackEvent('login', { method: 'google' })
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion avec Google")
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (view === 'register') {
        const cleanBody = formData.phoneBody.replace(/\s/g, '').replace(/^0/, '')
        
        if (!cleanBody) throw new Error("Le numéro de téléphone est obligatoire.")
        if (!formData.city.trim()) throw new Error("La ville est obligatoire.")
        
        if (!selectedCountry.regex.test(cleanBody)) throw new Error(`Numéro invalide pour ${selectedCountry.label.split(' ')[1]}.`)

        const fullPhone = `${selectedCountry.code}${cleanBody}`
        let publicAvatarUrl = ''

        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop()
            const fileName = `signup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile)
            if (uploadError) throw new Error("Erreur upload image")
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
            publicAvatarUrl = urlData.publicUrl
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { 
                full_name: formData.fullName,
                phone_number: fullPhone,
                country_origin: selectedCountry.label,
                island: formData.island,
                city: formData.city,
                avatar_url: publicAvatarUrl || null
            }
          }
        })
        
        if (error) throw error

        if (data.session) {
            trackEvent('sign_up', { method: 'email' })
            triggerRegistrationConversion() 

            try {
                await sendAdminAlert(
                  formData.fullName,
                  formData.email,
                  fullPhone,
                  formData.island,
                  formData.city
                );
            } catch (alertErr) {
                console.error("Erreur alerte inscription", alertErr);
            }

            toast.success("Bienvenue ! Compte créé avec succès.")
            router.push('/compte')
            router.refresh()
        } else {
            toast.success("Compte créé ! Veuillez cliquer sur le lien reçu par email.")
            setView('login')
        }
        
        setAvatarFile(null)
        setAvatarPreview(null)
      }
      
      else if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        
        trackEvent('login', { method: 'email' })

        toast.success("Connexion réussie")
        router.push('/compte')
      }

      else if (view === 'forgot') {
        const origin = window.location.origin
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
            redirectTo: `${origin}/compte/reset`,
        })
        
        if (error) throw error
        toast.success("Email envoyé ! Vérifiez votre boîte de réception.")
        setView('login')
      }

      else if (view === 'magic_link') {
        const origin = window.location.origin
        const { error } = await supabase.auth.signInWithOtp({
            email: formData.email,
            options: {
                emailRedirectTo: `${origin}/compte`,
            }
        })
        
        if (error) throw error
        toast.success("Lien magique envoyé ! Vérifiez vos emails.")
      }

    } catch (error: any) {
      toast.error(error.message || "Erreur survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[45%] bg-brand rounded-b-[2.5rem] z-0 shadow-sm"></div>

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="text-white">Comores</span>
                <span className="text-mustard">Market</span>
            </h1>
            <p className="text-white/90 text-sm mt-2 font-medium">Achat et vente entre les îles<br/>(NAM KARIBU)</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl w-full">
            {!['forgot', 'magic_link'].includes(view) && (
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button onClick={() => setView('login')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${view === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Connexion</button>
                    <button onClick={() => setView('register')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${view === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Inscription</button>
                </div>
            )}

            {view === 'magic_link' && (
                <div className="mb-6 text-center">
                    <div className="w-12 h-12 bg-mustard/10 rounded-full flex items-center justify-center mx-auto mb-3 text-mustard">
                        <Wand2 size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Connexion sans mot de passe</h2>
                    <p className="text-xs text-gray-500">Nous vous enverrons un lien magique.</p>
                </div>
            )}

            {view === 'forgot' && (
                <div className="mb-6 text-center">
                    <h2 className="text-lg font-bold text-gray-900">Réinitialisation</h2>
                    <p className="text-xs text-gray-500">Entrez votre email pour changer de mot de passe.</p>
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                
                {view === 'register' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="flex justify-center mb-6 relative">
                            <div className="relative">
                                <button 
                                  type="button" 
                                  aria-label="Ajouter une photo de profil"
                                  onClick={() => fileInputRef.current?.click()} 
                                  className={`w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden group hover:border-mustard transition ${avatarPreview ? 'border-solid border-mustard' : 'border-gray-300'}`}
                                >
                                    {avatarPreview ? <Image src={avatarPreview} alt="Aperçu" fill className="object-cover" /> : <Camera className="text-gray-500 group-hover:text-mustard transition" size={32} />}
                                </button>
                                {avatarPreview && (
                                  <button 
                                    type="button" 
                                    aria-label="Supprimer la photo"
                                    onClick={removeAvatar} 
                                    className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition shadow-md z-20"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                            </div>
                            <input 
                              type="file" 
                              aria-label="Choisir une image"
                              ref={fileInputRef} 
                              onChange={handleAvatarChange} 
                              accept="image/*" 
                              className="hidden" 
                            />
                        </div>

                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-mustard transition" size={20} />
                            <input 
                              type="text" 
                              aria-label="Nom complet"
                              placeholder="Nom complet" 
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-mustard font-medium transition" 
                              value={formData.fullName} 
                              onChange={e => setFormData({...formData, fullName: e.target.value})} 
                              required 
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="w-1/3 relative">
                                <select 
                                  aria-label="Indicatif pays"
                                  className="w-full h-full bg-gray-50 border border-gray-200 rounded-xl px-2 text-sm font-bold outline-none appearance-none text-center cursor-pointer focus:border-mustard transition" 
                                  value={selectedCountry.code} 
                                  onChange={e => setSelectedCountry(ALLOWED_COUNTRIES.find(c => c.code === e.target.value) || ALLOWED_COUNTRIES[0])}
                                >
                                    {ALLOWED_COUNTRIES.map((c, i) => (<option key={i} value={c.code}>{c.label.split(' ')[0]} {c.code}</option>))}
                                </select>
                            </div>
                            <div className="relative group flex-1">
                                <Phone className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-mustard transition" size={18} />
                                <input 
                                  type="tel" 
                                  aria-label="Numéro de téléphone"
                                  placeholder={selectedCountry.placeholder} 
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-mustard font-medium transition" 
                                  value={formData.phoneBody} 
                                  onChange={e => setFormData({...formData, phoneBody: e.target.value})} 
                                  required 
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="w-1/2 relative group">
                                <select 
                                  aria-label="Choisir l'île"
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3 text-sm font-medium outline-none focus:border-mustard appearance-none cursor-pointer transition" 
                                  value={formData.island} 
                                  onChange={e => setFormData({...formData, island: e.target.value})}
                                >
                                    <option>Ngazidja</option>
                                    <option>Ndzouani</option>
                                    <option>Mwali</option>
                                    <option>Maore</option>
                                    <option>La Réunion</option>
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">▼</div>
                            </div>
                            <div className="w-1/2 relative group">
                                <MapPin className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-mustard transition" size={18} />
                                <input 
                                  type="text" 
                                  aria-label="Ville"
                                  placeholder="Ville" 
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-9 pr-2 outline-none focus:border-mustard text-sm font-medium transition" 
                                  value={formData.city} 
                                  onChange={e => setFormData({...formData, city: e.target.value})} 
                                  required 
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-mustard transition" size={20} />
                    <input 
                      type="email" 
                      aria-label="Adresse email"
                      placeholder="Adresse email" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-mustard font-medium transition" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      required 
                    />
                </div>

                {(view === 'login' || view === 'register') && (
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-mustard transition" size={20} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          aria-label="Mot de passe"
                          placeholder="Mot de passe" 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-12 outline-none focus:border-mustard font-medium transition" 
                          value={formData.password} 
                          onChange={e => setFormData({...formData, password: e.target.value})} 
                          required 
                        />
                        <button 
                          type="button" 
                          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-600 transition focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-brand text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" /> : 
                        (view === 'login' ? 'Se connecter' : 
                         view === 'register' ? 'Créer mon compte' : 
                         view === 'magic_link' ? 'Envoyer le lien magique' : 
                         'Envoyer le lien de réinitialisation')
                    }
                </button>
            </form>

            {/* --- BOUTON D'AUTHENTIFICATION GOOGLE --- */}
            {['login', 'register'].includes(view) && (
              <>
                <div className="relative my-5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">ou</span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl shadow-sm hover:bg-gray-50 transition transform active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-5 h-5 min-w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61a5.66 5.66 0 0 1-2.45 3.71v3.08h3.95a12 12 0 0 0 3.63-8.64z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.95-3.08c-1.1.74-2.51 1.18-3.98 1.18-3.07 0-5.67-2.08-6.6-4.88H1.31v3.18A12 12 0 0 0 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.4 14.31A7.17 7.17 0 0 1 5 12c0-.8.14-1.57.4-2.31V6.51H1.31A11.94 11.94 0 0 0 0 12c0 2.05.52 4 1.31 5.49l4.09-3.18z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.31 6.51l4.09 3.18c.93-2.8 3.53-4.88 6.6-4.88z"
                    />
                  </svg>
                  Continuer avec Google
                </button>
              </>
            )}

            <div className="mt-6 flex flex-col gap-3 text-center">
                {view === 'login' && (
                    <button onClick={() => setView('magic_link')} className="flex items-center justify-center gap-2 text-sm font-bold text-mustard hover:text-mustard-dark transition">
                        <Wand2 size={16} /> Se connecter sans mot de passe
                    </button>
                )}

                {view === 'login' ? (
                    <button onClick={() => setView('forgot')} className="text-xs text-gray-500 underline">Mot de passe oublié ?</button>
                ) : (view === 'forgot' || view === 'magic_link') && (
                    <button onClick={() => setView('login')} className="text-xs text-gray-500 underline">Retour connexion</button>
                )}
            </div>
        </div>

        {/* --- NOUVEAU MENU PUBLIC EN BAS --- */}
        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link href="/" className="text-gray-500 text-sm hover:text-gray-900 font-bold transition">
                Continuer sans compte
            </Link>

            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <Link href="/pro" className="hover:text-brand transition">Vendeur Pro</Link>
                <span>•</span>
                <Link href="/faq" className="hover:text-brand transition">Aide</Link>
                <span>•</span>
                <Link href="/cgu" className="hover:text-brand transition">Infos</Link>
            </div>
        </div>

      </div>
    </div>
  )
}