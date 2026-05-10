'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crown, Minus, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { MobileTopBar } from "../components/MobileTopBar";
import { fetchCategories, fetchLeaderboardFiltered } from "../lib/ranksterApi";
import { useMockSession } from "../lib/useMockSession";
import type { Category, LeaderboardEntry } from "../lib/feedUi";

const TIME_FILTERS = ["This Week", "This Month", "All Time"];

export function LeaderboardPage() {
  const router = useRouter();
  const { session } = useMockSession();
  const [timeFilter, setTimeFilter] = useState("This Week");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      try {
        const [resolvedEntries, resolvedCategories] = await Promise.all([
          fetchLeaderboardFiltered(normalizeTimeframe(timeFilter), normalizeCategory(categoryFilter)),
          fetchCategories(),
        ]);
        if (!cancelled) {
          setEntries(resolvedEntries);
          setCategories(resolvedCategories.slice(0, 6));
        }
      } catch (leaderboardError) {
        if (!cancelled) {
          setError(leaderboardError instanceof Error ? leaderboardError.message : "Failed to load leaderboard.");
        }
      }
    }

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [categoryFilter, timeFilter]);

  const podium = entries.slice(0, 3);
  const currentUserEntry = useMemo(() => {
    if (!session) {
      return null;
    }
    return entries.find((entry) => entry.user.id === session.user.id) ?? null;
  }, [entries, session]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileTopBar>
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500" aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Leaderboard</h1>
            <p className="text-xs text-gray-400">Top rankers this week</p>
          </div>
        </div>

        <div className="mb-3 flex rounded-xl bg-gray-100 p-1">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                timeFilter === filter ? "bg-white text-brand-blue-dark shadow-sm" : "text-gray-500"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter("All")}
            className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              categoryFilter === "All" ? "bg-brand-blue text-white" : "border border-gray-200 bg-white text-gray-500"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategoryFilter(category.id)}
              className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === category.id
                  ? "bg-brand-blue text-white"
                  : "border border-gray-200 bg-white text-gray-500"
              }`}
            >
              {category.emoji} {category.name}
            </button>
          ))}
        </div>
      </MobileTopBar>

      <div className="px-4 py-4">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-white p-4 text-sm text-red-500 shadow-sm">{error}</div>
        ) : (
          <>
            {podium.length === 3 ? <Podium entries={podium} /> : null}

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-bold text-gray-900">Full Rankings</h3>
              </div>
              {entries.map((entry, index) => (
                <LeaderboardRow
                  key={entry.user.id}
                  entry={entry}
                  index={index}
                  isCurrentUser={entry.user.id === session?.user.id}
                />
              ))}
            </div>

            {currentUserEntry ? (
              <div className="mt-4 rounded-2xl border-2 border-brand-blue/25 bg-brand-blue/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-blue">#{currentUserEntry.rank}</span>
                  <Image
                    src={currentUserEntry.user.avatar}
                    alt={currentUserEntry.user.displayName}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-xl object-cover ring-2 ring-brand-blue/55"
                  />
                  <div>
                    <p className="text-sm font-bold text-brand-blue-dark">
                      You — {currentUserEntry.user.displayName}
                    </p>
                    <p className="text-xs text-brand-blue">
                      {formatPoints(currentUserEntry.score)} pts · Keep ranking to climb!
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const [first, second, third] = entries;

  return (
    <div className="mb-6 flex items-end justify-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-6 shadow-sm">
      <PodiumSpot entry={second} place={2} heightClass="h-16" ringClass="ring-gray-300" badgeClass="bg-gray-400" />
      <div className="flex flex-1 flex-col items-center gap-2">
        <Crown size={22} className="text-brand-yellow" />
        <div className="relative">
          <Image
            src={first.user.avatar}
            alt={first.user.displayName}
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-2xl object-cover ring-4 ring-brand-yellow"
          />
          <span className="absolute right-[-4px] bottom-[-8px] flex h-7 w-7 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-white">
            1
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-900">{first.user.username}</p>
          <p className="text-[10px] font-semibold text-brand-yellow-dark">{formatPoints(first.score)} pts</p>
        </div>
        <div className="flex h-24 w-full items-end justify-center rounded-t-lg bg-brand-yellow pb-2">
          <span className="font-black text-white">👑</span>
        </div>
      </div>
      <PodiumSpot entry={third} place={3} heightClass="h-10" ringClass="ring-orange-400" badgeClass="bg-orange-400" />
    </div>
  );
}

function PodiumSpot({
  entry,
  place,
  heightClass,
  ringClass,
  badgeClass,
}: {
  entry: LeaderboardEntry;
  place: number;
  heightClass: string;
  ringClass: string;
  badgeClass: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="relative">
        <Image
          src={entry.user.avatar}
          alt={entry.user.displayName}
          width={56}
          height={56}
          className={`h-14 w-14 rounded-2xl object-cover ring-2 ${ringClass}`}
        />
        <span
          className={`absolute right-[-4px] bottom-[-8px] flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${badgeClass}`}
        >
          {place}
        </span>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-gray-800">{entry.user.username}</p>
        <p className="text-[10px] text-gray-400">{formatPoints(entry.score)} pts</p>
      </div>
      <div className={`flex w-full items-end justify-center rounded-t-lg pb-2 text-sm font-black text-white ${heightClass} ${badgeClass}`}>
        {place}
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  index,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser: boolean;
}) {
  const ChangeIcon = entry.change.startsWith("+")
    ? TrendingUp
    : entry.change === "0"
      ? Minus
      : TrendingDown;
  const changeColor = entry.change.startsWith("+")
    ? "text-green-500"
    : entry.change === "0"
      ? "text-gray-400"
      : "text-red-500";

  return (
    <div className={`flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0 ${isCurrentUser ? "bg-brand-blue/10" : ""}`}>
      <div className="flex w-8 items-center justify-center">
        {index < 3 ? (
          <Trophy size={18} className={index === 0 ? "text-brand-yellow" : index === 1 ? "text-gray-400" : "text-orange-400"} />
        ) : (
          <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
        )}
      </div>

      <Image
        src={entry.user.avatar}
        alt={entry.user.displayName}
        width={40}
        height={40}
        className={`h-10 w-10 rounded-xl object-cover ${isCurrentUser ? "ring-2 ring-brand-blue/55" : ""}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`truncate text-sm font-bold ${isCurrentUser ? "text-brand-blue-dark" : "text-gray-900"}`}>
            {entry.user.displayName}
          </span>
          {isCurrentUser ? (
            <span className="rounded-full bg-brand-blue/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-blue-dark">You</span>
          ) : null}
          {entry.user.verified ? <span className="text-xs text-brand-blue">✓</span> : null}
        </div>
        <p className="text-xs text-gray-400">@{entry.user.username}</p>
      </div>

      <div className="text-right">
        <p className="text-sm font-black text-gray-900">{formatPoints(entry.score)}</p>
        <div className={`flex items-center justify-end gap-0.5 ${changeColor}`}>
          <ChangeIcon size={11} />
          <span className="text-[10px] font-bold">{entry.change}</span>
        </div>
      </div>
    </div>
  );
}

function formatPoints(score: number) {
  return (score / 1000).toFixed(1) + "k";
}

function normalizeTimeframe(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function normalizeCategory(value: string) {
  return value === "All" ? "all" : value.toLowerCase();
}
