'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image' 
import { 
  Camera, Loader2, DollarSign, Type, X, ChevronLeft, Lock, Crown, 
  Phone, Ban, Sparkles, ShieldCheck, GripHorizontal,
  Calendar, Gauge, Fuel, HardDrive, Home, Maximize, Layers,
  Ruler, Shirt, Briefcase, Zap, Scissors, Truck, Anchor, Watch, Gem, 
  Music, Book, Plane, Utensils, Wrench, GraduationCap, Clock, 
  MapPin, Star, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// --- IMPORTS DRAG & DROP ---
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { compressImage } from '@/utils/compressImage'

// --- CONSTANTES GLOBALES ---
const FREE_ADS_LIMIT = 3
const FREE_PHOTOS_LIMIT = 3
const PRO_PHOTOS_LIMIT = 10

const CATEGORIES_LIST = [
  { id: 1, label: 'Véhicules' }, { id: 2, label: 'Immobilier' }, { id: 3, label: 'Mode' },
  { id: 4, label: 'Tech' }, { id: 5, label: 'Maison' }, { id: 6, label: 'Loisirs' },
  { id: 7, label: 'Alimentation' }, { id: 8, label: 'Services' }, { id: 9, label: 'Beauté' }, { id: 10, label: 'Emploi' },
]

const SUB_CATEGORIES: { [key: number]: string[] } = {
  1: ['Voitures', 'Motos', 'Pièces Détachées', 'Location', 'Camions', 'Bateaux'],
  2: ['Vente Maison', 'Vente Terrain', 'Location Maison', 'Location Appartement', 'Bureaux & Commerces', 'Colocation'],
  3: ['Vêtements Homme', 'Vêtements Femme', 'Enfant & Bébé', 'Chaussures', 'Montres & Bijoux', 'Sacs & Accessoires'],
  4: ['Téléphones', 'Ordinateurs', 'Audio & Son', 'Appareils Photo', 'Accessoires Info', 'Consoles & Jeux'],
  5: ['Meubles', 'Décoration', 'Électroménager', 'Bricolage', 'Jardin', 'Linge de maison'],
  6: ['Sports', 'Instruments de musique', 'Livres', 'Vélos', 'Voyages & Billets'],
  7: ['Fruits & Légumes', 'Plats cuisinés', 'Épicerie', 'Boissons', 'Produits frais'],
  8: ['Cours & Formations', 'Réparations', 'Déménagement', 'Événements', 'Ménage & Aide'],
  9: ['Parfums', 'Maquillage', 'Soins Visage & Corps', 'Coiffure', 'Matériel Pro'],
  10: ['Offres d\'emploi', 'Demandes d\'emploi', 'Stages', 'Intérim'],
}

const SPECIFIC_FIELDS: Record<string, any[]> = {
    'Voitures': [
        { key: 'year', label: 'Année', icon: Calendar, type: 'number', placeholder: 'Ex: 2018' },
        { key: 'mileage', label: 'Kilométrage', icon: Gauge, type: 'number', placeholder: 'Ex: 85000' },
        { key: 'fuel', label: 'Carburant', icon: Fuel, type: 'select', options: ['Essence', 'Diesel', 'Hybride', 'Électrique'] },
        { key: 'transmission', label: 'Boîte', icon: Layers, type: 'select', options: ['Manuelle', 'Automatique'] }
    ],
    'Motos': [
        { key: 'year', label: 'Année', icon: Calendar, type: 'number', placeholder: '2020' },
        { key: 'mileage', label: 'Kilométrage', icon: Gauge, type: 'number', placeholder: '15000' },
        { key: 'cc', label: 'Cylindrée (cc)', icon: Zap, type: 'number', placeholder: '125' }
    ],
    'Camions': [
        { key: 'tonnage', label: 'Tonnage', icon: Truck, type: 'number', placeholder: 'Ex: 3.5' },
        { key: 'year', label: 'Année', icon: Calendar, type: 'number', placeholder: '2015' },
        { key: 'fuel', label: 'Carburant', icon: Fuel, type: 'select', options: ['Diesel', 'Essence'] }
    ],
    'Bateaux': [
        { key: 'type', label: 'Type', icon: Anchor, type: 'select', options: ['Vedette', 'Barque', 'Boutre', 'Moteur Hors-bord'] },
        { key: 'length', label: 'Longueur (m)', icon: Ruler, type: 'number', placeholder: 'Ex: 7' }
    ],
    'Pièces Détachées': [
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf', 'Occasion', 'Reconditionné'] },
        { key: 'compatibility', label: 'Compatible avec', icon: Wrench, type: 'text', placeholder: 'Ex: Toyota Yaris 2010...' }
    ],
    'Vente Maison': [
        { key: 'surface', label: 'Surface (m²)', icon: Maximize, type: 'number', placeholder: '120' },
        { key: 'rooms', label: 'Pièces', icon: Home, type: 'number', placeholder: '4' },
        { key: 'titre', label: 'Papier/Titre', icon: ShieldCheck, type: 'select', options: ['Titré/Borné', 'Papier Comorien', 'En cours', 'Non titré'] }
    ],
    'Vente Terrain': [
        { key: 'surface', label: 'Surface (m²)', icon: Maximize, type: 'number', placeholder: '500' },
        { key: 'titre', label: 'Papier/Titre', icon: ShieldCheck, type: 'select', options: ['Titré/Borné', 'Papier Comorien', 'En cours', 'Non titré'] },
        { key: 'access', label: 'Accès Voiture', icon: Truck, type: 'select', options: ['Oui', 'Non', 'Piste'] }
    ],
    'Location Maison': [
        { key: 'rooms', label: 'Chambres', icon: Home, type: 'number', placeholder: '3' },
        { key: 'furnished', label: 'Meublé', icon: Layers, type: 'select', options: ['Oui', 'Non', 'Partiellement'] },
        { key: 'period', label: 'Paiement', icon: Calendar, type: 'select', options: ['Mensuel', 'Journalier'] }
    ],
    'Bureaux & Commerces': [
        { key: 'surface', label: 'Surface (m²)', icon: Maximize, type: 'number', placeholder: '50' },
        { key: 'location', label: 'Emplacement', icon: MapPin, type: 'select', options: ['Bord de route', 'Centre-ville', 'Quartier calme'] }
    ],
    'Chaussures': [
        { key: 'size', label: 'Pointure', icon: Ruler, type: 'number', placeholder: '42' },
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Nike, Adidas...' },
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf', 'Très bon état', 'Bon état'] }
    ],
    'Vêtements Homme': [
        { key: 'size', label: 'Taille', icon: Shirt, type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Zara, H&M...' }
    ],
    'Vêtements Femme': [
        { key: 'size', label: 'Taille', icon: Shirt, type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42'] },
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Mango, Shein...' }
    ],
    'Montres & Bijoux': [
        { key: 'material', label: 'Matière', icon: Gem, type: 'select', options: ['Or', 'Argent', 'Acier', 'Cuir', 'Plaqué'] },
        { key: 'brand', label: 'Marque', icon: Watch, type: 'text', placeholder: 'Rolex, Seiko, Casio...' }
    ],
    'Téléphones': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Samsung, Apple, Huawei...' },
        { key: 'storage', label: 'Stockage', icon: HardDrive, type: 'select', options: ['32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To'] },
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf (Scellé)', 'Comme neuf', 'Bon état', 'Écran fissuré'] }
    ],
    'Ordinateurs': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'HP, Dell, Apple...' },
        { key: 'processor', label: 'Processeur', icon: Zap, type: 'text', placeholder: 'Core i5, Ryzen 7...' },
        { key: 'ram', label: 'RAM', icon: Layers, type: 'select', options: ['4 Go', '8 Go', '16 Go', '32 Go'] }
    ],
    'Consoles & Jeux': [
        { key: 'platform', label: 'Plateforme', icon: Zap, type: 'select', options: ['PS5', 'PS4', 'Xbox', 'Switch', 'PC'] },
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf', 'Occasion'] }
    ],
    'Meubles': [
        { key: 'material', label: 'Matière', icon: Layers, type: 'text', placeholder: 'Bois rouge, Métal, Verre...' },
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf', 'Très bon état', 'Bon état'] }
    ],
    'Électroménager': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Samsung, LG...' },
        { key: 'energy', label: 'Conso', icon: Zap, type: 'select', options: ['Faible consommation', 'Normale'] }
    ],
    'Instruments de musique': [
        { key: 'type', label: 'Instrument', icon: Music, type: 'text', placeholder: 'Guitare, Piano...' },
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf', 'Occasion'] }
    ],
    'Livres': [
        { key: 'genre', label: 'Genre', icon: Book, type: 'text', placeholder: 'Roman, Scolaire, Religion...' },
        { key: 'lang', label: 'Langue', icon: Type, type: 'select', options: ['Français', 'Arabe', 'Anglais', 'Shikomori'] }
    ],
    'Voyages & Billets': [
        { key: 'dest', label: 'Destination', icon: Plane, type: 'text', placeholder: 'Dubaï, Tanzanie, France...' },
        { key: 'date', label: 'Départ prévu', icon: Calendar, type: 'text', placeholder: 'JJ/MM/AAAA' }
    ],
    'Fruits & Légumes': [
        { key: 'origin', label: 'Origine', icon: MapPin, type: 'select', options: ['Local (Comores)', 'Importé'] },
        { key: 'unit', label: 'Vendu par', icon: DollarSign, type: 'select', options: ['Kilo', 'Tas', 'Sac', 'Carton'] }
    ],
    'Plats cuisinés': [
        { key: 'type', label: 'Type', icon: Utensils, type: 'select', options: ['Salé', 'Sucré', 'Traiteur'] },
        { key: 'availability', label: 'Dispo', icon: Clock, type: 'select', options: ['Sur commande', 'Immédiat'] }
    ],
    'Produits frais': [
        { key: 'preservation', label: 'Conservation', icon: Lock, type: 'select', options: ['Frais', 'Congelé'] }
    ],
    'Cours & Formations': [
        { key: 'level', label: 'Niveau', icon: GraduationCap, type: 'select', options: ['Débutant', 'Intermédiaire', 'Avancé'] },
        { key: 'mode', label: 'Format', icon: Layers, type: 'select', options: ['En ligne', 'Présentiel'] }
    ],
    'Réparations': [
        { key: 'domain', label: 'Spécialité', icon: Wrench, type: 'text', placeholder: 'Plomberie, Mécanique, Froid...' },
        { key: 'travel', label: 'Déplacement', icon: Truck, type: 'select', options: ['Oui', 'Non', 'À définir'] }
    ],
    'Parfums': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Dior, Sauvage...' },
        { key: 'type', label: 'Type', icon: Sparkles, type: 'select', options: ['Eau de Parfum', 'Eau de Toilette', 'Huile'] },
        { key: 'authenticity', label: 'Authenticité', icon: ShieldCheck, type: 'select', options: ['Original', 'Générique/Copie'] }
    ],
    'Coiffure': [
        { key: 'service', label: 'Service', icon: Scissors, type: 'select', options: ['Tresses', 'Lissage', 'Coupe', 'Perruques'] },
        { key: 'place', label: 'Lieu', icon: Home, type: 'select', options: ['À domicile', 'Au salon'] }
    ],
    'Offres d\'emploi': [
        { key: 'contract', label: 'Contrat', icon: Briefcase, type: 'select', options: ['CDI', 'CDD', 'Stage', 'Freelance'] },
        { key: 'sector', label: 'Secteur', icon: Layers, type: 'text', placeholder: 'Commerce, BTP, Santé...' }
    ],
    'Demandes d\'emploi': [
        { key: 'exp', label: 'Expérience', icon: Star, type: 'select', options: ['Débutant', '1-3 ans', '3-5 ans', '+5 ans'] },
        { key: 'diploma', label: 'Diplôme', icon: GraduationCap, type: 'text', placeholder: 'Bac, Licence...' }
    ]
}

