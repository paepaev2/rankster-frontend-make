'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trophy, Flame } from "lucide-react";
import { RankPostCard } from "../components/RankPostCard";
import { AppErrorState, FeedSkeleton } from "../components/AppStateViews";
import {
  type FeedScope,
  fetchMainFeed,
  fetchNotifications,
  getNotificationsSocketUrl,
  parseNotificationSocketEvent,
} from "../lib/ranksterApi";
import type { RankPost } from "../lib/feedUi";
import { useMockSession } from "../lib/useMockSession";

const FILTER_TABS = [
  { label: "For You", scope: "for-you" as const },
  { label: "Following", scope: "following" as const },
];

export function HomeFeed() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedScope>("for-you");
  const [feedItems, setFeedItems] = useState<RankPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { session, isLoading: isAuthLoading, error: authError } = useMockSession();
  const currentUser = session?.user;

  useEffect(() => {
    if (!isAuthLoading && !authError) {
      void loadFeed(activeTab);
    }
  }, [activeTab, isAuthLoading, authError]);

  useEffect(() => {
    if (!currentUser || authError) {
      setUnreadNotifications(0);
      return;
    }

    let cancelled = false;
    let socket: WebSocket | null = null;
    void fetchNotifications()
      .then((response) => {
        if (!cancelled) {
          setUnreadNotifications(response.unreadCount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnreadNotifications(0);
        }
      });

    try {
      socket = new WebSocket(getNotificationsSocketUrl());
      socket.onmessage = (event) => {
        try {
          const payload = parseNotificationSocketEvent(event.data as string);
          setUnreadNotifications(payload.unreadCount);
        } catch {
          setUnreadNotifications((current) => current);
        }
      };
    } catch {
      socket = null;
    }

    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [authError, currentUser?.id]);

  function navigate(path: string) {
    router.push(path);
  }

  async function loadFeed(scope: FeedScope, cursor?: string | null) {
    const isLoadMore = Boolean(cursor);

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
      setFeedItems([]);
      setNextCursor(null);
    }

    try {
      const response = await fetchMainFeed(scope, cursor);
      setFeedItems((currentItems) => (isLoadMore ? [...currentItems, ...response.items] : response.items));
      setNextCursor(response.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load feed.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-12 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
                <Trophy size={16} className="text-white" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">Rankster</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/leaderboard")}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-violet-50 text-violet-500 transition-colors"
              >
                <Flame size={20} />
              </button>
              <button
                onClick={() => navigate("/notifications")}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Open notifications"
              >
                <Bell size={20} />
                {unreadNotifications > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div className="flex gap-1 pb-0">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.scope}
                onClick={() => setActiveTab(tab.scope)}
                className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab.scope
                    ? "text-violet-600 border-violet-600"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {(isAuthLoading || isLoading) && (
          <FeedSkeleton />
        )}

        {!isAuthLoading && (authError || error) && (
          <AppErrorState
            title="Could not load rankings"
            message={authError || error || "Rankster could not load your feed right now."}
            onRetry={() => void loadFeed(activeTab)}
            variant="inline"
          />
        )}

        {!isAuthLoading && !authError && !isLoading && !error && feedItems.map((post) => (
          <RankPostCard
            key={post.id}
            post={post}
            onProfileClick={() => navigate(`/profile/${post.user.username}`)}
            onTopicClick={(postId) => navigate(`/topic/${postId}`)}
            onRankThis={(postId) => navigate(`/create?sourcePost=${encodeURIComponent(postId)}`)}
          />
        ))}

        {!isAuthLoading && !authError && !isLoading && !error && feedItems.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-sm text-gray-500">
            {activeTab === "following"
              ? "Follow people to fill your Following feed."
              : "No posts yet. Start the backend to see the live feed here."}
          </div>
        )}

        {nextCursor && !error && (
          <div className="text-center py-6">
            <button
              onClick={() => void loadFeed(activeTab, nextCursor)}
              disabled={isLoadingMore}
              className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-all shadow-sm disabled:opacity-60"
            >
              {isLoadingMore ? "Loading..." : "Load more rankings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
