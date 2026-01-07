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
  title: {
    default: "Comores Market - Achat et Vente aux Comores",
    template: "%s | Comores Market"
  },
  description: "La première marketplace des Comores. Voitures, Immobilier, Téléphones.",
  
  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://comores-market.com',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Comores Market' }],
  },
  
  manifest: '/manifest.json',
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comores Market",
  },
  
  icons: {
    shortcut: '/favicon.ico',
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
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
      {/* bg-gray-200 : Sur PC, on voit un fond gris foncé autour de l'app.
          min-h-dvh : Hauteur dynamique.
      */}
      <body className="font-sans min-h-dvh bg-gray-200 text-gray-900 antialiased overflow-y-auto">
        
        <NativeFeatures />
        <SplashScreen />

        {/* LE CADRE DU TÉLÉPHONE 
            relative : Sert de repère pour le contenu absolu interne.
            max-w-120 : Limite la largeur à environ 480px (taille mobile).
            mx-auto : Centre le cadre sur l'écran PC.
            shadow-2xl : Donne un effet de profondeur sur PC.
        */}
        <div className="relative w-full max-w-120 mx-auto min-h-dvh flex flex-col bg-[#F8FAFC] shadow-2xl shadow-black/10">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          <main className="flex-1 relative bg-[#F8FAFC] z-0">
            {children}
          </main>

          <EliteAssistant />

          {/* NAVIGATION DU BAS (CORRIGÉE PC)
              fixed : Reste en bas de l'écran.
              bottom-0 : Collé en bas.
              left-1/2 -translate-x-1/2 : Centré horizontalement par rapport à la fenêtre PC.
              w-full max-w-120 : Force la largeur à respecter celle du téléphone (pas d'étirement).
          */}
          <div className="fixed bottom-0 z-50 left-1/2 -translate-x-1/2 w-full max-w-120 bg-[#F8FAFC] border-t border-gray-100">
             <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC]" />}>
               <BottomNav />
             </Suspense>
             {/* Padding pour la barre de geste (Safe Area) */}
             <div className="h-safe-bottom w-full bg-[#F8FAFC]" />
          </div>

        </div>
      </body>
    </html>
  );
}