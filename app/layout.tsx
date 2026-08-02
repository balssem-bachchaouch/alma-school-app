import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import RegisterSW from "@/components/RegisterSW";
import InstallPWA from "@/components/InstallPWA";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ALMA – Mon École",
  description: "L'application scolaire d'ALMA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#c4b5fd" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ALMA" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen font-[family-name:var(--font-inter)]">
        <RegisterSW />
        <StarField />
        <main className="relative z-10 pb-28">{children}</main>
        <BottomNav />
        <InstallPWA />
      </body>
    </html>
  );
}
