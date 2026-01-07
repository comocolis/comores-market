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
  description: "La première marketplace des Comores. Voitures, Immobilier, Téléphones. Vendez et achetez en toute sécurité à Ngazidja, Ndzouani et Mwali.",
  
  // OPTIMISATION SEO & PARTAGE
  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://comores-market.com',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
    images: [
      {
        url: '/logo.png', // Image utilisée pour les partages WhatsApp/Facebook
        width: 512,
        height: 512,
        alt: 'Comores Market',
      },
    ],
  },

  manifest: '/manifest.json',
  
  // OPTIMISATION GOOGLE SEARCH (Icônes HD)
  icons: {
    shortcut: '/favicon.ico',
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      // C'est cette ligne que Google utilise pour afficher le logo dans les résultats
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
      <body className="font-sans min-h-dvh bg-[#F8FAFC] text-gray-900 antialiased overflow-y-auto">
        
        <NativeFeatures />
        <SplashScreen />

        {/* Conteneur Principal Standard */}
        <div className="relative w-full max-w-120 mx-auto min-h-dvh flex flex-col bg-[#F8FAFC] shadow-2xl shadow-black/5">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* Contenu principal */}
          <main className="flex-1 relative z-0">
            {children}
          </main>

          <EliteAssistant />

          {/* Navigation standard en bas */}
          <div className="sticky bottom-0 z-50 w-full bg-[#F8FAFC] border-t border-gray-100">
             <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC]" />}>
               <BottomNav />
             </Suspense>
             {/* Padding pour la barre de geste */}
             <div className="h-safe-bottom w-full bg-[#F8FAFC]" />
          </div>

        </div>
      </body>
    </html>
  );
}