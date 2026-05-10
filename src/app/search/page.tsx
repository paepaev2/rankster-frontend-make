import { Suspense } from 'react';
import { SearchPage } from '@/app/pages/SearchPage';

export default function Search() {
  return (
    <Suspense fallback={<div className="px-4 pt-16 text-sm text-gray-500">Loading search...</div>}>
      <SearchPage />
    </Suspense>
  );
}
