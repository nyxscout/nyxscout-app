import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NyxScout - Finding alpha in the dark",
  description:
    "Live Bankr token scanner with an 8-signal alpha scoring engine.",
  icons: {
    icon: "/brand/nyxscout-logo-mark.png",
    shortcut: "/brand/nyxscout-logo-mark.png",
  },
  openGraph: {
    title: "NyxScout - Finding alpha in the dark",
    description: "Live Bankr token scanner with an 8-signal alpha scoring engine.",
    images: ["/brand/nyxscout-cover.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "NyxScout - Finding alpha in the dark",
    description: "Live Bankr token scanner with an 8-signal alpha scoring engine.",
    images: ["/brand/nyxscout-cover.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="virtual-protocol-site-verification"
          content="dcf77ee1bedb5b682f7a3e442d320bce"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
