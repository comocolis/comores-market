import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import BottomNav from '@/components/BottomNav';
import InstallBanner from '@/components/InstallBanner';
import EliteAssistant from '@/components/EliteAssistant';
import { Suspense } from "react";

// OPTIMISATION : display: 'swap' permet d'afficher le texte immédiatement 
// avec une police système en attendant que Inter soit chargée, 
// ce qui est crucial pour la perception de vitesse aux Comores.
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
    <html lang="fr" suppressHydrationWarning>
      <body 
        className={`${inter.className} bg-gray-100 min-h-screen flex justify-center overflow-x-hidden font-sans`}
      >
        {/* Bannière d'installation PWA */}
        <InstallBanner />

        <div className="w-full max-w-md min-h-screen bg-white shadow-2xl relative flex flex-col">
          {/* Notifications Toast en haut pour une visibilité maximale */}
          <Toaster richColors position="top-center" duration={3000} />
          
          <main className="flex-1">
            {children}
          </main>

          {/* L'assistant Elite CM : support client permanent */}
          <EliteAssistant />

          {/* OPTIMISATION : Le fallback du Suspense simule la hauteur de la barre 
            pour éviter le saut de mise en page (Layout Shift) lors du chargement.
          */}
          <Suspense fallback={<div className="h-16 w-full bg-white border-t border-gray-50" />}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}