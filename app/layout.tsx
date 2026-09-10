import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Affan — A Life in Chapters",
  description: "From a white house in Bihar to building software. Explore Affan Ahmad’s story in Hinglish and English.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi-Latn">
      <head>
        <link rel="preload" href="/fonts/cormorant-garamond-latin-500-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>
        <link rel="preload" href="/fonts/dm-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
