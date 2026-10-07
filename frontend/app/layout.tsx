import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'ChatConnect | Connect. Communicate. Collaborate.',
  description:
    'ChatConnect is a real-time human-to-human communication platform engineered on Material Design 3 and powered by Aiven PostgreSQL, Apache Kafka, and Valkey.',
  keywords: 'ChatConnect, Real-Time Chat, Material Design 3, Aiven, PostgreSQL, Kafka, Valkey, WebSockets',
  authors: [{ name: 'ChatConnect Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
