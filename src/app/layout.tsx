import type { Metadata } from "next";
import "./globals.css";
import Sidebar from '@/components/layout/Sidebar';
import BottomTabBar from '@/components/layout/BottomTabBar';
import Providers from '@/app/providers';

export const metadata: Metadata = {
  title: "Snack-Track Vendor POS",
  description: "High-performance Vendor POS for Snack-Track",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      <body className="bg-[#0B0F19] text-white antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-[260px] pb-20 md:pb-0">
              {children}
            </main>
          </div>
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  );
}
