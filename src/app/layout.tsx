import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import BottomNav from '@/components/BottomNav';
import InstallBanner from '@/components/InstallBanner'; // <-- 1. IMPORT DU COMPOSANT
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Comores Market",
  description: "Achat et vente aux Comores",
  manifest: '/manifest.json', // Assure-toi que c'est bien référencé
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
  themeColor: "#16a34a", // Couleur Brand
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
    <html lang="fr">
      <body className={`${inter.className} bg-gray-100 min-h-screen flex justify-center overflow-x-hidden`}>
        
        {/* 2. AJOUT DU BANDEAU D'INSTALLATION (Global) */}
        <InstallBanner />

        <div className="w-full max-w-125 min-h-screen bg-white shadow-2xl relative">
          <Toaster richColors position="top-center" duration={3000} />
          
          <main className="min-h-screen">
            {children}
          </main>

          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}