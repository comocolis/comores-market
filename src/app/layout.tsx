import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from 'sonner';
import BottomNav from '@/components/BottomNav';
import InstallBanner from '@/components/InstallBanner';
import EliteAssistant from '@/components/EliteAssistant';
import SplashScreen from '@/components/SplashScreen';
import NativeFeatures from '@/components/NativeFeatures';
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL('https://comores-market.com'),
  
  // URL Canonique pour le SEO Google
  alternates: {
    canonical: '/',
  },

  title: {
    default: "Comores Market - Achat et Vente aux Comores",
    template: "%s | Comores Market"
  },
  description: "La première marketplace des Comores. Achetez et vendez voitures, immobilier, téléphones et bien plus à Ngazidja, Ndzouani, Mwali et Maore.",
  
  // Mots-clés pour le référencement
  keywords: ['Comores', 'Vente', 'Achat', 'Voiture', 'Immobilier', 'Occasion', 'Moroni', 'Mutsamudu', 'Fomboni', 'Mayotte', 'Annonces'],

  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://comores-market.com',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Comores Market' }],
  },

  // Règles pour les robots d'indexation (Google)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  manifest: '/manifest.json',
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Comores Market",
  },
  
  icons: {
    shortcut: '/favicon.ico',
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans min-h-dvh bg-gray-200 text-gray-900 antialiased overflow-y-auto">
        
        <NativeFeatures />
        <SplashScreen />

        {/* CADRE MOBILE : Centré sur PC, Plein écran sur Mobile */}
        <div className="relative w-full max-w-120 mx-auto min-h-dvh flex flex-col bg-[#F8FAFC] shadow-2xl shadow-black/10">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* Main Content */}
          {/* pb-24 est conservé pour que le contenu ne soit pas caché par le BottomNav */}
          <main className="flex-1 relative bg-[#F8FAFC] z-0 pb-24">
            {children}
          </main>

          <EliteAssistant />

          {/* DOCK DE NAVIGATION */}
          <div className="fixed bottom-0 z-50 left-1/2 -translate-x-1/2 w-full max-w-120 bg-[#F8FAFC] border-t border-gray-100">
              <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC]" />}>
                <BottomNav />
              </Suspense>
              {/* Espace pour la barre de geste (Safe Area) */}
              <div className="h-safe-bottom w-full bg-[#F8FAFC]" />
          </div>

        </div>
      </body>
    </html>
  );
}