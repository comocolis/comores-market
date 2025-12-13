import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Comores Market",
  description: "Achat et vente aux Comores",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comores Market",
  },
  icons: {
    apple: "/icon-192.png", // Icône pour iPhone
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e", // La couleur verte de votre marque
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Empêche le zoom pour faire "vrai app"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-100 min-h-screen flex justify-center`}>
        <div className="w-full max-w-125 min-h-screen bg-white shadow-2xl relative">
          {children}
        </div>
      </body>
    </html>
  );
}