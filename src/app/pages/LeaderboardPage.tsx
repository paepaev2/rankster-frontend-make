'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchLeaderboard } from "../lib/ranksterApi";
import type { LeaderboardEntry } from "../lib/feedUi";

export function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchLeaderboard()
      .then(setItems)
      .catch((leaderboardError) => {
        setError(leaderboardError instanceof Error ? leaderboardError.message : "Failed to load leaderboard.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-12 pb-24">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Leaderboard</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Top creators</h1>
        </div>
        {error ? (
          <div className="rounded-3xl border border-red-100 bg-white p-5 text-sm text-red-500 shadow-sm">{error}</div>
        ) : (
          <div className="space-y-3">
            {items.map((entry) => (
              <div key={entry.user.id} className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 font-black text-violet-600">
                  {entry.rank}
                </div>
                <Image src={entry.user.avatar} alt={entry.user.displayName} width={52} height={52} className="h-[52px] w-[52px] rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{entry.user.displayName}</p>
                  <p className="text-sm text-gray-500">@{entry.user.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{entry.score.toLocaleString()}</p>
                  <p className="text-xs text-violet-500">{entry.change}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