function SortableImage({ url, id, onRemove }: { url: string, id: string, onRemove: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    
    const style = { 
        transform: CSS.Transform.toString(transform), 
        transition,
        opacity: isDragging ? 0.5 : 1,
    }
  
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners} 
        // CORRECTION 1 : Suppression de 'touch-none' pour permettre le scroll par défaut
        className="relative w-24 h-24 bg-gray-100 rounded-2xl shrink-0 overflow-hidden border border-gray-200 group select-none shadow-sm"
      >
        <Image src={url} alt="" fill className="object-cover pointer-events-none" />
        
        <div className="absolute bottom-0 w-full bg-black/30 h-5 flex items-center justify-center pointer-events-none">
            <GripHorizontal className="text-white/80" size={12} />
        </div>

        <button 
            type="button" 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove() }} 
            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full z-10 hover:bg-red-500 transition active:scale-90"
        >
            <X size={12} />
        </button>
      </div>
    )
}

export default function PublierPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false) 
  const [isRephrasing, setIsRephrasing] = useState(false) 
  
  const [images, setImages] = useState<{ id: string, url: string }[]>([])
  
  const [isPro, setIsPro] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [adsCount, setAdsCount] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const visionInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '', price: '', description: '', category_id: '1', sub_category: '',
    location_island: 'Ngazidja', location_city: '', whatsapp_number: ''
  })

  const [specs, setSpecs] = useState<any>({})

  useEffect(() => {
      setSpecs({})
  }, [formData.sub_category])

  // --- CORRECTION SCROLL INTELLIGENT ---
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { 
        activationConstraint: { 
            delay: 250, // Il faut maintenir 250ms pour commencer à déplacer (Drag)
            tolerance: 8 // On augmente la tolérance pour permettre les petits mouvements de doigt
        } 
    })
  )

  const currentSubCats = SUB_CATEGORIES[parseInt(formData.category_id)] || []
  const currentSpecFields = SPECIFIC_FIELDS[formData.sub_category] || []

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase.from('profiles').select('is_pro, is_banned, phone_number').eq('id', user.id).single()
      setIsPro(profile?.is_pro || false)
      setIsBanned(profile?.is_banned || false)
      
      if (profile?.phone_number) {
        setFormData(prev => ({ ...prev, whatsapp_number: profile.phone_number }))
      }

      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setAdsCount(count || 0)
      
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  const addWatermark = (file: File): Promise<Blob> => {
      return new Promise((resolve) => {
          const img = new window.Image();
          img.src = URL.createObjectURL(file);
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              
              if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const text = "ComoresMarket";
                  const fontSize = Math.max(20, img.width * 0.05);
                  ctx.font = `900 ${fontSize}px Arial`;
                  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                  ctx.textAlign = "right";
                  ctx.textBaseline = "bottom";
                  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                  ctx.shadowBlur = 6;
                  ctx.shadowOffsetX = 3;
                  ctx.shadowOffsetY = 3;
                  const margin = img.width * 0.03;
                  ctx.fillText(text, canvas.width - margin, canvas.height - margin);
              }
              canvas.toBlob((blob) => {
                  if (blob) resolve(blob);
                  else resolve(file);
              }, 'image/webp', 0.85); 
          };
      });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const currentPhotoLimit = isPro ? PRO_PHOTOS_LIMIT : FREE_PHOTOS_LIMIT
    
    if (images.length + e.target.files.length > currentPhotoLimit) {
        toast.error(`Limite de ${currentPhotoLimit} photos atteinte.`, { icon: <Lock size={16}/> })
        return
    }
    
    setUploading(true)
    try {
      const newImages: { id: string, url: string }[] = []
      
      for (const file of Array.from(e.target.files)) {
          try {
              const compressedFile = await compressImage(file);
              const watermarkedBlob = await addWatermark(compressedFile);
              
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
              
              const { error } = await supabase.storage
                  .from('products')
                  .upload(fileName, watermarkedBlob, {
                      contentType: 'image/webp',
                      upsert: false
                  })
              
              if (!error) {
                  const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
                  newImages.push({ id: fileName, url: publicUrl })
              }
          } catch (innerErr) {
              console.error("Erreur image unique:", innerErr)
          }
      }
      
      setImages(prev => [...prev, ...newImages])
      if (newImages.length > 0) toast.success("Photos ajoutées !")
      
    } catch (error: any) { 
        toast.error('Erreur upload global.') 
    } finally { 
        setUploading(false) 
    }
  }

  const handleDragEnd = (event: any) => {
      const { active, over } = event
      if (active.id !== over.id) {
          setImages((items) => {
              const oldIndex = items.findIndex(i => i.id === active.id)
              const newIndex = items.findIndex(i => i.id === over.id)
              return arrayMove(items, oldIndex, newIndex)
          })
      }
  }

  const handleRephrase = async () => {
    if (!formData.description || formData.description.length < 5) {
      toast.error("Écrivez un début de texte.")
      return
    }
    setIsRephrasing(true)
    try {
      const res = await fetch('/api/rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formData.description }),
      })
      const data = await res.json()
      if (data.text) {
        const clean = data.text.replace(/\*\*/g, '').replace(/#/g, '').normalize("NFC")
        setFormData(prev => ({ ...prev, description: clean }))
        toast.success("Texte sublimé !")
      }
    } catch (err) { toast.error("Erreur reformulation.") } finally { setIsRephrasing(false) }
  }

  const handleVisionAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsGenerating(true)
    const compressedForAI = await compressImage(file);
    
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: reader.result }),
        })
        const data = await res.json()
        if (data.text) {
          const clean = data.text.replace(/\*\*/g, '').replace(/#/g, '').normalize("NFC")
          setFormData(prev => ({ ...prev, description: clean }))
          toast.success("Description générée !")
        }
      } catch (err) { toast.error("Erreur Vision.") } finally { setIsGenerating(false) }
    }
    reader.readAsDataURL(compressedForAI)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isBanned) return
    if (!formData.title || !formData.price || images.length === 0 || !formData.sub_category) {
        toast.error("Champs manquants.")
        return
    }

    setLoading(true)
    try {
      let finalDescription = formData.description;
      
      if (Object.keys(specs).length > 0) {
          let specsText = "\n\n--- ✨ CARACTÉRISTIQUES ---\n";
          currentSpecFields.forEach((field: any) => {
              if (specs[field.key]) {
                  specsText += `• ${field.label} : ${specs[field.key]}\n`;
              }
          });
          finalDescription += specsText;
      }

      const moderateRes = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, description: finalDescription }),
      })
      const check = await moderateRes.json()

      if (!check.is_safe) {
        toast.error(`Refusé : ${check.reason}`)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          const { error: productError } = await supabase.from('products').insert({
              ...formData,
              description: finalDescription,
              user_id: user.id,
              images: JSON.stringify(images.map(img => img.url)),
              quality_score: check.quality_score,
              sub_category: formData.sub_category 
          })

          if (!productError) {
              await supabase.from('notifications').insert({
                user_id: user.id,
                title: "Annonce en ligne",
                message: `Votre annonce "${formData.title}" est publiée.`,
                type: 'sentinel'
              })

              toast.success('Annonce publiée !')
              router.push('/')
          } else {
              throw productError
          }
      }
    } catch (err: any) { toast.error("Erreur lors de la publication.") } finally { setLoading(false) }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  if (isBanned) {
    return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <Ban size={32} className="text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2">Compte Suspendu</h1>
            <p className="text-gray-500 mb-6 text-sm font-medium">Contactez le support.</p>
        </div>
    )
  }

  const adsLimitReached = !isPro && adsCount >= FREE_ADS_LIMIT

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      <div className="bg-white px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center gap-3 pt-safe">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={24} /></button>
        <h1 className="font-extrabold text-xl text-gray-900">Publier</h1>
        <div className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{isPro ? <Crown size={12} className="text-yellow-600" /> : <Lock size={12} />}{adsCount} / {isPro ? '∞' : FREE_ADS_LIMIT}</div>
      </div>

      {adsLimitReached ? (
        <div className="p-6 mt-10 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600"><Lock size={32} /></div>
            <h2 className="text-xl font-black">Limite atteinte</h2>
            <p className="text-sm text-gray-500 font-medium">Vous avez atteint votre limite de {FREE_ADS_LIMIT} annonces gratuites.</p>
            <Link href="/pro" className="block w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg">Devenir Vendeur Élite 🚀</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-md mx-auto">
            {/* 1. PHOTOS (Scroll & Drag corrigés) */}
            <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                    <label className="text-sm font-bold text-gray-700">Photos (Maintenez pour déplacer)</label>
                    <span className="text-[10px] font-bold text-gray-400">{images.length} / {isPro ? PRO_PHOTOS_LIMIT : FREE_PHOTOS_LIMIT}</span>
                </div>
                
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={images.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                        {/* Container avec overflow-x-auto et touch-pan-x pour permettre le scroll */}
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide items-center touch-pan-x select-none">
                            <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center shrink-0 transition bg-gray-100 border-gray-300 cursor-pointer active:scale-95 hover:bg-gray-200/50">
                                {uploading ? <Loader2 className="animate-spin text-brand" /> : <Camera className="text-gray-400" />}
                            </div>
                            {images.map((img) => (
                                <SortableImage key={img.id} id={img.id} url={img.url} onRemove={() => setImages(items => items.filter(i => i.id !== img.id))} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
            </div>

            {/* 2. INFOS PRINCIPALES (Dark Inputs appliqués) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Titre</label>
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 border border-gray-200 focus-within:ring-2 focus-within:ring-brand/10 transition">
                        <Type size={18} className="text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full bg-transparent p-3 outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400" 
                            placeholder="iPhone 12 Pro..." 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                        />
                    </div>
                </div>
                
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Prix (KMF)</label>
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 border border-gray-200 focus-within:ring-2 focus-within:ring-brand/10 transition">
                        <DollarSign size={18} className="text-gray-400" />
                        <input 
                            type="number" 
                            className="w-full bg-transparent p-3 outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400" 
                            placeholder="150000" 
                            value={formData.price} 
                            onChange={e => setFormData({...formData, price: e.target.value})} 
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Catégorie</label>
                        <select 
                            className="w-full bg-gray-100 p-3 rounded-xl text-sm font-semibold text-gray-900 outline-none border border-gray-200" 
                            value={formData.category_id} 
                            onChange={e => setFormData({ ...formData, category_id: e.target.value, sub_category: '' })}
                        >
                            {CATEGORIES_LIST.map(cat => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Sous-catégorie</label>
                        <select 
                            className="w-full bg-gray-100 p-3 rounded-xl text-sm font-semibold text-gray-900 outline-none border border-gray-200" 
                            value={formData.sub_category} 
                            onChange={e => setFormData({ ...formData, sub_category: e.target.value })}
                        >
                            <option value="">Choisir...</option>
                            {currentSubCats.map((sub, idx) => (<option key={idx} value={sub}>{sub}</option>))}
                        </select>
                    </div>
                </div>

                {/* 3. CHAMPS INTELLIGENTS DYNAMIQUES */}
                {currentSpecFields.length > 0 && (
                    <div className="animate-in slide-in-from-top-2 fade-in pt-2 border-t border-dashed border-gray-100 mt-2">
                        <p className="text-xs font-black text-brand uppercase tracking-widest mb-3 flex items-center gap-1"><Sparkles size={12}/> Détails {formData.sub_category}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {currentSpecFields.map((field: any) => (
                                <div key={field.key} className={field.key === 'fuel' || field.key === 'storage' ? "col-span-2" : ""}>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1 block">{field.label}</label>
                                    <div className="flex items-center bg-gray-100 rounded-xl px-3 border border-gray-200 focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/10 transition">
                                        <field.icon size={16} className="text-gray-400 mr-2 shrink-0" />
                                        {field.type === 'select' ? (
                                            <select 
                                                className="w-full bg-transparent p-3 outline-none text-xs font-bold text-gray-900"
                                                value={specs[field.key] || ''}
                                                onChange={(e) => setSpecs({ ...specs, [field.key]: e.target.value })}
                                            >
                                                <option value="">Sélectionner...</option>
                                                {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type={field.type} 
                                                className="w-full bg-transparent p-3 outline-none text-xs font-bold text-gray-900 placeholder:text-gray-400" 
                                                placeholder={field.placeholder}
                                                value={specs[field.key] || ''}
                                                onChange={(e) => setSpecs({ ...specs, [field.key]: e.target.value })}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 4. LOCALISATION (Dark Inputs appliqués) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Île</label>
                        <select 
                            className="w-full bg-gray-100 rounded-xl p-3 text-sm font-semibold text-gray-900 border border-gray-200" 
                            value={formData.location_island} 
                            onChange={e => setFormData({...formData, location_island: e.target.value})}
                        >
                            <option>Ngazidja</option>
                            <option>Ndzouani</option>
                            <option>Mwali</option>
                            <option>Maore</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Ville</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-100 rounded-xl p-3 text-sm font-semibold text-gray-900 border border-gray-200 placeholder:text-gray-400" 
                            placeholder="Moroni" 
                            value={formData.location_city} 
                            onChange={e => setFormData({...formData, location_city: e.target.value})} 
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 flex justify-between font-sans">WhatsApp <Link href="/compte" className="text-[10px] text-brand hover:underline flex items-center gap-1 font-bold"><AlertCircle size={10} /> Modifier</Link></label>
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 border border-gray-200 opacity-80 cursor-not-allowed">
                        <Phone size={18} className="text-gray-400 mr-2" />
                        <input 
                            className="w-full bg-transparent p-3 outline-none text-sm font-bold text-gray-500" 
                            value={formData.whatsapp_number} 
                            readOnly 
                            disabled 
                        />
                        <Lock size={14} className="text-gray-400 ml-2" />
                    </div>
                </div>
            </div>

            {/* 5. DESCRIPTION */}
            <div className="space-y-2">
                <div className="flex justify-between items-center mb-1 px-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Description Prestige</label>
                    <div className="flex gap-2">
                    <button type="button" onClick={handleRephrase} disabled={isRephrasing} className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition-all active:scale-95">
                        {isRephrasing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Sublimer
                    </button>
                    <button type="button" onClick={() => visionInputRef.current?.click()} disabled={isGenerating} className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 transition-all active:scale-95">
                        {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
                        IA Photo
                    </button>
                    </div>
                    <input type="file" ref={visionInputRef} onChange={handleVisionAI} className="hidden" accept="image/*" />
                </div>
                <textarea 
                    className="w-full bg-gray-100 p-4 rounded-2xl shadow-sm border border-gray-100 text-sm font-medium min-h-40 outline-none focus:ring-2 focus:ring-brand/20 transition resize-none text-gray-900 placeholder:text-gray-400" 
                    placeholder="Décrivez votre produit avec élégance..." 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                />
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="text-amber-600 mt-0.5" size={20} />
            <div>
                <p className="text-amber-900 text-[10px] font-black uppercase tracking-tight">Audit Sentinelle Actif</p>
                <p className="text-amber-700/80 text-[10px] font-medium leading-tight mt-0.5">La conformité et le prestige de votre annonce sont vérifiés en temps réel.</p>
            </div>
            </div>

            <button type="submit" disabled={loading || isGenerating || isRephrasing} className="w-full bg-brand text-white font-bold py-5 rounded-2xl shadow-xl shadow-brand/30 hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
            {loading ? <Loader2 className="animate-spin" /> : "Publier l'annonce"}
            </button>
        </form>
      )}
    </div>
  )
}