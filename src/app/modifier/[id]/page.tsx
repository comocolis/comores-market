'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image' 
import { 
  Camera, Loader2, DollarSign, Type, X, ChevronLeft, Lock, Crown, 
  Phone, Ban, Sparkles, ShieldCheck, GripHorizontal,
  Calendar, Gauge, Fuel, HardDrive, Home, Maximize, Layers,
  Ruler, Shirt, Briefcase, Zap, Scissors, Truck, Anchor, Watch, Gem, 
  Music, Book, Plane, Utensils, Wrench, GraduationCap, Clock, 
  MapPin, Star, AlertCircle, Save, PenTool
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { compressImage } from '@/utils/compressImage'
import { containsContactInfo } from '@/utils/contentSafety'
// AJOUT : Import du tracking analytics
import { trackEvent } from '@/lib/analytics'

const FREE_PHOTOS_LIMIT = 3
const PRO_PHOTOS_LIMIT = 10

const CATEGORIES_LIST = [
  { id: 1, label: 'Véhicules' }, { id: 2, label: 'Immobilier' }, { id: 3, label: 'Mode' },
  { id: 4, label: 'Tech' }, { id: 5, label: 'Maison' }, { id: 6, label: 'Loisirs' },
  { id: 7, label: 'Alimentation' }, { id: 8, label: 'Services' }, { id: 9, label: 'Beauté' }, { id: 10, label: 'Emploi' },
]

const SUB_CATEGORIES: { [key: number]: string[] } = {
  1: ['Voitures', 'Motos & Scooters', 'Pièces Détachées', 'Location Véhicules', 'Camions & Poids Lourds', 'Bateaux & Nautisme', 'Engins BTP', 'Vélos & Trottinettes'],
  2: ['Vente Maison', 'Vente Terrain', 'Vente Appartement', 'Location Maison', 'Location Appartement', 'Bureaux & Commerces', 'Location Vacances', 'Terrains Agricoles', 'Colocation'],
  3: ['Vêtements Homme', 'Vêtements Femme', 'Enfant & Bébé', 'Chaussures', 'Montres & Bijoux', 'Sacs & Accessoires', 'Mariage & Tradition', 'Lingerie', 'Sportswear'],
  4: ['Téléphones', 'Tablettes', 'Ordinateurs', 'TV & Home Cinéma', 'Audio & Son', 'Appareils Photo', 'Accessoires Info', 'Consoles & Jeux', 'Objets Connectés'],
  5: ['Meubles', 'Décoration', 'Électroménager', 'Bricolage', 'Jardin & Plantes', 'Linge de maison', 'Arts de la table', 'Animaux'],
  6: ['Sports', 'Instruments de musique', 'Livres & Papeterie', 'Jeux & Jouets', 'Voyages & Billets', 'Chasse & Pêche', 'Collections'],
  7: ['Fruits & Légumes', 'Plats cuisinés', 'Épicerie', 'Boissons', 'Produits frais', 'Épices & Vanille', 'Miel & Confitures', 'Pâtisserie'],
  8: ['Cours & Formations', 'Réparations', 'Déménagement', 'Événements', 'Ménage & Aide', 'Transport & Logistique', 'Couture & Retouches', 'Santé & Bien-être'],
  9: ['Parfums', 'Maquillage', 'Soins Visage & Corps', 'Coiffure', 'Matériel Pro', 'Onglerie', 'Hygiène'],
  10: ['Offres d\'emploi', 'Demandes d\'emploi', 'Stages', 'Intérim', 'Freelance'],
}

const SPECIFIC_FIELDS: Record<string, any[]> = {
    // === 1. VÉHICULES ===
    'Voitures': [
        { key: 'year', label: 'Année', icon: Calendar, type: 'number', placeholder: 'Ex: 2018' },
        { key: 'mileage', label: 'Kilométrage', icon: Gauge, type: 'number', placeholder: 'Ex: 85000' },
        { key: 'fuel', label: 'Carburant', icon: Fuel, type: 'select', options: ['Essence', 'Diesel', 'Hybride', 'Électrique'] },
        { key: 'transmission', label: 'Boîte', icon: Layers, type: 'select', options: ['Manuelle', 'Automatique'] }
    ],
    'Motos & Scooters': [
        { key: 'year', label: 'Année', icon: Calendar, type: 'number', placeholder: '2020' },
        { key: 'mileage', label: 'Kilométrage', icon: Gauge, type: 'number', placeholder: '15000' },
        { key: 'cc', label: 'Cylindrée (cc)', icon: Zap, type: 'number', placeholder: '125' }
    ],
    'Camions & Poids Lourds': [
        { key: 'tonnage', label: 'Tonnage', icon: Truck, type: 'number', placeholder: 'Ex: 3.5' },
        { key: 'year', label: 'Année', icon: Calendar, type: 'number', placeholder: '2015' },
        { key: 'fuel', label: 'Carburant', icon: Fuel, type: 'select', options: ['Diesel', 'Essence'] }
    ],
    'Bateaux & Nautisme': [
        { key: 'type', label: 'Type', icon: Anchor, type: 'select', options: ['Vedette', 'Barque', 'Boutre', 'Moteur Hors-bord', 'Jet-ski'] },
        { key: 'length', label: 'Longueur (m)', icon: Ruler, type: 'number', placeholder: 'Ex: 7' }
    ],
    'Engins BTP': [
        { key: 'type', label: 'Type', icon: Truck, type: 'text', placeholder: 'Tractopelle, Grue...' },
        { key: 'hours', label: 'Heures', icon: Clock, type: 'number', placeholder: 'Ex: 5000' }
    ],
    'Pièces Détachées': [
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf', 'Occasion', 'Reconditionné'] },
        { key: 'compatibility', label: 'Compatible avec', icon: Wrench, type: 'text', placeholder: 'Ex: Toyota Yaris 2010...' }
    ],

    // === 2. IMMOBILIER ===
    'Vente Maison': [
        { key: 'surface', label: 'Surface (m²)', icon: Maximize, type: 'number', placeholder: '120' },
        { key: 'rooms', label: 'Pièces', icon: Home, type: 'number', placeholder: '4' },
        { key: 'titre', label: 'Papier/Titre', icon: ShieldCheck, type: 'select', options: ['Titré/Borné', 'Papier Comorien', 'En cours', 'Non titré'] }
    ],
    'Vente Appartement': [
        { key: 'surface', label: 'Surface (m²)', icon: Maximize, type: 'number', placeholder: '80' },
        { key: 'rooms', label: 'Pièces', icon: Home, type: 'number', placeholder: '3' },
        { key: 'floor', label: 'Étage', icon: Layers, type: 'number', placeholder: '2' }
    ],
    'Vente Terrain': [
        { key: 'surface', label: 'Surface (m²)', icon: Maximize, type: 'number', placeholder: '500' },
        { key: 'titre', label: 'Papier/Titre', icon: ShieldCheck, type: 'select', options: ['Titré/Borné', 'Papier Comorien', 'En cours', 'Non titré'] },
        { key: 'access', label: 'Accès Voiture', icon: Truck, type: 'select', options: ['Oui', 'Non', 'Piste'] }
    ],
    'Terrains Agricoles': [
        { key: 'surface', label: 'Surface (m²)', icon: Maximize, type: 'number', placeholder: '10000' },
        { key: 'water', label: 'Accès Eau', icon: Zap, type: 'select', options: ['Oui', 'Non', 'Rivière proche'] }
    ],
    'Location Maison': [
        { key: 'rooms', label: 'Chambres', icon: Home, type: 'number', placeholder: '3' },
        { key: 'furnished', label: 'Meublé', icon: Layers, type: 'select', options: ['Oui', 'Non', 'Partiellement'] },
        { key: 'period', label: 'Paiement', icon: Calendar, type: 'select', options: ['Mensuel', 'Journalier'] }
    ],
    'Location Appartement': [
        { key: 'rooms', label: 'Chambres', icon: Home, type: 'number', placeholder: '2' },
        { key: 'furnished', label: 'Meublé', icon: Layers, type: 'select', options: ['Oui', 'Non', 'Partiellement'] }
    ],
    'Location Vacances': [
        { key: 'capacity', label: 'Capacité (pers)', icon: Home, type: 'number', placeholder: '4' },
        { key: 'wifi', label: 'Wifi', icon: Zap, type: 'select', options: ['Oui', 'Non'] }
    ],
    'Bureaux & Commerces': [
        { key: 'surface', label: 'Surface (m²)', icon: Maximize, type: 'number', placeholder: '50' },
        { key: 'location', label: 'Emplacement', icon: MapPin, type: 'select', options: ['Bord de route', 'Centre-ville', 'Quartier calme'] }
    ],

    // === 3. MODE ===
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
    'Mariage & Tradition': [
        { key: 'type', label: 'Type', icon: Star, type: 'select', options: ['Robe Mariée', 'Tenue Traditionnelle', 'Costume', 'Accessoires'] },
        { key: 'rental', label: 'Location/Vente', icon: DollarSign, type: 'select', options: ['Vente', 'Location'] }
    ],
    'Montres & Bijoux': [
        { key: 'material', label: 'Matière', icon: Gem, type: 'select', options: ['Or', 'Argent', 'Acier', 'Cuir', 'Plaqué', 'Fantaisie'] },
        { key: 'brand', label: 'Marque', icon: Watch, type: 'text', placeholder: 'Rolex, Seiko, Casio...' }
    ],

    // === 4. TECH ===
    'Téléphones': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Samsung, Apple, Huawei...' },
        { key: 'storage', label: 'Stockage', icon: HardDrive, type: 'select', options: ['32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To'] },
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf (Scellé)', 'Comme neuf', 'Bon état', 'Écran fissuré'] }
    ],
    'Tablettes': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'iPad, Samsung...' },
        { key: 'screen', label: 'Taille écran', icon: Maximize, type: 'text', placeholder: '10 pouces...' },
        { key: 'storage', label: 'Stockage', icon: HardDrive, type: 'select', options: ['32 Go', '64 Go', '128 Go', '256 Go'] }
    ],
    'Ordinateurs': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'HP, Dell, Apple...' },
        { key: 'processor', label: 'Processeur', icon: Zap, type: 'text', placeholder: 'Core i5, Ryzen 7...' },
        { key: 'ram', label: 'RAM', icon: Layers, type: 'select', options: ['4 Go', '8 Go', '16 Go', '32 Go'] }
    ],
    'TV & Home Cinéma': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Samsung, LG, Sony...' },
        { key: 'size', label: 'Taille (Pouces)', icon: Maximize, type: 'number', placeholder: '55' },
        { key: 'smart', label: 'Smart TV', icon: Zap, type: 'select', options: ['Oui', 'Non'] }
    ],
    'Consoles & Jeux': [
        { key: 'platform', label: 'Plateforme', icon: Zap, type: 'select', options: ['PS5', 'PS4', 'Xbox', 'Switch', 'PC'] },
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf', 'Occasion'] }
    ],

    // === 5. MAISON ===
    'Meubles': [
        { key: 'material', label: 'Matière', icon: Layers, type: 'text', placeholder: 'Bois rouge, Métal, Verre...' },
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf', 'Très bon état', 'Bon état'] }
    ],
    'Électroménager': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Samsung, LG, Hisense...' },
        { key: 'energy', label: 'Conso', icon: Zap, type: 'select', options: ['Faible consommation', 'Normale'] }
    ],
    'Animaux': [
        { key: 'type', label: 'Type', icon: Star, type: 'text', placeholder: 'Chien, Chat, Mouton, Cabri...' },
        { key: 'age', label: 'Âge', icon: Clock, type: 'text', placeholder: '2 mois, 1 an...' }
    ],

    // === 6. LOISIRS ===
    'Instruments de musique': [
        { key: 'type', label: 'Instrument', icon: Music, type: 'text', placeholder: 'Guitare, Piano...' },
        { key: 'condition', label: 'État', icon: Sparkles, type: 'select', options: ['Neuf', 'Occasion'] }
    ],
    'Livres & Papeterie': [
        { key: 'genre', label: 'Genre', icon: Book, type: 'text', placeholder: 'Roman, Scolaire, Religion...' },
        { key: 'lang', label: 'Langue', icon: Type, type: 'select', options: ['Français', 'Arabe', 'Anglais', 'Shikomori'] }
    ],
    'Voyages & Billets': [
        { key: 'dest', label: 'Destination', icon: Plane, type: 'text', placeholder: 'Dubaï, Tanzanie, France...' },
        { key: 'date', label: 'Départ prévu', icon: Calendar, type: 'text', placeholder: 'JJ/MM/AAAA' }
    ],

    // === 7. ALIMENTATION ===
    'Fruits & Légumes': [
        { key: 'origin', label: 'Origine', icon: MapPin, type: 'select', options: ['Local (Comores)', 'Importé'] },
        { key: 'unit', label: 'Vendu par', icon: DollarSign, type: 'select', options: ['Kilo', 'Tas', 'Sac', 'Carton'] }
    ],
    'Épices & Vanille': [
        { key: 'type', label: 'Produit', icon: Sparkles, type: 'text', placeholder: 'Vanille, Girofle, Poivre...' },
        { key: 'quality', label: 'Qualité', icon: Star, type: 'select', options: ['Premium', 'Standard', 'Vrac'] }
    ],
    'Plats cuisinés': [
        { key: 'type', label: 'Type', icon: Utensils, type: 'select', options: ['Salé', 'Sucré', 'Traiteur', 'Gâteaux'] },
        { key: 'availability', label: 'Dispo', icon: Clock, type: 'select', options: ['Sur commande', 'Immédiat'] }
    ],
    'Produits frais': [
        { key: 'preservation', label: 'Conservation', icon: Lock, type: 'select', options: ['Frais', 'Congelé', 'Séché'] }
    ],

    // === 8. SERVICES ===
    'Cours & Formations': [
        { key: 'level', label: 'Niveau', icon: GraduationCap, type: 'select', options: ['Débutant', 'Intermédiaire', 'Avancé'] },
        { key: 'mode', label: 'Format', icon: Layers, type: 'select', options: ['En ligne', 'Présentiel'] }
    ],
    'Réparations': [
        { key: 'domain', label: 'Spécialité', icon: Wrench, type: 'text', placeholder: 'Plomberie, Mécanique, Froid...' },
        { key: 'travel', label: 'Déplacement', icon: Truck, type: 'select', options: ['Oui', 'Non', 'À définir'] }
    ],
    'Transport & Logistique': [
        { key: 'type', label: 'Type', icon: Truck, type: 'select', options: ['Déménagement', 'Livraison Colis', 'Taxi', 'Fret'] },
        { key: 'zone', label: 'Zone', icon: MapPin, type: 'text', placeholder: 'Moroni, Toute l\'île...' }
    ],

    // === 9. BEAUTÉ ===
    'Parfums': [
        { key: 'brand', label: 'Marque', icon: Type, type: 'text', placeholder: 'Dior, Sauvage...' },
        { key: 'type', label: 'Type', icon: Sparkles, type: 'select', options: ['Eau de Parfum', 'Eau de Toilette', 'Huile', 'Encens/Oud'] },
        { key: 'authenticity', label: 'Authenticité', icon: ShieldCheck, type: 'select', options: ['Original', 'Générique/Copie'] }
    ],
    'Coiffure': [
        { key: 'service', label: 'Service', icon: Scissors, type: 'select', options: ['Tresses', 'Lissage', 'Coupe', 'Perruques', 'Barbe'] },
        { key: 'place', label: 'Lieu', icon: Home, type: 'select', options: ['À domicile', 'Au salon'] }
    ],
    'Onglerie': [
        { key: 'type', label: 'Prestation', icon: Sparkles, type: 'select', options: ['Pose Gel', 'Semi-permanent', 'Manucure simple'] }
    ],

    // === 10. EMPLOI ===
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

