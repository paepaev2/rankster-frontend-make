'use client';

import { HomeFeed } from '@/app/pages/HomeFeed';
import { useParams } from 'next/navigation';

export default function Topic() {
  const params = useParams();
  const id = params.id as string;

  return <HomeFeed />;
}
