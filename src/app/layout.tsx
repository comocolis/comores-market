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
      <body className={`${inter.className} bg-gray-100 min-h-screen flex justify-center`}>
        <div className="w-full max-w-[500px] min-h-screen bg-white shadow-2xl relative">
          {children}
        </div>
      </body>
    </html>
  );
}