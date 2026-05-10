'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, Trophy, TrendingUp, Users, Heart, BarChart2, Lock, Globe } from "lucide-react";
import { MY_RANKINGS, USERS, MOCK_POSTS } from "../data/mockData";
import { MobileTopBar } from "../components/MobileTopBar";
import { TierListDisplay } from "../components/TierListDisplay";
import { hasUsableCoverImage } from "../lib/feedUi";

const STAT_TABS = ["Rankings", "Liked", "Stats"];

export function BoardPage() {
  const router = useRouter();
  const currentUser = USERS[4];
  const [activeTab, setActiveTab] = useState("Rankings");

  const myPosts = MY_RANKINGS;
  const likedPosts = MOCK_POSTS.filter((p) => p.isLiked);

  const stats = {
    totalLikes: myPosts.reduce((a, p) => a + p.likes, 0),
    totalShares: myPosts.reduce((a, p) => a + p.shares, 0),
    totalRankings: currentUser.totalRankings,
    avgLikes: Math.round(myPosts.reduce((a, p) => a + p.likes, 0) / Math.max(myPosts.length, 1)),
    topCategory: "Music",
    rankScore: 28901,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <MobileTopBar innerClassName="px-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Board</h1>
            <p className="text-xs text-gray-400 mt-0.5">All your rankings in one place</p>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-brand-blue/25"
          >
            <img src={currentUser.avatar} alt="me" className="w-full h-full object-cover" />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-brand-blue/10 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-brand-blue-dark">{stats.totalRankings}</p>
            <p className="text-[10px] text-brand-blue font-medium">Rankings</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-red-500">{formatCount(stats.totalLikes)}</p>
            <p className="text-[10px] text-red-400 font-medium">Total Likes</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-orange-500">#{5}</p>
            <p className="text-[10px] text-orange-400 font-medium">Leaderboard</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100">
          {STAT_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-brand-blue border-brand-blue"
                  : "text-gray-400 border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </MobileTopBar>

      <div className="px-4 py-4">
        {/* Rankings Tab */}
        {activeTab === "Rankings" && (
          <div className="space-y-4">
            {/* Pinned Section */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Pin size={13} className="text-brand-blue" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pinned</span>
              </div>
              {myPosts.slice(0, 1).map((post) => {
                const hasCoverImage = hasUsableCoverImage(post.coverImage);

                return (
                  <div key={post.id} className="bg-white rounded-2xl overflow-hidden border-2 border-brand-blue/25 shadow-sm">
                    <div className="relative">
                      {hasCoverImage ? (
                        <>
                          <img src={post.coverImage} alt={post.title} className="w-full h-28 object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-0 left-0 p-3">
                            <h3 className="text-white font-bold text-sm">{post.title}</h3>
                          </div>
                        </>
                      ) : (
                        <div className="border-b border-gray-100 p-3">
                          <h3 className="text-sm font-black text-gray-900">{post.title}</h3>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="bg-brand-blue/100 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Pin size={9} />
                          Pinned
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <TierListDisplay tiers={post.tiers} tierRows={post.tierRows} compact />
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Heart size={12} className="text-red-400" />
                          {formatCount(post.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-brand-blue/70" />
                          {formatCount(post.participantCount)} ranked
                        </span>
                        {post.isPublic ? (
                          <span className="flex items-center gap-1 text-green-500">
                            <Globe size={12} />
                            Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Lock size={12} />
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All Rankings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">All Rankings</span>
                <button
                  onClick={() => router.push("/create")}
                  className="text-xs text-brand-blue font-semibold"
                >
                  + New
                </button>
              </div>
              <div className="space-y-3">
                {myPosts.map((post) => {
                  const hasCoverImage = hasUsableCoverImage(post.coverImage);

                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex gap-3 p-3"
                    >
                      {hasCoverImage ? (
                        <img src={post.coverImage} alt={post.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 truncate">{post.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{post.createdAt}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-500 flex items-center gap-0.5">
                            <Heart size={11} className="text-red-400" />
                            {formatCount(post.likes)}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-0.5">
                            <Users size={11} className="text-brand-blue/70" />
                            {formatCount(post.participantCount)}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${post.isPublic ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                            {post.isPublic ? "Public" : "Private"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => router.push("/create")}
                  className="w-full border-2 border-dashed border-brand-blue/25 rounded-2xl py-6 flex flex-col items-center gap-1.5 text-brand-blue/70 hover:border-brand-blue/55 hover:text-brand-blue transition-all"
                >
                  <span className="text-2xl">+</span>
                  <span className="text-sm font-semibold">Create New Ranking</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liked Tab */}
        {activeTab === "Liked" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">{likedPosts.length} liked tier lists</p>
            {likedPosts.map((post) => {
              const hasCoverImage = hasUsableCoverImage(post.coverImage);

              return (
                <div key={post.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex gap-3 p-3">
                  {hasCoverImage ? (
                    <img src={post.coverImage} alt={post.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 truncate">{post.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">by @{post.user.username}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-red-500 flex items-center gap-0.5">
                        <Heart size={11} className="fill-red-500" />
                        {formatCount(post.likes)}
                      </span>
                      <span className="text-xs text-gray-400">{post.createdAt}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "Stats" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-brand-blue" />
                <h3 className="font-bold text-gray-900">Your Statistics</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Rankings", value: stats.totalRankings, icon: "🏆", color: "text-brand-blue" },
                  { label: "Total Likes Received", value: formatCount(stats.totalLikes), icon: "❤️", color: "text-red-500" },
                  { label: "Total Shares", value: stats.totalShares, icon: "🔄", color: "text-green-500" },
                  { label: "Avg Likes/Ranking", value: stats.avgLikes, icon: "📊", color: "text-brand-blue" },
                  { label: "Top Category", value: stats.topCategory, icon: "🎵", color: "text-orange-500" },
                  { label: "Rank Score", value: formatCount(stats.rankScore), icon: "⚡", color: "text-brand-yellow" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xl mb-1">{stat.icon}</div>
                    <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Rankings by Category</h3>
              {[
                { name: "Music", emoji: "🎵", count: 14, pct: 37 },
                { name: "Gaming", emoji: "🎮", count: 10, pct: 26 },
                { name: "Movies & TV", emoji: "🎬", count: 8, pct: 21 },
                { name: "Sports", emoji: "🏀", count: 6, pct: 16 },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="text-lg w-7">{cat.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      <span className="text-xs text-gray-400">{cat.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-full bg-brand-blue/100 rounded-full"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Milestones</h3>
              <div className="space-y-2.5">
                {[
                  { label: "First Ranking", done: true, emoji: "🎉" },
                  { label: "10 Rankings", done: true, emoji: "🔟" },
                  { label: "1k Likes", done: true, emoji: "❤️" },
                  { label: "50 Rankings", done: false, emoji: "⭐" },
                  { label: "10k Likes", done: false, emoji: "🚀" },
                ].map((m) => (
                  <div key={m.label} className={`flex items-center gap-3 p-2.5 rounded-xl ${m.done ? "bg-green-50" : "bg-gray-50"}`}>
                    <span className="text-lg">{m.emoji}</span>
                    <span className={`text-sm font-medium ${m.done ? "text-green-700" : "text-gray-400"}`}>{m.label}</span>
                    {m.done && <span className="ml-auto text-green-500 text-xs font-bold">✓ Done</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}
