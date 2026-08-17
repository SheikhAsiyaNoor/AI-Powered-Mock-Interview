import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/Authcontext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Mock Interview | Placement Readiness Engine",
  description: "AI-Powered Mock Interview Platform & Placement Readiness Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
      <body className="font-sans min-h-screen bg-background text-foreground antialiased selection:bg-blue-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
