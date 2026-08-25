import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://abastosdesula.vercel.app"),
  title: "Central de Abastos de Sula | Productos y Comerciantes",
  description:
    "Conecta con comerciantes, explora productos frescos y solicita cotizaciones en la Central de Abastos de Sula.",
  manifest: "/manifest.webmanifest",
  applicationName: "Central de Abastos de Sula",
  appleWebApp: {
    capable: true,
    title: "Abastos de Sula",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "es_HN",
    url: "/",
    siteName: "Central de Abastos de Sula",
    title: "Central de Abastos de Sula",
    description: "Comerciantes, productos y cotizaciones en un solo lugar.",
    images: [
      {
        url: "/opengraph-image.png",
        alt: "Central de Abastos de Sula: comerciantes, productos y cotizaciones en un solo lugar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Central de Abastos de Sula",
    description: "Comerciantes, productos y cotizaciones en un solo lugar.",
    images: ["/opengraph-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#071a33",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
