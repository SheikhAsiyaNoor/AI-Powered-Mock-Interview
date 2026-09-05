import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/Authcontext";
import { ThemeProvider } from "@/context/ThemeContext";

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
  metadataBase: new URL("https://ai-powered-mock-interview-gules.vercel.app"),
  title: {
    default: "Iperitus | AI Mock Interview & Placement Readiness Engine",
    template: "%s | Iperitus",
  },
  description:
    "Master technical & behavioral interviews with AI-powered simulations, real-time speech feedback, resume analysis, and adaptive coding challenges.",
  keywords: [
    "Iperitus",
    "AI mock interview",
    "technical interview prep",
    "coding interview practice",
    "placement readiness",
    "behavioral interview AI",
    "resume analyzer",
    "interview simulation",
    "software engineering interview",
  ],
  authors: [{ name: "Iperitus Team" }],
  creator: "Iperitus",
  publisher: "Iperitus",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ai-powered-mock-interview-gules.vercel.app",
    siteName: "Iperitus - AI Mock Interview Platform",
    title: "Iperitus | AI Mock Interview & Placement Readiness Engine",
    description:
      "Practice tech interviews with real-time AI feedback, tailored question banks, resume evaluation, and peer challenge arena.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Iperitus | AI Mock Interview & Placement Readiness Engine",
    description:
      "Master technical & behavioral interviews with real-time AI feedback and personalized preparation plans.",
  },
  alternates: {
    canonical: "https://ai-powered-mock-interview-gules.vercel.app",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Iperitus - AI Mock Interview Platform",
    url: "https://ai-powered-mock-interview-gules.vercel.app",
    description:
      "Iperitus: AI-Powered Mock Interview Platform & Placement Readiness Engine for students and job seekers.",
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
  };

  const themeScript = `
    (function() {
      try {
        var savedTheme = localStorage.getItem('theme') || 'system';
        var isDark = savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans min-h-screen bg-background text-foreground antialiased selection:bg-blue-500 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

