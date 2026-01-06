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
  // On revient au nom standard (plus sûr) mais avec v=7 pour forcer la maj
  manifest: '/manifest.json?v=7', 
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comores Market",
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
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans bg-[#F8FAFC] h-dvh w-screen flex justify-center overflow-hidden">
        
        <NativeFeatures />
        <SplashScreen />

        {/* Fond fixe */}
        <div className="fixed inset-0 bg-[#F8FAFC] -z-50" />

        {/* --- LE SCROLL EST DÉPLACÉ ICI --- */}
        {/* overflow-y-auto : C'est cette div qui scrolle, pas la page entière */}
        {/* overscroll-contain : Empêche le rebond de se propager au body vert */}
        <div 
          id="app-container"
          className="w-full max-w-120 h-dvh bg-[#F8FAFC] shadow-2xl relative flex flex-col shadow-black/10 overflow-y-auto overscroll-contain"
        >
          
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