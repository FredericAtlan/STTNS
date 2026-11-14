import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShellWithProjects } from "@/components/layout/AppShellWithProjects";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "STTNS PM — Decision OS | Data Refiners",
  description:
    "Straight to the North Star — Gestion des initiatives MarketChain (No Pain, No Product)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans bg-background text-foreground`}>
        <AppShellWithProjects>{children}</AppShellWithProjects>
      </body>
    </html>
  );
}
