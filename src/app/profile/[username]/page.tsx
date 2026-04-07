'use client';

import { ProfilePage } from '@/app/pages/ProfilePage';
import { useParams } from 'next/navigation';

export default function UserProfile() {
  const params = useParams();
  const username = params.username as string;

  return <ProfilePage />;
}
