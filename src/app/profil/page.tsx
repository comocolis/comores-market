
import { Metadata } from 'next'
import ProfileClient from './ProfileClient'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Profil Utilisateur | Comores Market',
  description: 'Profil du vendeur sur Comores Market',
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div></div>}>
      <ProfileClient />
    </Suspense>
  )
}
