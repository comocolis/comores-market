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
    // AJOUT : Image de démarrage pour iOS pour éviter l'écran blanc
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
  themeColor: "#16a34a",
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
      {/* CRUCIAL : On ajoute bg-[#16a34a] sur le body. 
          Si le JS met du temps à charger, le fond sera vert par défaut au lieu de blanc.
      */}
      <body className={`${inter.className} bg-[#16a34a] min-h-screen flex justify-center overflow-x-hidden`}>
        
        <SplashScreen />

        <InstallBanner />

        {/* On garde le fond blanc uniquement pour le conteneur de l'application.
            On remet bg-gray-50 sur le <main> pour le design habituel.
        */}
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