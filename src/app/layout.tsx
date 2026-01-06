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
  description: "La première marketplace des Comores.",
  
  // SEO : Image pour réseaux sociaux
  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://comores-market.com',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Comores Market' }],
  },

  // PWA : On pointe vers le NOUVEAU fichier pour casser le cache du téléphone
  manifest: '/market.webmanifest',
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comores Market",
  },

  // SEO : Icônes pour Google Search
  icons: {
    shortcut: '/favicon.ico',
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
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
    // INJECTION DE STYLE 1 : On force le fond gris sur le HTML directement
    <html lang="fr" suppressHydrationWarning style={{ backgroundColor: '#F8FAFC' }}>
      <body 
        className="font-sans min-h-dvh flex justify-center overflow-y-auto"
        // INJECTION DE STYLE 2 : On force le fond gris et on reset les marges sur le BODY
        style={{ backgroundColor: '#F8FAFC', margin: 0, padding: 0 }}
      >
        
        {/* Bloque le clic droit et interactions natives */}
        <NativeFeatures />
        
        <SplashScreen />

        {/* Rideau de sécurité fixe en arrière-plan */}
        <div className="fixed inset-0 bg-[#F8FAFC] -z-50 w-full h-full" />

        {/* Conteneur Principal (Max 480px, hauteur mobile dynamique) */}
        <div className="w-full max-w-120 min-h-dvh bg-[#F8FAFC] shadow-2xl relative flex flex-col shadow-black/10">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
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