import type { Metadata } from "next";
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
  manifest: '/market.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

// On retire l'export viewport constant pour le gérer manuellement plus bas
// pour être sûr que le navigateur mobile le prenne en compte.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* FORCE LA COULEUR DU NAVIGATEUR EN GRIS (Anti ligne noire/verte) */}
        <meta name="theme-color" content="#F8FAFC" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        
        {/* STYLE INLINE DE SECOURS : S'applique avant le chargement du CSS */}
        <style>{`
          html, body { background-color: #F8FAFC; }
        `}</style>
      </head>
      
      <body className="font-sans min-h-dvh w-full bg-[#F8FAFC] text-gray-900 overflow-x-hidden antialiased">
        <NativeFeatures />
        <SplashScreen />

        {/* CONTENEUR PRINCIPAL */}
        <div className="relative w-full max-w-120 min-h-dvh mx-auto bg-[#F8FAFC] shadow-2xl shadow-black/5 flex flex-col">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* Contenu : z-0 pour rester sous les éléments fixes */}
          <main className="flex-1 relative bg-[#F8FAFC] z-0">
            {children}
          </main>

          <EliteAssistant />

          {/* Navigation du bas */}
          {/* On l'enveloppe dans une div grise pour combler les trous en bas */}
          <div className="sticky bottom-0 z-50 w-full bg-[#F8FAFC]">
             <Suspense fallback={<div className="h-20 w-full bg-white border-t border-gray-50" />}>
               <BottomNav />
             </Suspense>
             {/* Zone de sécurité pour iPhone/Android gestes (fond gris forcé) */}
             <div className="h-[env(safe-area-inset-bottom)] w-full bg-[#F8FAFC]" />
          </div>
        </div>
      </body>
    </html>
  );
}