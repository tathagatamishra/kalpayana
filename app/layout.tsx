import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face used for the "kalpayana" wordmark in the header.
const solar = localFont({
  src: "./fonts/SolarSpaceDemoRegular.ttf",
  variable: "--font-solar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KALPAYANA",
  description:
    "Kalpayana is an online gallery of scientific imagery — each image with its full story, credit and source.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${solar.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#05070d] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
