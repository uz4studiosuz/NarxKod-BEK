import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NarxKod BEK - Narx va Qoldiq Tekshirish',
  description: 'Mobil barcode skaner va tovar narxi hamda qoldigʻini tezkor aniqlash tizimi.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NarxKod BEK',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
