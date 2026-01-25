import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from '@/components/ToastProvider';
import BottomNav from '@/components/BottomNav';
import InstallBanner from '@/components/InstallBanner';
import EliteAssistant from '@/components/EliteAssistant';
import SplashScreen from '@/components/SplashScreen';
import NativeFeatures from '@/components/NativeFeatures';
import { Suspense } from "react"; // <--- Assurez-vous que cet import est là
import Script from 'next/script';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CookieBanner from '@/components/CookieBanner';

export const metadata: Metadata = {
  metadataBase: new URL('https://comores-market.com'),
  alternates: { canonical: '/' },
  title: { default: "Comores Market - Achat et Vente aux Comores", template: "%s | Comores Market" },
  description: "La première marketplace des Comores. Achetez et vendez voitures, immobilier, téléphones et bien plus.",
  keywords: ['Comores', 'Vente', 'Achat', 'Voiture', 'Immobilier', 'Occasion', 'Moroni', 'Mayotte', 'Annonces'],
  openGraph: {
    title: "Comores Market",
    description: "Les meilleures affaires des îles sont ici.",
    url: 'https://comores-market.com',
    siteName: 'Comores Market',
    locale: 'fr_KM',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Comores Market' }],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans min-h-dvh bg-gray-200 text-gray-900 antialiased overflow-y-auto">
        
        {/* CORRECTION CRITIQUE : Suspense autour de GA4 */}
        <Suspense fallback={null}>
          <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_ID || ""} />
        </Suspense>

        {/* GOOGLE ADS */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=AW-16447515729" strategy="afterInteractive" />
        <Script id="google-ads-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-16447515729');
          `}
        </Script>

        <NativeFeatures />
        <SplashScreen />

        <div className="relative w-full max-w-120 mx-auto min-h-dvh flex flex-col bg-[#F8FAFC] shadow-2xl shadow-black/10">
          <InstallBanner />
          <ToastProvider />
          
          <main className="flex-1 relative bg-[#F8FAFC] z-0 pb-24">
            <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><div className="text-gray-400">Chargement...</div></div>}>
              {children}
            </Suspense>
          </main>

          <EliteAssistant />

          <div className="fixed bottom-0 z-50 left-1/2 -translate-x-1/2 w-full max-w-120 bg-[#F8FAFC] border-t border-gray-100">
              <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC]" />}>
                <BottomNav />
              </Suspense>
              <div className="h-safe-bottom w-full bg-[#F8FAFC]" />
          </div>
        </div>

        {/* Suspense autour de la bannière aussi par sécurité */}
        <Suspense fallback={null}>
          <CookieBanner />
        </Suspense>

      </body>
    </html>
  );
}