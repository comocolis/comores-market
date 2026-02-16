import FavorisClient from './FavorisClient'

// C'est cette ligne (Serveur) qui a besoin d'être isolée ici
// export const dynamic = 'force-dynamic'

export default function FavorisPage() {
  return <FavorisClient />
}