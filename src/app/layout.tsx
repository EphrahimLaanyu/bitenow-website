import type { Metadata } from "next";
import { Manrope, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/app/providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair"
});

export const metadata: Metadata = {
  title: "BiteNow",
  description: "Premium hotel and restaurant ordering."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${plusJakarta.variable} ${manrope.variable} ${playfair.variable}`} lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
