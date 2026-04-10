'use client';

import { Suspense } from 'react';
import { CreatePage } from '@/app/pages/CreatePage';

export default function Create() {
  return (
    <Suspense fallback={<div className="px-4 pt-16 text-sm text-gray-500">Loading creator...</div>}>
      <CreatePage />
    </Suspense>
  );
}
