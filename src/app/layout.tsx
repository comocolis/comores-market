import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from '@/components/BottomNav';
import OfflineScreen from '@/components/OfflineScreen';
import { Suspense } from "react";
import Script from 'next/script';
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import SplashScreen from '@/components/SplashScreen';
import InstallBanner from '@/components/InstallBanner';
import { DeferredAssistant, DeferredNativeFeatures, DeferredCookieBanner, DeferredToaster } from '@/components/DeferredWidgets';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-MRDLKB8904';
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-16447515729';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.comores-market.com'),
  alternates: { 
    canonical: '/',
  },
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
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning translate="no">
      <head>
        {/* Script zéro-FOUC : Applique le thème immédiatement avant le premier rendu */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && supportDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${displayFont.variable} font-sans min-h-dvh bg-gray-700 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased overflow-y-auto notranslate transition-colors duration-200`}>
        <ThemeProvider>
          <InstallBanner />

          {/* GOOGLE TAGS */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
            strategy="lazyOnload"
          />
          
          <Script id="google-tags-config" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
              gtag('config', '${GOOGLE_ADS_ID}');
            `}
          </Script>

          <Suspense fallback={null}>
            <DeferredNativeFeatures />
          </Suspense>

          <Suspense fallback={null}>
            <SplashScreen />
          </Suspense>

          <div className="relative w-full max-w-120 mx-auto min-h-dvh flex flex-col bg-[#F8FAFC] dark:bg-slate-900 shadow-2xl shadow-black/10 dark:shadow-black/50 transition-colors duration-200">
            <DeferredToaster />

            <main className="flex-1 relative bg-[#F8FAFC] dark:bg-slate-900 text-gray-900 dark:text-slate-100 z-0 pb-24 transition-colors duration-200">
              <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><div className="text-gray-500 dark:text-slate-400">Chargement...</div></div>}>
                {children}
              </Suspense>
            </main>

            <Suspense fallback={null}>
              <DeferredAssistant />
            </Suspense>

            <div className="fixed bottom-0 z-50 left-1/2 -translate-x-1/2 w-full max-w-120 bg-[#F8FAFC] dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 transition-colors duration-200">
                <Suspense fallback={<div className="h-16 w-full bg-[#F8FAFC] dark:bg-slate-900" />}>
                  <BottomNav />
                </Suspense>
                <div className="h-safe-bottom w-full bg-[#F8FAFC] dark:bg-slate-900" />
            </div>
          </div>

          <Suspense fallback={null}>
            <DeferredCookieBanner />
          </Suspense>

          <OfflineScreen />
        </ThemeProvider>
      </body>
    </html>
  );
}
