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
  // ASTUCE : On passe à la version 3 pour forcer le téléphone à re-télécharger le fichier
  // et enfin prendre en compte que le thème est GRIS et non plus VERT.
  manifest: '/manifest.json?v=3',
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

export const viewport: Viewport = {
  // C'EST ICI LA CLÉ : On dit au navigateur que la couleur du système est GRIS CLAIR.
  // Cela empêche la barre de statut ou le fond de rebond d'être vert.
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
      <body 
        // 1. font-sans : Police système
        // 2. bg-[#F8FAFC] : Fond gris uniforme
        // 3. min-h-dvh : Hauteur dynamique (v4) pour coller à l'écran mobile
        className={`font-sans bg-[#F8FAFC] min-h-dvh flex justify-center overflow-y-auto`}
      >
        {/* Écran de chargement */}
        <SplashScreen />

        {/* CONTENEUR PRINCIPAL */}
        {/* max-w-120 (480px en v4) | min-h-dvh | fond gris */}
        <div className="w-full max-w-120 min-h-dvh bg-[#F8FAFC] shadow-2xl relative flex flex-col shadow-black/10">
          
          {/* Bannière d'installation */}
          <InstallBanner />

          {/* Notifications */}
          <Toaster richColors position="top-center" duration={3000} />
          
          {/* Contenu principal : on remet le fond gris par sécurité */}
          <main className="flex-1 relative bg-[#F8FAFC]">
            {children}
          </main>

          {/* Assistant IA */}
          <EliteAssistant />

          {/* Navigation du bas */}
          <Suspense fallback={<div className="h-20 w-full bg-white border-t border-gray-50" />}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}