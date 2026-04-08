'use client';

import { useDeferredValue, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { fetchSearchOverview, fetchTrendingTopics } from "../lib/ranksterApi";
import type { Category, SearchOverviewResponse, TrendingTopic } from "../lib/feedUi";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchOverviewResponse | null>(null);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    void fetchTrendingTopics()
      .then(setTrending)
      .catch((searchError) => {
        setError(searchError instanceof Error ? searchError.message : "Failed to load trending topics.");
      });
  }, []);

  useEffect(() => {
    const normalizedQuery = deferredQuery.trim();
    if (!normalizedQuery) {
      setResults(null);
      return;
    }

    const handle = window.setTimeout(() => {
      void fetchSearchOverview(normalizedQuery)
        .then(setResults)
        .catch((searchError) => {
          setError(searchError instanceof Error ? searchError.message : "Search failed.");
        });
    }, 200);

    return () => window.clearTimeout(handle);
  }, [deferredQuery]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-12 pb-24">
      <div className="mx-auto max-w-lg space-y-5">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Discover</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Search rankings</h1>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <Search size={18} className="text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search topics, people, or categories"
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        {results ? (
          <div className="space-y-5">
            <SectionTitle title="People" />
            <div className="space-y-3">
              {results.users.map((user) => (
                <Link key={user.id} href={`/profile/${user.username}`} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <Image src={user.avatar} alt={user.displayName} width={52} height={52} className="h-[52px] w-[52px] rounded-2xl object-cover" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{user.displayName}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </Link>
              ))}
            </div>

            <SectionTitle title="Topics" />
            <div className="grid grid-cols-1 gap-3">
              {results.topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>

            <SectionTitle title="Categories" />
            <div className="flex flex-wrap gap-2">
              {results.categories.map((category) => (
                <CategoryChip key={category.id} category={category} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SectionTitle title="Trending now" />
            <div className="space-y-3">
              {trending.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">{title}</h2>;
}

function TopicCard({ topic }: { topic: TrendingTopic }) {
  return (
    <Link href={`/topic/${topic.id}`} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <Image src={topic.coverImage} alt={topic.title} width={88} height={64} className="h-16 w-22 rounded-2xl object-cover" />
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">{topic.title}</p>
        <p className="mt-1 text-sm text-gray-500">{topic.participantCount.toLocaleString()} participants</p>
      </div>
    </Link>
  );
}

function CategoryChip({ category }: { category: Category }) {
  return (
    <div className={`rounded-full px-3 py-1.5 text-sm font-medium ${category.color}`}>
      {category.emoji} {category.name}
    </div>
  );
}
