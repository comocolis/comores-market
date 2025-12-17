'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, ChangeEvent } from 'react'
import Image from 'next/image'
import { Loader2, Mail, Lock, User, ArrowRight, Phone, MapPin, Camera, Eye, EyeOff, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const ALLOWED_COUNTRIES = [
  { label: '🇰🇲 Comores', code: '+269', placeholder: '332 00 00', regex: /^(3[234]\d{5})$/ },
  { label: '🇾🇹 Mayotte', code: '+262', placeholder: '639 00 00 00', regex: /^(639\d{6})$/ },
  { label: '🇷🇪 La Réunion', code: '+262', placeholder: '692 00 00 00', regex: /^(69[23]\d{6})$/ },
  { label: '🇫🇷 France', code: '+33', placeholder: '6 12 34 56 78', regex: /^[67]\d{8}$/ }, // 06 ou 07 sans le 0
]

export default function AuthPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login')
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
        toast.success("Email envoyé !")
        setView('login')
      }

    } catch (error: any) {
      toast.error(error.message || "Erreur survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    // CONTENEUR PRINCIPAL : FOND GRIS CLAIR
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* BANDEAU SUPERIEUR VERT (DECORATIF) */}
      <div className="absolute top-0 left-0 w-full h-[45%] bg-brand rounded-b-[2.5rem] z-0 shadow-sm"></div>

      {/* CONTENU (Z-INDEX 10 pour être au dessus du fond) */}
      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        
        {/* LOGO (Sur fond vert, donc texte blanc) */}
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="text-white">Comores</span>
                <span className="text-mustard">Market</span>
            </h1>
            <p className="text-white/90 text-sm mt-2 font-medium">Achat et vente entre les îles</p>
        </div>

        {/* CARTE BLANCHE */}
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full">
            {view !== 'forgot' && (
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button onClick={() => setView('login')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${view === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Connexion</button>
                    <button onClick={() => setView('register')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${view === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Inscription</button>
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                
                {view === 'register' && (
                    <div className="space-y-4 animate-in fade-in">
                        
                        {/* AVATAR UPLOAD */}
                        <div className="flex justify-center mb-6 relative">
                            <div className="relative">
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden group hover:border-mustard transition ${avatarPreview ? 'border-solid border-mustard' : 'border-gray-300'}`}
                                >
                                    {avatarPreview ? (
                                        <Image src={avatarPreview} alt="Aperçu" fill className="object-cover" />
                                    ) : (
                                        <Camera className="text-gray-400 group-hover:text-mustard transition" size={32} />
                                    )}
                                </div>
                                
                                {avatarPreview && (
                                    <button 
                                        type="button"
                                        onClick={removeAvatar}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition shadow-md z-20"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                        </div>

                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-mustard transition" size={20} />
                            <input type="text" placeholder="Nom complet" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-mustard font-medium transition" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                        </div>

                        <div className="flex gap-2">
                            <div className="w-1/3 relative">
                                <select className="w-full h-full bg-gray-50 border border-gray-200 rounded-xl px-2 text-sm font-bold outline-none appearance-none text-center cursor-pointer focus:border-mustard transition" value={selectedCountry.code} onChange={e => setSelectedCountry(ALLOWED_COUNTRIES.find(c => c.code === e.target.value) || ALLOWED_COUNTRIES[0])}>
                                    {ALLOWED_COUNTRIES.map((c, i) => (<option key={i} value={c.code}>{c.label.split(' ')[0]} {c.code}</option>))}
                                </select>
                            </div>
                            <div className="relative group flex-1">
                                <Phone className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-mustard transition" size={18} />
                                <input type="tel" placeholder={selectedCountry.placeholder} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-mustard font-medium transition" value={formData.phoneBody} onChange={e => setFormData({...formData, phoneBody: e.target.value})} required />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="w-1/2 relative group">
                                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3 text-sm font-medium outline-none focus:border-mustard appearance-none cursor-pointer transition" value={formData.island} onChange={e => setFormData({...formData, island: e.target.value})}>
                                    <option>Ngazidja</option>
                                    <option>Ndzouani</option>
                                    <option>Mwali</option>
                                    <option>Maore</option>
                                    <option>La Réunion</option>
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
                            </div>
                            <div className="w-1/2 relative group">
                                <MapPin className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-mustard transition" size={18} />
                                <input type="text" placeholder="Ville" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-9 pr-2 outline-none focus:border-mustard text-sm font-medium transition" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                            </div>
                        </div>
                    </div>
                )}

                {/* Email */}
                <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-mustard transition" size={20} />
                    <input type="email" placeholder="Adresse email" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-mustard font-medium transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>

                {view !== 'forgot' && (
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-mustard transition" size={20} />
                        <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-12 outline-none focus:border-mustard font-medium transition" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition focus:outline-none">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-brand text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : (view === 'login' ? 'Se connecter' : view === 'register' ? 'Créer mon compte' : 'Envoyer le lien')}
                </button>
            </form>

            <div className="mt-6 text-center">
                {view === 'login' ? <button onClick={() => setView('forgot')} className="text-xs text-gray-400 underline">Mot de passe oublié ?</button> : view === 'forgot' && <button onClick={() => setView('login')} className="text-xs text-gray-400 underline">Retour connexion</button>}
            </div>
        </div>
        <Link href="/" className="mt-8 text-gray-400 text-sm hover:text-gray-600 font-medium">Continuer sans compte</Link>
      </div>
    </div>
  )
}