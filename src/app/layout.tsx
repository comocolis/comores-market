import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import BottomNav from '@/components/BottomNav';
import InstallBanner from '@/components/InstallBanner';
import SplashScreen from '@/components/SplashScreen'; 
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

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
    // Configuration pour éviter le flash blanc sur iPhone
    startupImage: [
      {
        url: '/android-chrome-192x192.png',
      },
    ],
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
  themeColor: "#16a34a", // Couleur de la barre d'état mobile
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
    <html lang="fr">
      <head>
        {/* LE SECRET DU ZÉRO FLASH BLANC : 
            On injecte le CSS critique ici pour qu'il s'exécute AVANT le JS. */}
        <style>{`
          html, body { 
            background-color: #16a34a !important; 
            margin: 0; 
            padding: 0; 
          }
        `}</style>
      </head>
      <body className={`${inter.className} bg-[#16a34a] min-h-screen flex justify-center overflow-x-hidden`}>
        
        {/* 1. On affiche le Splash Screen en tout premier */}
        <SplashScreen />

        {/* 2. Le reste de l'application */}
        <InstallBanner />

        <div className="w-full max-w-md min-h-screen bg-white shadow-2xl relative">
          <Toaster richColors position="top-center" duration={3000} />
          
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>

          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}