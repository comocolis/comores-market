'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, ChangeEvent } from 'react'
import { Loader2, Camera, LogIn, Eye, EyeOff, AlertCircle, X, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

// --- STYLES & CONSTANTES ---
const inputStyle = "w-full p-3 bg-white rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-colors"
const labelStyle = "block text-sm font-bold text-gray-700 mb-1"

const PHONE_PREFIXES = [
  { code: '+269', label: '🇰🇲 Comores', flag: '🇰🇲' },
  { code: '+262', label: 'YT Mayotte', flag: '🇾🇹' },
  { code: '+262', label: 'RE Réunion', flag: '🇷🇪' },
  { code: '+33', label: '🇫🇷 France', flag: '🇫🇷' },
]

const SUB_CATEGORIES: { [key: string]: string[] } = {
  'Véhicules': ['Voitures', 'Motos', 'Pièces', 'Location', 'Camions'],
  'Immobilier': ['Vente', 'Location', 'Terrains', 'Bureaux', 'Colocation'],
  'Mode': ['Homme', 'Femme', 'Enfant', 'Chaussures', 'Montres', 'Bijoux', 'Sacs'],
  'Tech': ['Téléphones', 'Ordinateurs', 'Audio', 'Photo', 'Accessoires', 'Consoles'],
  'Maison': ['Meubles', 'Décoration', 'Electroménager', 'Bricolage', 'Jardin'],
  'Loisirs': ['Sport', 'Musique', 'Livres', 'Jeux', 'Voyage'],
  'Alimentation': ['Fruits & Légumes', 'Plats', 'Épicerie', 'Boissons', 'Desserts'],
  'Services': ['Cours', 'Réparations', 'Déménagement', 'Événements', 'Nettoyage'],
  'Beauté': ['Parfums', 'Maquillage', 'Soins', 'Coiffure'],
  'Emploi': ['Offres', 'Demandes', 'Stages', 'Intérim'],
}

export default function PublierPage() {
  const supabase = createClient()
  const router = useRouter()
  
  // États Utilisateur
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // États Auth
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  
  const [phonePrefix, setPhonePrefix] = useState('+269')

  const [authData, setAuthData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    phone: '', 
    island: 'Ngazidja', 
    city: '' 
  })
  
  // États Formulaire Annonce
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    title: '', 
    price: '', 
    category: 'Véhicules', 
    subCategory: '', 
    island: 'Ngazidja', 
    city: '', 
    description: '', 
    phone: ''
  })

  // 1. Mise à jour automatique de la sous-catégorie par défaut
  useEffect(() => {
    if (SUB_CATEGORIES[formData.category]) {
        setFormData(prev => ({ ...prev, subCategory: SUB_CATEGORIES[prev.category][0] }))
    } else {
        setFormData(prev => ({ ...prev, subCategory: '' }))
    }
  }, [formData.category])

  // 2. Vérification Session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(profile)
        // Pré-remplissage
        if (profile) {
            setFormData(prev => ({
                ...prev, 
                phone: profile.phone_number || '',
                island: profile.island || 'Ngazidja',
                city: profile.city || ''
            }))
        }
      }
      setLoading(false)
    }
    checkUser()
  }, [supabase])

  const maxImages = profile?.is_pro ? 10 : 3

  // --- LOGIQUE AUTHENTIFICATION ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)
    
    try {
      if (isForgotPassword) {
        const origin = window.location.origin
        // C'EST ICI LA CLÉ : On passe le paramètre "?next=/compte/reset"
        const redirectUrl = `${origin}/auth/callback?next=/compte/reset`

        const { error } = await supabase.auth.resetPasswordForEmail(authData.email, {
            redirectTo: redirectUrl,
        })
        
        if (error) throw error
        toast.success("Email envoyé ! Le lien vous mènera à la page de modification.")
        setIsForgotPassword(false)
      }
      else if (isLogin) {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password,
        })
        if (error) throw error
        toast.success("Connexion réussie !")
        router.push('/compte') // Redirection vers Compte
      } else {
        // Inscription
        const cleanNumber = authData.phone.replace(/^0+/, '')
        const fullPhoneNumber = `${phonePrefix}${cleanNumber}`

        const { data, error } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: { 
            data: { 
                full_name: authData.fullName,
                phone: fullPhoneNumber,
                island: authData.island,
                city: authData.city
            } 
          }
        })
        if (error) throw error

        if (data.session) {
            toast.success("Compte créé avec succès ! Bienvenue.")
            router.push('/compte') // Redirection directe
        } else {
            toast.info("Compte créé ! Vérifiez votre email pour valider.")
            setIsLogin(true)
        }
      }
    } catch (error: any) {
      const msg = error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message
      setAuthError(msg)
      toast.error(msg)
    } finally {
      setAuthLoading(false)
    }
  }

  // --- LOGIQUE ANNONCE ---
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selectedFiles = Array.from(e.target.files)
    if (files.length + selectedFiles.length > maxImages) {
        toast.error(`Limite atteinte : ${maxImages} images maximum.`)
        return
    }
    setFiles([...files, ...selectedFiles])
    setPreviews([...previews, ...selectedFiles.map(f => URL.createObjectURL(f))])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (files.length === 0) return toast.warning("Ajoutez au moins une photo.")
    setUploading(true)

    try {
      // 1. Upload Images
      let imageUrls = []
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
        imageUrls.push(publicUrl)
      }

      // 2. Récupérer Catégorie ID
      const { data: cat } = await supabase.from('categories').select('id').ilike('slug', formData.category.toLowerCase().replace(/ /g, '-')).single()
      
      // 3. ASTUCE FILTRE : Ajouter la sous-catégorie dans la description
      const augmentedDescription = `${formData.description}\n\nType: ${formData.subCategory}`

      // 4. Création Annonce
      const { error } = await supabase.from('products').insert({
        user_id: user.id,
        title: formData.title,
        price: parseInt(formData.price),
        category_id: cat?.id || 1,
        location_island: formData.island,
        location_city: formData.city,
        description: augmentedDescription,
        whatsapp_number: formData.phone,
        images: JSON.stringify(imageUrls),
        status: 'active'
      })

      if (error) throw error
      toast.success('Annonce publiée avec succès !')
      router.push('/') 
      router.refresh() 

    } catch (error: any) {
      toast.error('Erreur : ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  // --- VUE LOGIN / SIGNUP ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center relative p-6">
        <div className="absolute top-0 left-0 w-full p-4 pt-safe flex items-center">
            <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-brand font-bold bg-white/80 px-4 py-2 rounded-full shadow-sm backdrop-blur-sm transition">
                <ArrowLeft size={20} />
                <span>Retour</span>
            </Link>
        </div>

        <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand">
              <LogIn size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
                {isForgotPassword ? 'Récupération' : (isLogin ? 'Connexion' : 'Créer un compte')}
            </h1>
            <p className="text-gray-500 text-sm mt-2">Rejoignez la communauté Comores Market.</p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100 animate-in slide-in-from-top-1">
                <AlertCircle size={16} /> {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div>
                    <label className={labelStyle}>Nom complet</label>
                    <input type="text" required className={inputStyle} placeholder="Ex: Ali Soilihi" value={authData.fullName} onChange={e => setAuthData({...authData, fullName: e.target.value})} autoComplete="name" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelStyle}>Île</label>
                        <select className={inputStyle} value={authData.island} onChange={e => setAuthData({...authData, island: e.target.value})}>
                            <option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Ville</label>
                        <input type="text" required className={inputStyle} placeholder="Ex: Moroni" value={authData.city} onChange={e => setAuthData({...authData, city: e.target.value})} autoComplete="address-level2" />
                    </div>
                </div>

                <div>
                    <label className={labelStyle}>Téléphone WhatsApp</label>
                    <div className="flex gap-2">
                        <div className="w-1/3 relative">
                            <select className={`${inputStyle} appearance-none pr-6 text-xs font-bold`} value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)}>
                                {PHONE_PREFIXES.map(p => (<option key={p.label} value={p.code}>{p.flag} {p.code}</option>))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                            </div>
                        </div>
                        <input type="tel" required className={`${inputStyle} w-2/3`} placeholder="333 44 55" value={authData.phone} onChange={e => setAuthData({...authData, phone: e.target.value})} autoComplete="tel-local" />
                    </div>
                </div>
              </div>
            )}
            
            <div>
              <label className={labelStyle}>Email</label>
              <input type="email" required className={inputStyle} placeholder="votre@email.com" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} autoComplete="email" />
            </div>

            {!isForgotPassword && (
                <div className="relative">
                <label className={labelStyle}>Mot de passe</label>
                <input type={showPassword ? "text" : "password"} required minLength={6} className={inputStyle} placeholder="••••••••" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} autoComplete={isLogin ? "current-password" : "new-password"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                </div>
            )}

            {isLogin && !isForgotPassword && (
                <div className="text-right">
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-brand font-bold hover:underline">
                        Mot de passe oublié ?
                    </button>
                </div>
            )}

            <button type="submit" disabled={authLoading} className="w-full bg-brand text-white font-bold py-3 rounded-lg hover:bg-brand-dark transition shadow-md mt-2 disabled:opacity-70 flex justify-center">
              {authLoading ? <Loader2 className="animate-spin" /> : (
                  isForgotPassword ? 'Envoyer le lien' : (isLogin ? 'Se connecter' : "S'inscrire")
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-600">
            {isForgotPassword ? (
                <button onClick={() => setIsForgotPassword(false)} className="text-brand font-bold hover:underline">
                    Retour à la connexion
                </button>
            ) : (
                <>
                    {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                    <button onClick={() => {setIsLogin(!isLogin); setAuthError(null)}} className="text-brand font-bold ml-1 hover:underline">
                        {isLogin ? "S'inscrire" : "Se connecter"}
                    </button>
                </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- VUE PUBLIER (Connecté) ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="bg-white p-4 sticky top-0 z-50 border-b border-gray-200 flex items-center justify-between pt-safe shadow-sm">
        <button onClick={() => router.back()} className="text-gray-500 font-medium">Annuler</button>
        <h1 className="font-bold text-lg">Déposer une annonce</h1>
        <button onClick={handleSubmit} disabled={uploading} className="text-brand font-bold disabled:opacity-50">
          {uploading ? '...' : 'Publier'}
        </button>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-3 border border-gray-100">
          <div className="flex justify-between items-center">
             <label className={labelStyle}>Photos ({files.length}/{maxImages})</label>
             {!profile?.is_pro && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">PRO = 10 photos</span>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {files.length < maxImages && (
                <label className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-brand cursor-pointer hover:bg-brand/5 transition">
                    <Camera size={24} />
                    <span className="text-xs font-bold mt-1">Ajouter</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
            )}
            {previews.map((src, index) => (
                <div key={index} className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 group">
                    <Image src={src} alt="Aperçu" fill className="object-cover" />
                    <button type="button" onClick={() => {setFiles(files.filter((_, i) => i !== index)); setPreviews(previews.filter((_, i) => i !== index))}} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition"><X size={14} /></button>
                </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm space-y-5 border border-gray-100">
          <div><label className={labelStyle}>Titre</label><input type="text" required className={inputStyle} placeholder="Ex: Toyota Yaris" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className={labelStyle}>Catégorie</label>
                <select className={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {Object.keys(SUB_CATEGORIES).map(cat => <option key={cat}>{cat}</option>)}
                </select>
            </div>
            <div>
                <label className={labelStyle}>Type</label>
                <select className={inputStyle} value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})}>
                    {SUB_CATEGORIES[formData.category]?.map(sub => <option key={sub}>{sub}</option>)}
                </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm space-y-5 border border-gray-100">
          <div><label className={labelStyle}>Prix (KMF)</label><input type="number" required className={`${inputStyle} font-bold text-lg`} placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelStyle}>Île</label><select className={inputStyle} value={formData.island} onChange={e => setFormData({...formData, island: e.target.value})}><option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option></select></div>
            <div><label className={labelStyle}>Ville</label><input type="text" required className={inputStyle} placeholder="Moroni" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm space-y-5 border border-gray-100">
          <div><label className={labelStyle}>Description</label><textarea rows={4} className={inputStyle} placeholder="Détails..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div><label className={labelStyle}>Téléphone (pour cette annonce)</label><input type="tel" required className={inputStyle} placeholder="+269..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
        </div>

        <button onClick={handleSubmit} disabled={uploading} className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-lg hover:bg-brand-dark transition disabled:opacity-70">
          {uploading ? 'Publication...' : "Publier l'annonce"}
        </button>
      </div>
    </div>
  )
}