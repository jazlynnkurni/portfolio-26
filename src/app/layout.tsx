import type { Metadata } from "next";
import { Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import CustomCursor from "@/components/CustomCursor";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "400",
});


export const metadata: Metadata = {
  title: "Jazlynn Kurniandra",
  description: "Portfolio of Jazlynn Kurniandra",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Outside {children} on purpose — this is what keeps it mounted across
            navigation, so the active bar has somewhere to slide from. */}
        <SiteNav />
        {children}
        <CustomCursor />
      </body>
    </html>
  );
}
