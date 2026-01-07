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
    default: "Comores Market",
    template: "%s | Comores Market"
  },
  description: "Achat et Vente aux Comores",
  // IMPORTANT : On pointe vers le NOUVEAU fichier pour casser le cache PWA
  manifest: '/manifest-v2.json', 
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

// Configuration Viewport Officielle Next.js 14+
export const viewport: Viewport = {
  themeColor: "#F8FAFC", // Force la barre système en GRIS
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Étend le contenu sous les barres systèmes
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      {/* body classes :
          - min-h-dvh : Hauteur dynamique viewport (mobile friendly)
          - bg-[#F8FAFC] : Fond gris forcé
          - overscroll-none : Bloque le rebond élastique sur le body global
      */}
      <body className="font-sans min-h-dvh w-full bg-[#F8FAFC] text-gray-900 overflow-x-hidden antialiased overscroll-none">
        
        <NativeFeatures />
        <SplashScreen />

        {/* CONTENEUR PRINCIPAL CENTRÉ */}
        <div className="relative w-full max-w-120 min-h-dvh mx-auto bg-[#F8FAFC] shadow-2xl shadow-black/5 flex flex-col">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* CONTENU PRINCIPAL 
             - pb-32 : Marge en bas pour que le contenu ne soit pas caché derrière la barre de navigation 
          */}
          <main className="flex-1 relative bg-[#F8FAFC] z-0 pb-32">
            {children}
          </main>

          <EliteAssistant />

          {/* --- DOCK DE NAVIGATION BLINDÉ --- */}
          {/* 1. fixed -bottom-px : On colle la barre 1 pixel PLUS BAS que l'écran pour éviter le "gap" noir.
             2. shadow-[0_100px_0_#F8FAFC] : L'ombre magique. Une barre grise solide de 100px est projetée 
                vers le bas. Elle recouvre physiquement toute ligne verte ou noire du système.
          */}
          <div className="fixed -bottom-px left-0 w-full z-50 bg-[#F8FAFC] shadow-[0_100px_0_#F8FAFC]">
             
             {/* Conteneur de la navigation (limité à max-w-120 pour ne pas s'étirer sur PC) */}
             <div className="w-full max-w-120 mx-auto border-t border-gray-100 bg-[#F8FAFC]">
               <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC]" />}>
                 <BottomNav />
               </Suspense>
             </div>

             {/* Filler de sécurité pour les gestes iPhone/Android */}
             {/* On ajoute +2px pour compenser le décalage vers le bas */}
             <div className="w-full h-[calc(env(safe-area-inset-bottom)+2px)] bg-[#F8FAFC]" />
          </div>

        </div>
      </body>
    </html>
  );
}