export default function ModifierPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isRephrasing, setIsRephrasing] = useState(false) 
  
  const [images, setImages] = useState<{ id: string, url: string }[]>([])
  
  const [isPro, setIsPro] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '', price: '', description: '', category_id: '1', sub_category: '',
    location_island: 'Ngazidja', location_city: '', whatsapp_number: ''
  })

  // AJOUT : Gestion de l'option "Autre"
  const [customSubCat, setCustomSubCat] = useState('')

  const [specs, setSpecs] = useState<Record<string, string>>({})

  // Reset de l'option perso si on change de catégorie
  useEffect(() => {
      setCustomSubCat('')
      // On ne reset pas formData.sub_category ici car cela écraserait le chargement initial
  }, [formData.category_id])

  // Capteurs Drag & Drop
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  const currentSubCats = SUB_CATEGORIES[parseInt(formData.category_id)] || []
  const currentSpecFields = (SPECIFIC_FIELDS && SPECIFIC_FIELDS[formData.sub_category]) || []

  // 1. CHARGEMENT DES DONNÉES
  useEffect(() => {
    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth'); return }

        const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
        setIsPro(profile?.is_pro || false)

        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', params.id)
            .single()

        if (error || !product) {
            toast.error("Annonce introuvable")
            router.push('/')
            return
        }

        if (product.user_id !== user.id) {
            toast.error("Vous ne pouvez pas modifier cette annonce")
            router.push('/')
            return
        }

        // LOGIQUE POUR DÉTECTER SI C'EST UNE SOUS-CATÉGORIE "AUTRE"
        const categoryId = product.category_id || '1';
        const existingSub = product.sub_category || '';
        const allowedSubs = SUB_CATEGORIES[parseInt(categoryId)] || [];
        
        let subCategoryToSet = existingSub;
        let customSubToSet = '';

        // Si la sous-catégorie enregistrée n'est pas dans la liste officielle, c'est une perso
        if (existingSub && !allowedSubs.includes(existingSub)) {
            subCategoryToSet = 'Autre';
            customSubToSet = existingSub;
        }

        setFormData({
            title: product.title,
            price: product.price.toString(),
            description: product.description, 
            category_id: categoryId.toString(),
            sub_category: subCategoryToSet,
            location_island: product.location_island,
            location_city: product.location_city,
            whatsapp_number: product.whatsapp_number
        })
        setCustomSubCat(customSubToSet);

        // Gestion des images
        try {
            const rawImages = JSON.parse(product.images)
            if (Array.isArray(rawImages)) {
                setImages(rawImages.map((url: string) => ({ id: url, url: url })))
            }
        } catch (e) {
            if (product.images) setImages([{ id: product.images, url: product.images }])
        }

        setLoading(false)
    }

    loadData()
  }, [router, supabase, params.id])


  // 2. LOGIQUE IMAGES
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.price || images.length === 0 || !formData.sub_category) {
        toast.error("Champs manquants.")
        return
    }

    // --- GESTION SOUS-CATÉGORIE PERSO ---
    let finalSubCategory = formData.sub_category;
    if (finalSubCategory === 'Autre') {
        if (!customSubCat.trim()) {
            toast.error("Veuillez préciser la sous-catégorie.")
            return
        }
        finalSubCategory = customSubCat.trim()
    }

    if (!isPro && containsContactInfo(formData.description)) {
        toast.error("⚠️ Seuls les Pros peuvent partager un contact dans la description.", { duration: 5000 })
        return; 
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

      // MODÉRATION
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

      const { error } = await supabase
        .from('products')
        .update({
            title: formData.title,
            price: formData.price,
            description: finalDescription,
            category_id: formData.category_id,
            sub_category: finalSubCategory, // Utilisation de la valeur corrigée
            location_island: formData.location_island,
            location_city: formData.location_city,
            images: JSON.stringify(images.map(img => img.url)),
            quality_score: check.quality_score
        })
        .eq('id', params.id)

      if (error) throw error

      // 📊 TRACKING : Envoi de l'événement de mise à jour à GA4
      trackEvent('listing_updated', {
          listing_id: params.id,
          title: formData.title,
          category: CATEGORIES_LIST.find(c => c.id.toString() === formData.category_id)?.label,
          price: parseInt(formData.price)
      })

      toast.success("Annonce mise à jour !")
      router.push(`/annonce/${params.id}`)

    } catch (err: any) { 
        toast.error("Erreur lors de la mise à jour.") 
        console.error(err)
    } finally { 
        setLoading(false) 
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-transparent"><Loader2 className="animate-spin text-brand" /></div>

  return (
    // BG TRANSPARENT
    <div className="min-h-screen bg-transparent font-sans pb-24">
      <div className="bg-white px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center gap-3 pt-safe">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={24} /></button>
        <h1 className="font-extrabold text-xl text-gray-900">Modifier</h1>
        <div className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {isPro ? <Crown size={12} className="text-yellow-600" /> : <Lock size={12} />}
            {images.length} / {isPro ? PRO_PHOTOS_LIMIT : FREE_PHOTOS_LIMIT}
        </div>
      </div>

      <form onSubmit={handleUpdate} className="p-4 space-y-6 max-w-md mx-auto">
            {/* 1. PHOTOS */}
            <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                    <label className="text-sm font-bold text-gray-700">Photos (Maintenez pour déplacer)</label>
                </div>
                
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={images.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide items-center touch-pan-x select-none">
                            <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center shrink-0 transition bg-gray-100 border-gray-300 cursor-pointer active:scale-95 hover:bg-gray-200/50">
                                {uploading ? <Loader2 className="animate-spin text-brand" /> : <Camera className="text-gray-500" />}
                            </div>
                            {images.map((img) => (
                                <SortableImage key={img.id} id={img.id} url={img.url} onRemove={() => setImages(items => items.filter(i => i.id !== img.id))} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
            </div>

            {/* 2. INFOS PRINCIPALES */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Titre</label>
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 border border-gray-200 focus-within:ring-2 focus-within:ring-brand/10 transition">
                        <Type size={18} className="text-gray-500" />
                        <input 
                            type="text" 
                            className="w-full bg-transparent p-3 outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-500" 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                        />
                    </div>
                </div>
                
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Prix (KMF)</label>
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 border border-gray-200 focus-within:ring-2 focus-within:ring-brand/10 transition">
                        <span className="text-gray-500 font-black text-xs px-2">KMF</span>
                        <input 
                            type="number" 
                            className="w-full bg-transparent p-3 outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-500" 
                            value={formData.price} 
                            onChange={e => setFormData({...formData, price: e.target.value})} 
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Catégorie</label>
                        <select 
                            className="w-full bg-gray-100 p-3 rounded-xl text-sm font-semibold text-gray-900 outline-none border border-gray-200" 
                            value={formData.category_id} 
                            onChange={e => setFormData({ ...formData, category_id: e.target.value, sub_category: '' })}
                        >
                            {CATEGORIES_LIST.map(cat => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Sous-catégorie</label>
                        <select 
                            className="w-full bg-gray-100 p-3 rounded-xl text-sm font-semibold text-gray-900 outline-none border border-gray-200" 
                            value={formData.sub_category} 
                            onChange={e => setFormData({ ...formData, sub_category: e.target.value })}
                        >
                            <option value="">Choisir...</option>
                            {currentSubCats.map((sub, idx) => (<option key={idx} value={sub}>{sub}</option>))}
                            <option value="Autre">Autre (Préciser...)</option>
                        </select>
                    </div>
                </div>

                {/* CHAMP MAGIQUE "AUTRE" */}
                {formData.sub_category === 'Autre' && (
                    <div className="animate-in slide-in-from-top-2 fade-in">
                        <label className="text-xs font-bold text-brand uppercase ml-1 mb-1 block">Précisez la sous-catégorie</label>
                        <div className="flex items-center bg-white rounded-xl px-3 border-2 border-brand/20 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10 transition">
                            <PenTool size={18} className="text-brand mr-2" />
                            <input 
                                type="text" 
                                className="w-full bg-transparent p-3 outline-none text-sm font-bold text-gray-900 placeholder:text-gray-500" 
                                placeholder="Ex: Drone, Tondeuse..." 
                                value={customSubCat} 
                                onChange={e => setCustomSubCat(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* 3. CHAMPS INTELLIGENTS DYNAMIQUES */}
                {currentSpecFields.length > 0 && formData.sub_category !== 'Autre' && (
                    <div className="animate-in slide-in-from-top-2 fade-in pt-2 border-t border-dashed border-gray-100 mt-2">
                        <p className="text-xs font-black text-brand uppercase tracking-widest mb-3 flex items-center gap-1"><Sparkles size={12}/> Détails {formData.sub_category}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {currentSpecFields.map((field: any) => (
                                <div key={field.key} className={field.key === 'fuel' || field.key === 'storage' ? "col-span-2" : ""}>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">{field.label}</label>
                                    <div className="flex items-center bg-gray-100 rounded-xl px-3 border border-gray-200 focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/10 transition">
                                        <field.icon size={16} className="text-gray-500 mr-2 shrink-0" />
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
                                                className="w-full bg-transparent p-3 outline-none text-xs font-bold text-gray-900 placeholder:text-gray-500" 
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

            {/* 4. LOCALISATION */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Île</label>
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
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Ville</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-100 rounded-xl p-3 text-sm font-semibold text-gray-900 border border-gray-200 placeholder:text-gray-500" 
                            placeholder="Moroni" 
                            value={formData.location_city} 
                            onChange={e => setFormData({...formData, location_city: e.target.value})} 
                        />
                    </div>
                </div>
            </div>

            {/* 5. DESCRIPTION */}
            <div className="space-y-2">
                <div className="flex justify-between items-center mb-1 px-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <div className="flex gap-2">
                    <button type="button" onClick={handleRephrase} disabled={isRephrasing} className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition-all active:scale-95">
                        {isRephrasing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Sublimer
                    </button>
                    </div>
                </div>
                <textarea 
                    className="w-full bg-gray-100 p-4 rounded-2xl shadow-sm border border-gray-100 text-sm font-medium min-h-40 outline-none focus:ring-2 focus:ring-brand/20 transition resize-none text-gray-900 placeholder:text-gray-500" 
                    placeholder="Décrivez votre produit..." 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                />
            </div>

            <button type="submit" disabled={loading || isRephrasing} className="w-full bg-brand text-white font-bold py-5 rounded-2xl shadow-xl shadow-brand/30 hover:bg-brand-dark transition transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Mettre à jour</>}
            </button>
        </form>
    </div>
  )
}