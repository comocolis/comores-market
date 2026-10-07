import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from '@/components/ToastProvider';
import BottomNav from '@/components/BottomNav';
import OfflineScreen from '@/components/OfflineScreen';
import { Suspense, lazy } from "react"; 
import Script from 'next/script';
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import SplashScreen from '@/components/SplashScreen';
import InstallBanner from '@/components/InstallBanner';

const EliteAssistant = lazy(() => import('@/components/EliteAssistant'));
const NativeFeatures = lazy(() => import('@/components/NativeFeatures'));
const CookieBanner = lazy(() => import('@/components/CookieBanner'));

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Calque 0 — police display chargee mais NON appliquee (aucun changement visuel).
// Sera utilisee via la classe `font-display` a partir du Calque 2.
const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

// IDs Google lus dans l'environnement (plus aucune valeur codee en dur).
// Le fallback correspond a l'ID utilise en production pour ne jamais perdre
// de donnees si la variable n'est pas definie.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-MRDLKB8904';
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-16447515729';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.comores-market.com'),
  alternates: { 
    canonical: '/',
  },
  // ✅ TEMPLATE DE TITRE : Parfait pour le SEO des pages enfants
  title: { default: "Comores Market - Achat et Vente aux Comores", template: "%s | Comores Market" },
  description: "La première marketplace des Comores. Achetez et vendez voitures, immobilier, téléphones et bien plus.",
  keywords: ['Comores', 'Vente', 'Achat', 'Voiture', 'Immobilier', 'Occasion', 'Moroni', 'Mayotte', 'Annonces'],
  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://www.comores-market.com/',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
    // ✅ OPTIMISATION OG:IMAGE : Format paysage 1200x630 recommandé pour WhatsApp/Facebook
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Comores Market' }], 
  },
  robots: {
    index: true, 
    follow: true,
    googleBot: { 
      index: true, 
      follow: true, 
      'max-video-preview': -1, 
      'max-image-preview': 'large', 
      'max-snippet': -1 
    },
  },
  other: {
    'google': 'notranslate',
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Comores Market" },
  icons: {
    shortcut: '/favicon.ico',
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: "#374151",
  width: "device-width",
  initialScale: 1,
  // ✅ CORRECTION SEO & ACCESSIBILITÉ : On supprime userScalable=false pour éviter les pénalités Google.
  // (Pense à mettre la classe 'text-base' (16px) sur tes inputs pour bloquer le zoom iOS naturellement).
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning translate="no">
      <body className={`${inter.className} ${displayFont.variable} font-sans min-h-dvh bg-gray-700 text-gray-900 antialiased overflow-y-auto notranslate`}>
        
        {/* ✅ RENDU DE LA BANNIÈRE D'INSTALLATION DEPUIS LE CANVAS */}
        <InstallBanner />

        {/* GOOGLE TAGS (IDs lus via NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_GOOGLE_ADS_ID) */}
        <Script 
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} 
          strategy="afterInteractive" 
        />
        
        <Script id="google-tags-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>

        <Suspense fallback={null}>
          <NativeFeatures />
        </Suspense>
        
        <Suspense fallback={null}>
          <SplashScreen />
        </Suspense>

        <div className="relative w-full max-w-120 mx-auto min-h-dvh flex flex-col bg-[#F8FAFC] shadow-2xl shadow-black/10">
          <ToastProvider />
          
          <main className="flex-1 relative bg-[#F8FAFC] z-0 pb-24">
            <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><div className="text-gray-500">Chargement...</div></div>}>
              {children}
            </Suspense>
          </main>

          <Suspense fallback={null}>
            <EliteAssistant />
          </Suspense>

          <div className="fixed bottom-0 z-50 left-1/2 -translate-x-1/2 w-full max-w-120 bg-[#F8FAFC] border-t border-gray-100">
              <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC]" />}>
                <BottomNav />
              </Suspense>
              <div className="h-safe-bottom w-full bg-[#F8FAFC]" />
          </div>
        </div>

        <Suspense fallback={null}>
          <CookieBanner />
        </Suspense>

        <OfflineScreen />

      </body>
    </html>
  );
}