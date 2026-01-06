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
      
      {/* min-h-[100.1vh] pour forcer le dépassement du pixel manquant */}
      <body className="font-sans min-h-[100.1vh] w-full bg-[#F8FAFC] text-gray-900 overflow-x-hidden antialiased">
        <NativeFeatures />
        <SplashScreen />

        {/* CONTENEUR PRINCIPAL */}
        <div className="relative w-full max-w-120 min-h-[100.1vh] mx-auto bg-[#F8FAFC] shadow-2xl shadow-black/5 flex flex-col">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* Contenu */}
          <main className="flex-1 relative bg-[#F8FAFC] z-0 pb-32">
            {children}
          </main>

          <EliteAssistant />

          {/* --- LE DOCK FIXE "OVERLAP" --- */}
          {/* CORRECTION v4 : -bottom-px (au lieu de bottom-[-1px]) 
              Cela place la barre 1 pixel en dessous du bord pour écraser la ligne noire. */}
          <div className="fixed -bottom-px left-0 w-full z-50 bg-[#F8FAFC]">
             
             {/* Navigation */}
             <div className="w-full max-w-120 mx-auto border-t border-gray-100 bg-[#F8FAFC]">
               <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC]" />}>
                 <BottomNav />
               </Suspense>
             </div>

             {/* FILLER EXTENSIBLE */}
             {/* +2px pour compenser le décalage vers le bas */}
             <div className="w-full h-[calc(env(safe-area-inset-bottom)+2px)] bg-[#F8FAFC]" />
          </div>

        </div>
      </body>
    </html>
  );
}