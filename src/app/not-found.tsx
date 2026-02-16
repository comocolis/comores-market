import NotFoundContent from '@/components/NotFoundContent'

// Cette ligne est la clé pour corriger votre erreur de build
export const dynamic = 'force-static'

export default function NotFound() {
  return <NotFoundContent />
}