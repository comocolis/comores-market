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
  manifest: '/app.webmanifest', // Assurez-vous que c'est le bon nom
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
      
      {/* CORRECTION 1 : overflow-hidden sur le body pour éviter une barre de scroll à cause du dépassement */}
      <body className="font-sans h-dvh w-full bg-[#F8FAFC] text-gray-900 overflow-hidden antialiased">
        <NativeFeatures />
        <SplashScreen />

        {/* CONTENEUR PRINCIPAL */}
        {/* CORRECTION 2 : min-h-[calc(100dvh+5px)] 
            C'est ici qu'on applique votre idée. On force la hauteur à être 
            5 pixels plus grande que l'écran. Le "bas" réel est donc caché 5px sous l'écran. */}
        <div className="relative w-full max-w-120 mx-auto bg-[#F8FAFC] shadow-2xl shadow-black/5 flex flex-col h-[calc(100dvh+5px)] overflow-y-auto overscroll-y-none">
          
          <InstallBanner />
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* Contenu */}
          <main className="flex-1 relative bg-[#F8FAFC] z-0 pb-32">
            {children}
          </main>

          <EliteAssistant />

          {/* --- LE DOCK FIXE --- */}
          {/* On le garde fixe en bas de l'écran VISIBLE */}
          <div className="fixed bottom-0 left-0 w-full z-50 bg-[#F8FAFC] shadow-[0_50px_0_#F8FAFC]">
             
             {/* Navigation */}
             <div className="w-full max-w-120 mx-auto border-t border-gray-100 bg-[#F8FAFC]">
               <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC]" />}>
                 <BottomNav />
               </Suspense>
             </div>

             {/* Filler de sécurité */}
             <div className="w-full h-[calc(env(safe-area-inset-bottom)+2px)] bg-[#F8FAFC]" />
          </div>

        </div>
      </body>
    </html>
  );
}