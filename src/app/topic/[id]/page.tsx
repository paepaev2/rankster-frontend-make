'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Layers, Users } from "lucide-react";
import { RankPostCard } from "@/app/components/RankPostCard";
import { hasUsableCoverImage, type TopicDetailResponse } from "@/app/lib/feedUi";
import { fetchTopicDetail } from "@/app/lib/ranksterApi";
import { useMockSession } from "@/app/lib/useMockSession";

export default function Topic() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<TopicDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { session, isLoading: isAuthLoading } = useMockSession();

  useEffect(() => {
    if (!params.id) {
      return;
    }

    setDetail(null);
    setError(null);
    void fetchTopicDetail(params.id)
      .then(setDetail)
      .catch((topicError) => {
        setError(topicError instanceof Error ? topicError.message : "Failed to load topic.");
      });
  }, [params.id]);

  if (!detail && !error) {
    return <div className="px-4 pt-16 text-sm text-gray-500">Loading topic...</div>;
  }

  if (error || !detail) {
    return <div className="px-4 pt-16 text-sm text-red-500">{error || "Topic unavailable."}</div>;
  }

  const hasCoverImage = hasUsableCoverImage(detail.topic.coverImage);

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-10 pb-24">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {hasCoverImage ? (
            <div className="relative h-36">
              <Image src={detail.topic.coverImage} alt={detail.topic.title} fill className="object-cover" sizes="520px" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <button
                type="button"
                onClick={() => router.back()}
                className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-white/70">Topic</p>
                <h1 className="mt-1 text-xl font-black leading-tight text-white">{detail.topic.title}</h1>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">Topic</p>
              <h1 className="mt-1 text-xl font-black leading-tight text-gray-900">{detail.topic.title}</h1>
            </div>
          )}
          <div className="flex items-center gap-4 border-t border-gray-100 px-4 py-3 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-brand-blue" />
              {formatCount(detail.topic.participantCount)} ranked this
            </span>
            <span className="flex items-center gap-1.5">
              <Layers size={14} className="text-brand-blue" />
              {detail.posts.length} {detail.posts.length === 1 ? "post" : "posts"}
            </span>
          </div>
        </div>

        {detail.posts.map((post) => (
          <RankPostCard
            key={post.id}
            post={post}
            onProfileClick={(user) => router.push(`/profile/${user.username}`)}
            onTopicClick={(topicId) => router.push(`/topic/${encodeURIComponent(topicId)}`)}
            onRankThis={(postId) => router.push(`/create?sourcePost=${encodeURIComponent(postId)}`)}
            onTagClick={(tag) => router.push(`/search?q=${encodeURIComponent(`#${tag}`)}`)}
            onEditTierList={(postId) => router.push(`/create?editPost=${encodeURIComponent(postId)}`)}
            currentUser={session?.user}
            isAuthLoading={isAuthLoading}
            onPostUpdated={(updatedPost) => {
              setDetail((current) => {
                if (!current) {
                  return current;
                }
                return {
                  ...current,
                  posts: current.posts.map((postItem) => postItem.id === updatedPost.id ? updatedPost : postItem),
                };
              });
            }}
            onPostDeleted={(postId) => {
              setDetail((current) => {
                if (!current) {
                  return current;
                }
                return {
                  ...current,
                  posts: current.posts.filter((postItem) => postItem.id !== postId),
                };
              });
            }}
          />
        ))}
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
