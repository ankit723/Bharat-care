import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Metadata } from 'next';
import PageTransition from '@/components/pageTransition';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'BharatCare - Healthcare Management System',
    template: '%s | BharatCare'
  },
  description: 'A comprehensive healthcare management system connecting doctors, hospitals, patients, and medical services across India.',
  keywords: [
    'healthcare',
    'medical management',
    'hospital system',
    'doctor appointment',
    'patient care',
    'medical records',
    'healthcare india',
    'bharat care',
    'medical services'
  ],
  authors: [{ name: 'BharatCare Team' }],
  creator: 'BharatCare',
  publisher: 'BharatCare',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'BharatCare - Healthcare Management System',
    description: 'A comprehensive healthcare management system connecting doctors, hospitals, patients, and medical services across India.',
    siteName: 'BharatCare',
    images: [
      {
        url: '/bharat-care-logo.png',
        width: 1200,
        height: 630,
        alt: 'BharatCare - Healthcare Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BharatCare - Healthcare Management System',
    description: 'A comprehensive healthcare management system connecting doctors, hospitals, patients, and medical services across India.',
    images: ['/bharat-care-logo.png'],
    creator: '@bharatcare',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL} />
      </head>
      <body className={inter.className}>
        <PageTransition>{children}</PageTransition>
        <Toaster />
      </body>
    </html>
  );
}
