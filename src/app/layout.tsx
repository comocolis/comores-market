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
  
  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://comores-market.com',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
    images: [
      {
        url: '/logo.png', // Image utilisée pour les partages (WhatsApp/Facebook)
        width: 512,
        height: 512,
        alt: 'Comores Market',
      },
    ],
  },

  // 1. CHANGEMENT MANIFEST : On pointe vers 'market.webmanifest'
  // Cela force le téléphone à ignorer l'ancien cache vert.
  manifest: '/market.webmanifest',
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comores Market",
  },

  // 2. CORRECTION GOOGLE SEARCH :
  // Google a besoin d'une icône de haute qualité (min 192px) déclarée ici.
  icons: {
    shortcut: '/favicon.ico',
    icon: [
      // Icône standard pour l'onglet
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      // Icône HD pour GOOGLE SEARCH et Android (Assurez-vous que logo.png existe dans public/)
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  // 3. ANTI-LIGNE VERTE : On dit au navigateur système que le thème est GRIS
  themeColor: "#F8FAFC", 
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans bg-[#F8FAFC] min-h-dvh flex justify-center overflow-y-auto">
        
        {/* Bloque le clic droit et le drag-and-drop des images */}
        <NativeFeatures />
        
        <SplashScreen />

        {/* 4. RIDEAU DE SÉCURITÉ :
            Ce fond fixe reste immobile même si l'écran "saute" au déverrouillage.
            Il empêche de voir le fond vert du navigateur. */}
        <div className="fixed inset-0 bg-[#F8FAFC] -z-50" />

        {/* CONTENEUR PRINCIPAL */}
        <div className="w-full max-w-120 min-h-dvh bg-[#F8FAFC] shadow-2xl relative flex flex-col shadow-black/10">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* Contenu principal */}
          <main className="flex-1 relative bg-[#F8FAFC] z-0">
            {children}
          </main>

          <EliteAssistant />

          <Suspense fallback={<div className="h-20 w-full bg-white border-t border-gray-50" />}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}