import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from 'sonner';
import BottomNav from '@/components/BottomNav';
import InstallBanner from '@/components/InstallBanner';
import EliteAssistant from '@/components/EliteAssistant';
import SplashScreen from '@/components/SplashScreen';
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
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comores Market",
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

// CONFIGURATION VIEWPORT (Pour cacher la barre verte du navigateur)
export const viewport: Viewport = {
  // On utilise la même couleur que le fond (#F8FAFC)
  themeColor: "#F8FAFC", 
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      {/* Utilisation de font-sans système */}
      <body 
        className={`font-sans bg-gray-200 min-h-screen flex justify-center overflow-y-scroll`}
      >
        {/* SPLASH SCREEN */}
        <SplashScreen />

        {/* CONTENEUR MOBILE CENTRÉ (Max 480px) */}
        <div className="w-full max-w-[480px] min-h-screen bg-[#F8FAFC] shadow-2xl relative flex flex-col shadow-black/10">
          
          {/* Bannière PWA */}
          <InstallBanner />

          {/* Notifications */}
          <Toaster richColors position="top-center" duration={3000} />
          
          <main className="flex-1 relative">
            {children}
          </main>

          {/* Assistant Elite */}
          <EliteAssistant />

          {/* Navigation Basse */}
          <Suspense fallback={<div className="h-20 w-full bg-white border-t border-gray-50" />}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}