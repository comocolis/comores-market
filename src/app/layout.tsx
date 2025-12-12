import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Comores Market",
  description: "Achat et vente aux Comores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      {/* CORRECTION ICI : max-w-125 au lieu de max-w-[500px] */}
      <body className={`${inter.className} bg-gray-100 min-h-screen flex justify-center`}>
        <div className="w-full max-w-125 min-h-screen bg-white shadow-2xl relative">
          {children}
        </div>
      </body>
    </html>
  );
}