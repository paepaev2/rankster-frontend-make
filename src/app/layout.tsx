import React from 'react';
import type { Metadata, Viewport } from 'next';
import { RootLayoutClient } from './layout.client';
import '@/styles/index.css';

export const metadata: Metadata = {
  title: 'Rankster',
  description: 'A ranking and community platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
