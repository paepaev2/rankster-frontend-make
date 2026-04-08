'use client';

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Flame, Search, TrendingUp, Users, X } from "lucide-react";
import { fetchCategories, fetchSearchOverview, fetchTrendingTopics } from "../lib/ranksterApi";
import type { Category, SearchOverviewResponse, TrendingTopic, User } from "../lib/feedUi";

export function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [results, setResults] = useState<SearchOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      try {
        const [resolvedCategories, resolvedTrending] = await Promise.all([
          fetchCategories(),
          fetchTrendingTopics(),
        ]);

        if (!cancelled) {
          setCategories(resolvedCategories);
          setTrendingTopics(resolvedTrending);
        }
      } catch (searchError) {
        if (!cancelled) {
          setError(searchError instanceof Error ? searchError.message : "Failed to load search data.");
        }
      }
    }

    void loadInitialState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const normalizedQuery = deferredQuery.trim();
    if (!normalizedQuery) {
      setResults(null);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(() => {
      void fetchSearchOverview(normalizedQuery)
        .then((response) => {
          if (!cancelled) {
            setResults(response);
          }
        })
        .catch((searchError) => {
          if (!cancelled) {
            setError(searchError instanceof Error ? searchError.message : "Search failed.");
          }
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [deferredQuery]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const visibleUsers = results?.users ?? [];
  const visibleTopics = (results?.topics ?? trendingTopics).filter((topic) => {
    return activeCategory === null || topic.category === activeCategory;
  });

  const visibleCategories = results?.categories.length ? results.categories : categories;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="px-4 pt-12 pb-4">
          <h1 className="mb-3 text-2xl font-black text-gray-900">Discover</h1>
          <div className="relative">
            <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setError(null);
                setQuery(event.target.value);
              }}
              placeholder="Search topics, people, categories..."
              className="w-full rounded-2xl bg-gray-100 py-3 pr-10 pl-10 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            {query ? (
              <button
                onClick={() => {
                  setQuery("");
                  setResults(null);
                }}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
          {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        </div>
      </div>

      <div className="px-4 pb-6">
        {visibleUsers.length > 0 ? (
          <div className="mt-4">
            <h2 className="mb-3 text-sm font-bold tracking-wider text-gray-500 uppercase">People</h2>
            <div className="space-y-2">
              {visibleUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => router.push(`/profile/${user.username}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-all hover:border-violet-200"
                >
                  <Image
                    src={user.avatar}
                    alt={user.displayName}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-gray-900">{user.displayName}</span>
                      {user.verified ? <span className="text-xs text-violet-500">✓</span> : null}
                    </div>
                    <span className="text-xs text-gray-400">@{user.username}</span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-gray-500">{formatCount(user.followers)} followers</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{user.totalRankings} rankings</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wider text-gray-500 uppercase">Categories</h2>
            {activeCategory ? (
              <button onClick={() => setActiveCategory(null)} className="text-xs font-medium text-violet-500">
                Clear filter
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                className={`flex items-center gap-2.5 rounded-2xl border-2 p-3 text-left transition-all ${
                  activeCategory === category.id
                    ? "border-violet-400 bg-violet-50"
                    : "border-transparent bg-white shadow-sm hover:border-gray-200"
                }`}
              >
                <span className="text-2xl">{category.emoji}</span>
                <span className="text-sm font-semibold text-gray-800">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <h2 className="text-sm font-bold tracking-wider text-gray-500 uppercase">
              {activeCategory ? "Filtered Topics" : "Trending Now"}
            </h2>
          </div>

          {visibleTopics.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-4xl">🔍</span>
              <p className="mt-2 text-sm text-gray-500">No topics found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTopics.map((topic, index) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  index={index}
                  category={categoryMap.get(topic.category)}
                  onOpen={() => router.push(`/topic/${topic.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopicCard({
  topic,
  index,
  category,
  onOpen,
}: {
  topic: TrendingTopic;
  index: number;
  category?: Category;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
    >
      <div className="relative h-20 w-20 flex-shrink-0">
        <Image src={topic.coverImage} alt={topic.title} fill className="object-cover" sizes="80px" />
        <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-lg bg-black/60">
          <span className="text-[9px] font-black text-white">#{index + 1}</span>
        </div>
      </div>
      <div className="flex-1 py-3 pr-3">
        <span className="text-xs font-medium text-violet-500">
          {category?.emoji} {category?.name}
        </span>
        <h3 className="mt-0.5 text-sm leading-tight font-bold text-gray-900">{topic.title}</h3>
        <div className="mt-1.5 flex items-center gap-1">
          <Users size={11} className="text-gray-400" />
          <span className="text-xs text-gray-400">{formatCount(topic.participantCount)} ranked this</span>
          <span className="ml-2 flex items-center gap-0.5 text-xs text-orange-500">
            <TrendingUp size={11} />
            Hot
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {topic.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-gray-400">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

