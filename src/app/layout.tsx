import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "openagentsessions.org",
  description: "Public coding-agent session index for open model training.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} bg-zinc-950 text-zinc-100 antialiased`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
