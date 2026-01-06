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
  manifest: '/market.webmanifest', // Assurez-vous que ce fichier existe bien dans public/
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // INDISPENSABLE pour couvrir la zone verte
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* INJECTION DIRECTE : On force le navigateur à peindre en GRIS avant de charger quoi que ce soit */}
        <style>{`
          :root, html, body {
            background-color: #F8FAFC !important;
            min-height: 100%;
            margin: 0;
            padding: 0;
            overscroll-behavior-y: none; /* Bloque le rebond vert temporairement */
          }
          /* On cache la barre de scroll tout en permettant le défilement */
          body::-webkit-scrollbar { display: none; }
        `}</style>
      </head>
      
      {/* On applique le gris sur le body aussi */}
      <body className="font-sans min-h-dvh w-full bg-[#F8FAFC] text-gray-900 overflow-x-hidden antialiased">
        
        <NativeFeatures />
        <SplashScreen />

        {/* DOUBLE RIDEAU DE SÉCURITÉ */}
        <div className="fixed inset-0 bg-[#F8FAFC] -z-50" />

        {/* CONTENEUR PRINCIPAL */}
        <div className="relative w-full max-w-120 min-h-dvh mx-auto bg-[#F8FAFC] shadow-2xl shadow-black/5 flex flex-col">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* Le contenu principal */}
          <main className="flex-1 relative bg-[#F8FAFC] z-0 pb-20">
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