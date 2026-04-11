'use client';

import React from 'react';
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Layout } from '@/app/components/Layout';
import { SavedProvider } from '@/app/lib/savedContext';

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const content = (
    <SavedProvider>
      <Layout>
        {children}
      </Layout>
    </SavedProvider>
  );

  if (!googleClientId) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {content}
    </GoogleOAuthProvider>
  );
}
