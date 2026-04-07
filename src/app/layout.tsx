import React from 'react';
import { RootLayoutClient } from './layout.client';
import '@/styles/index.css';

export const metadata = {
  title: 'Rankster',
  description: 'A ranking and community platform',
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
