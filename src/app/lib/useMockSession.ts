"use client";

import { useEffect, useState } from "react";
import type { AuthSession } from "./feedUi";
import { resolveSession } from "./ranksterApi";

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const resolved = await resolveSession();
        if (!cancelled) {
          setSession(resolved);
        }
      } catch (sessionError) {
        if (!cancelled) {
          setError(sessionError instanceof Error ? sessionError.message : "Failed to load session.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    session,
    isLoading,
    error,
  };
}

export const useMockSession = useSession;
