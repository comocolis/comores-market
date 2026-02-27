import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from '@/components/ToastProvider';
import BottomNav from '@/components/BottomNav';
import OfflineScreen from '@/components/OfflineScreen';
import { Suspense, lazy } from "react"; 
import Script from 'next/script';
// ✅ OPTIMISATION 1 : Import de la police optimisée
import { Inter } from "next/font/google"; // Removed duplicate imports to combine them
import SplashScreen from '@/components/SplashScreen'; // Direct import for faster loading

// Lazy load heavy components
const InstallBanner = lazy(() => import('@/components/InstallBanner'));
const EliteAssistant = lazy(() => import('@/components/EliteAssistant'));
// Removed lazy SplashScreen
const NativeFeatures = lazy(() => import('@/components/NativeFeatures'));
const CookieBanner = lazy(() => import('@/components/CookieBanner'));

// ✅ CONFIGURATION POLICE
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.comores-market.com'),
  alternates: { 
    canonical: './',
  },
  title: { default: "Comores Market - Achat et Vente aux Comores", template: "%s | Comores Market" },
  description: "La première marketplace des Comores. Achetez et vendez voitures, immobilier, téléphones et bien plus.",
  keywords: ['Comores', 'Vente', 'Achat', 'Voiture', 'Immobilier', 'Occasion', 'Moroni', 'Mayotte', 'Annonces'],
  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://www.comores-market.com',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Comores Market' }],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
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
  themeColor: "#F8FAFC",
  width: "device-width",
  initialScale: 1,
  // ✅ CORRECTION PWA : Empêche le zoom auto sur les inputs
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning translate="no">
      {/* ✅ APPLICATION DE LA POLICE SUR LE BODY */}
      <body className={`${inter.className} font-sans min-h-dvh bg-gray-200 text-gray-900 antialiased overflow-y-auto notranslate`}>
        
        {/* ✅ GOOGLE TAGS (ANALYTICS + ADS) COMBINÉS */}
        {/* Chargement de la librairie globale */}
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=AW-16447515729" 
          strategy="afterInteractive" 
        />
        
        {/* Configuration des identifiants */}
        <Script id="google-tags-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Configuration Google Analytics
            gtag('config', 'G-MRDLKB8904');

            // Configuration Google Ads (Conversion Linker)
            gtag('config', 'AW-16447515729');
          `}
        </Script>

        <Suspense fallback={null}>
          <NativeFeatures />
        </Suspense>
        
        <Suspense fallback={null}>
          <SplashScreen />
        </Suspense>

        <div className="relative w-full max-w-120 mx-auto min-h-dvh flex flex-col bg-[#F8FAFC] shadow-2xl shadow-black/10">
          <Suspense fallback={null}>
            <InstallBanner />
          </Suspense>
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