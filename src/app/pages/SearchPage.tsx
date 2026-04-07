'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Flame, Users, TrendingUp } from "lucide-react";
import { CATEGORIES, TRENDING_TOPICS, USERS } from "../data/mockData";

export function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTopics = TRENDING_TOPICS.filter((t) => {
    const matchesQuery = query === "" || t.title.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === null || t.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const filteredUsers = USERS.filter(
    (u) =>
      query !== "" &&
      (u.displayName.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase()))
  );

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-12 pb-4">
          <h1 className="text-2xl font-black text-gray-900 mb-3">Discover</h1>
          {/* Search Bar */}
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, people, categories..."
              className="w-full bg-gray-100 rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        {/* User Results */}
        {filteredUsers.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">People</h2>
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => router.push(`/profile/${user.username}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:border-violet-200 transition-all text-left"
                >
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-900 text-sm">{user.displayName}</span>
                      {user.verified && <span className="text-violet-500 text-xs">✓</span>}
                    </div>
                    <span className="text-xs text-gray-400">@{user.username}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{formatCount(user.followers)} followers</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{user.totalRankings} rankings</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Categories</h2>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-xs text-violet-500 font-medium"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all text-left ${
                  activeCategory === cat.id
                    ? "border-violet-400 bg-violet-50"
                    : "border-transparent bg-white hover:border-gray-200 shadow-sm"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="font-semibold text-sm text-gray-800">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Topics */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} className="text-orange-500" />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              {activeCategory ? "Filtered Topics" : "Trending Now"}
            </h2>
          </div>

          {filteredTopics.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">🔍</span>
              <p className="text-gray-500 mt-2 text-sm">No topics found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTopics.map((topic, index) => (
                <button
                  key={topic.id}
                  onClick={() => router.push(`/topic/${topic.id}`)}
                  className="w-full flex gap-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all text-left"
                >
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <img
                      src={topic.coverImage}
                      alt={topic.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/60 rounded-lg flex items-center justify-center">
                      <span className="text-white text-[9px] font-black">#{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 py-3 pr-3">
                    <span className="text-xs text-violet-500 font-medium">
                      {CATEGORIES.find((c) => c.id === topic.category)?.emoji}{" "}
                      {CATEGORIES.find((c) => c.id === topic.category)?.name}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm mt-0.5 leading-tight">{topic.title}</h3>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Users size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{formatCount(topic.participantCount)} ranked this</span>
                      <span className="ml-2 flex items-center gap-0.5 text-xs text-orange-500">
                        <TrendingUp size={11} />
                        Hot
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {topic.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-gray-400">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
