import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DilKöprüsü — CEFR İngilizce Öğrenme Atölyesi',
  description:
    "A1'den B2'ye 4 CEFR seviyesi, 3D kelime kartları, dil bilgisi rehberi, yapay zekâ destekli alıştırma testleri ve iki dilli AI İngilizce öğretmeni.",
  openGraph: {
    title: 'DilKöprüsü — CEFR İngilizce Öğrenme Atölyesi',
    description:
      "A1'den B2'ye 4 CEFR seviyesi, 3D kelime kartları, dil bilgisi rehberi, yapay zekâ destekli alıştırma testleri ve iki dilli AI İngilizce öğretmeni.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DilKöprüsü — CEFR İngilizce Öğrenme Atölyesi',
    description:
      "A1'den B2'ye 4 CEFR seviyesi, 3D kelime kartları, dil bilgisi rehberi, yapay zekâ destekli alıştırma testleri ve iki dilli AI İngilizce öğretmeni.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${fraunces.variable} ${plusJakarta.variable} ${ibmPlexMono.variable}`}
    >
      <body
        className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#0284C7]/15 selection:text-[#0F172A]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
