'use client';

import { useEffect } from "react";
import { AppErrorState } from "@/app/components/AppStateViews";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <AppErrorState message={error.message || "Rankster hit a problem while loading this page."} onRetry={reset} />;
}
