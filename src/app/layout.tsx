import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import BottomNav from '@/components/BottomNav';
import InstallBanner from '@/components/InstallBanner';
import EliteAssistant from '@/components/EliteAssistant';
import SplashScreen from '@/components/SplashScreen'; // NOUVEL IMPORT
import { Suspense } from "react";

// OPTIMISATION : display: 'swap' pour affichage immédiat du texte
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://comores-market.com'),
  title: {
    default: "Comores Market - Achat et Vente aux Comores",
    template: "%s | Comores Market"
  },
  description: "La première marketplace des Comores. Voitures, Immobilier, Téléphones. Vendez et achetez en toute sécurité à Ngazidja, Ndzouani et Mwali.",
  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://comores-market.com',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comores Market",
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff", // Mis à jour pour matcher le splash screen blanc
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      {/* 1. bg-gray-200 : Fond de bureau pour faire ressortir l'app
        2. flex justify-center : Centre l'application au milieu de l'écran
      */}
      <body 
        className={`${inter.className} bg-gray-200 min-h-screen flex justify-center overflow-y-scroll font-sans`}
      >
        {/* SPLASH SCREEN ANIMÉ : S'affiche au-dessus de tout au chargement */}
        <SplashScreen />

        {/* LE CONTENEUR MOBILE :
          - max-w-[480px] : Largeur fixe mobile
          - shadow-2xl : Effet de profondeur
          - relative : Pour positionner les éléments internes
        */}
        <div className="w-full max-w-[480px] min-h-screen bg-[#F8FAFC] shadow-2xl relative flex flex-col shadow-black/10">
          
          {/* Bannière PWA (Intégrée dans le flux mobile) */}
          <InstallBanner />

          {/* Notifications Toast */}
          <Toaster richColors position="top-center" duration={3000} />
          
          <main className="flex-1 relative">
            {children}
          </main>

          {/* L'assistant Elite CM */}
          <EliteAssistant />

          {/* Navigation du bas */}
          <Suspense fallback={<div className="h-20 w-full bg-white border-t border-gray-50" />}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}