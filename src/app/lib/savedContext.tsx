'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { RankPost } from "./feedUi";

interface SavedContextValue {
  savedIds: Set<string>;
  savedPosts: RankPost[];
  toggleSave: (post: RankPost) => void;
}

const SavedContext = createContext<SavedContextValue>({
  savedIds: new Set(),
  savedPosts: [],
  toggleSave: () => {},
});

const STORAGE_KEY = "rankster_saved_posts";

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [savedPosts, setSavedPosts] = useState<RankPost[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as RankPost[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPosts));
    } catch {
      // ignore storage errors (private mode, quota exceeded, etc.)
    }
  }, [savedPosts]);

  const savedIds = new Set(savedPosts.map((p) => p.id));

  const toggleSave = useCallback((post: RankPost) => {
    setSavedPosts((prev) => {
      if (prev.some((p) => p.id === post.id)) {
        return prev.filter((p) => p.id !== post.id);
      }
      return [post, ...prev];
    });
  }, []);

  return (
    <SavedContext.Provider value={{ savedIds, savedPosts, toggleSave }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  return useContext(SavedContext);
}
