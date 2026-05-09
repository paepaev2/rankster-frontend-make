'use client';

import { DMPage } from '@/app/pages/DMPage';

type DMRouteProps = {
  searchParams?: Promise<{
    username?: string | string[];
    user?: string | string[];
  }>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DM({ searchParams }: DMRouteProps) {
  const resolvedSearchParams = await searchParams;
  const initialUsername = firstParam(resolvedSearchParams?.username) ?? firstParam(resolvedSearchParams?.user);

  return <DMPage initialUsername={initialUsername} />;
}
