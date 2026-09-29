import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Orvia | Production-Ready API Platform',
  description: 'Modern, high-performance API platform powered by async Python, PostgreSQL, and modular services.',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <body className="min-h-screen bg-black text-[#F5F5F5] antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
