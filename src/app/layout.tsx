import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CoachAI — Your AI Running Coach',
    template: '%s | CoachAI',
  },
  description:
    'AI-powered marathon training with real-time Garmin data analysis, personalized coaching insights, and smart training plans.',
  keywords: ['running coach', 'marathon training', 'Garmin', 'AI coaching', 'running analytics'],
  authors: [{ name: 'CoachAI' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'CoachAI — Your AI Running Coach',
    description: 'AI-powered marathon training and coaching',
    siteName: 'CoachAI',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
