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
  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://comores-market.com',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Comores Market' }],
  },
  
  // On garde le manifest renommé pour maintenir le cache à jour
  manifest: '/market.webmanifest',
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // Le theme-color prendra le dessus
    title: "Comores Market",
  },
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
    <html lang="fr" suppressHydrationWarning style={{ backgroundColor: '#F8FAFC' }}>
      
      {/* STRATÉGIE TOILE INFINIE : 
         Le body prend toute la largeur et est gris.
         Le contenu est centré via mx-auto.
      */}
      <body 
        className="font-sans min-h-dvh overflow-y-auto bg-[#F8FAFC]"
        style={{ backgroundColor: '#F8FAFC', margin: 0, padding: 0 }}
      >
        
        <NativeFeatures />
        <SplashScreen />

        {/* Fond fixe de sécurité (Gris) */}
        <div className="fixed inset-0 bg-[#F8FAFC] -z-50 w-full h-full" />

        {/* CONTENEUR PRINCIPAL */}
        {/* mx-auto : Centre le contenu horizontalement */}
        {/* min-h-dvh : Force la hauteur minimale à l'écran entier */}
        <div className="mx-auto w-full max-w-120 min-h-dvh bg-[#F8FAFC] shadow-2xl relative flex flex-col shadow-black/10">
          
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