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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#F8FAFC" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      
      <body className="font-sans min-h-dvh w-full bg-[#F8FAFC] text-gray-900 overflow-x-hidden antialiased">
        <NativeFeatures />
        <SplashScreen />

        {/* CONTENEUR PRINCIPAL */}
        <div className="relative w-full max-w-120 min-h-dvh mx-auto bg-[#F8FAFC] shadow-2xl shadow-black/5 flex flex-col">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* CONTENU PRINCIPAL */}
          {/* pb-32 : On laisse une grande marge en bas pour que le dernier élément
              ne soit pas caché par la barre de navigation fixe */}
          <main className="flex-1 relative bg-[#F8FAFC] z-0 pb-32">
            {children}
          </main>

          <EliteAssistant />

          {/* --- LE DOCK FIXE (NAVIGATION + SAFE AREA) --- */}
          {/* Il est fixé en bas de l'écran, par-dessus tout le reste */}
          <div className="fixed bottom-0 left-0 w-full z-50 bg-[#F8FAFC]">
             
             {/* 1. La Navigation */}
             {/* On centre la nav pour qu'elle ne dépasse pas sur grand écran */}
             <div className="w-full max-w-120 mx-auto border-t border-gray-100 bg-[#F8FAFC]">
               <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC]" />}>
                 <BottomNav />
               </Suspense>
             </div>

             {/* 2. LE "FILLER" DE ZONE DE SÉCURITÉ */}
             {/* Cette div a exactement la hauteur de la barre de geste (env safe-area) */}
             {/* Elle est FORCEE en gris (#F8FAFC) pour recouvrir la ligne noire/verte */}
             <div className="w-full h-safe-bottom bg-[#F8FAFC]" />
          </div>

        </div>
      </body>
    </html>
  );
}