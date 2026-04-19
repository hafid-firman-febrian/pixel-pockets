import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";

import AppProviders from "@/components/providers/AppProviders";

import "./globals.css";

const inconsolata = Inconsolata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inconsolata", // Membuat CSS Variable
});

export const metadata: Metadata = {
  title: "Pixel-Pockets | Personal Finance",
  description: "Simple and clean expense tracker built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inconsolata.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-mono">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
