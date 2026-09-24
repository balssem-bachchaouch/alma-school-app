import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SideNav from "@/components/SideNav";
import StarField from "@/components/StarField";
import RegisterSW from "@/components/RegisterSW";
import InstallPWA from "@/components/InstallPWA";
import Providers from "@/components/Providers";

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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-[family-name:var(--font-inter)]">
        <Providers>
          <RegisterSW />
          <StarField />
          <div className="flex min-h-screen">
            <SideNav />
            <div className="flex-1 flex flex-col min-h-screen">
              <main className="relative z-10 flex-1 pb-28 md:pb-0 md:overflow-y-auto md:bg-white">{children}</main>
              <BottomNav />
            </div>
          </div>
          <InstallPWA />
        </Providers>
      </body>
    </html>
  );
}
