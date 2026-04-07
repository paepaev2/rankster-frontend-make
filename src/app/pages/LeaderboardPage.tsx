'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Minus, Crown } from "lucide-react";
import { LEADERBOARD_USERS, USERS } from "../data/mockData";
import { CATEGORIES } from "../data/mockData";

const TIME_FILTERS = ["This Week", "This Month", "All Time"];

export function LeaderboardPage() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState("This Week");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const currentUser = USERS[4];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.back()} className="text-gray-500">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Leaderboard</h1>
              <p className="text-xs text-gray-400">Top rankers this week</p>
            </div>
          </div>

          {/* Time Filter */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
            {TIME_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timeFilter === f ? "bg-white text-violet-700 shadow-sm" : "text-gray-500"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setCategoryFilter("All")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                categoryFilter === "All"
                  ? "bg-violet-600 text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              All
            </button>
            {CATEGORIES.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                  categoryFilter === cat.id
                    ? "bg-violet-600 text-white"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-3 mb-6 px-4 py-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* 2nd Place */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="relative">
              <img
                src={LEADERBOARD_USERS[1].user.avatar}
                alt={LEADERBOARD_USERS[1].user.displayName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-300"
              />
              <span className="absolute -bottom-2 -right-2 w-6 h-6 bg-gray-400 rounded-full text-white text-xs font-black flex items-center justify-center">2</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-800">{LEADERBOARD_USERS[1].user.username}</p>
              <p className="text-[10px] text-gray-400">{(LEADERBOARD_USERS[1].score / 1000).toFixed(1)}k pts</p>
            </div>
            <div className="w-full bg-gray-300 rounded-t-lg h-16 flex items-end justify-center pb-2">
              <span className="text-gray-600 font-black text-sm">2</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Crown size={22} className="text-yellow-500" />
            <div className="relative">
              <img
                src={LEADERBOARD_USERS[0].user.avatar}
                alt={LEADERBOARD_USERS[0].user.displayName}
                className="w-18 h-18 rounded-2xl object-cover ring-4 ring-yellow-400"
                style={{ width: "72px", height: "72px" }}
              />
              <span className="absolute -bottom-2 -right-2 w-7 h-7 bg-yellow-400 rounded-full text-white text-sm font-black flex items-center justify-center">1</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-900">{LEADERBOARD_USERS[0].user.username}</p>
              <p className="text-[10px] text-yellow-600 font-semibold">{(LEADERBOARD_USERS[0].score / 1000).toFixed(1)}k pts</p>
            </div>
            <div className="w-full bg-yellow-400 rounded-t-lg h-24 flex items-end justify-center pb-2">
              <span className="text-white font-black">👑</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="relative">
              <img
                src={LEADERBOARD_USERS[2].user.avatar}
                alt={LEADERBOARD_USERS[2].user.displayName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-orange-400"
              />
              <span className="absolute -bottom-2 -right-2 w-6 h-6 bg-orange-400 rounded-full text-white text-xs font-black flex items-center justify-center">3</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-800">{LEADERBOARD_USERS[2].user.username}</p>
              <p className="text-[10px] text-gray-400">{(LEADERBOARD_USERS[2].score / 1000).toFixed(1)}k pts</p>
            </div>
            <div className="w-full bg-orange-400 rounded-t-lg h-10 flex items-end justify-center pb-2">
              <span className="text-white font-black text-sm">3</span>
            </div>
          </div>
        </div>

        {/* Full Rankings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Full Rankings</h3>
          </div>
          {LEADERBOARD_USERS.map((entry, idx) => {
            const isMe = entry.user.id === currentUser.id;
            const change = entry.change;
            const ChangeIcon = change.startsWith("+") ? TrendingUp : change === "0" ? Minus : TrendingDown;
            const changeColor = change.startsWith("+") ? "text-green-500" : change === "0" ? "text-gray-400" : "text-red-500";

            return (
              <div
                key={entry.user.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${isMe ? "bg-violet-50" : ""}`}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center">
                  {idx < 3 ? (
                    <Trophy size={18} className={idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : "text-orange-400"} />
                  ) : (
                    <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <img
                  src={entry.user.avatar}
                  alt={entry.user.displayName}
                  className={`w-10 h-10 rounded-xl object-cover ${isMe ? "ring-2 ring-violet-400" : ""}`}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${isMe ? "text-violet-700" : "text-gray-900"} truncate`}>
                      {entry.user.displayName}
                    </span>
                    {isMe && <span className="text-[10px] bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full font-bold">You</span>}
                    {entry.user.verified && <span className="text-violet-500 text-xs">✓</span>}
                  </div>
                  <p className="text-xs text-gray-400">@{entry.user.username}</p>
                </div>

                {/* Score & Change */}
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{(entry.score / 1000).toFixed(1)}k</p>
                  <div className={`flex items-center justify-end gap-0.5 ${changeColor}`}>
                    <ChangeIcon size={11} />
                    <span className="text-[10px] font-bold">{change}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* My Ranking */}
        <div className="mt-4 bg-violet-50 rounded-2xl border-2 border-violet-200 p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-violet-600">#5</span>
            <img src={currentUser.avatar} alt="me" className="w-10 h-10 rounded-xl object-cover ring-2 ring-violet-400" />
            <div>
              <p className="text-sm font-bold text-violet-800">You — {currentUser.displayName}</p>
              <p className="text-xs text-violet-500">28,901 pts · Keep ranking to climb! 🚀</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
