'use client';

import React from 'react';
import { Layout } from '@/app/components/Layout';

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      {children}
    </Layout>
  );
}
