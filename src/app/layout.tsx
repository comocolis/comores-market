import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import BottomNav from '@/components/BottomNav' // <--- 1. IMPORTER LE COMPOSANT

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Comores Market',
  description: 'Vente et achat aux Comores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" />
        <BottomNav /> {/* <--- 2. L'AJOUTER ICI, JUSTE AVANT LA FIN DU BODY */}
      </body>
    </html>
  )
}