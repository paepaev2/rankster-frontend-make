'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RankPostCard } from "@/app/components/RankPostCard";
import type { RankPost } from "@/app/lib/feedUi";
import { fetchPost } from "@/app/lib/ranksterApi";

export default function Topic() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<RankPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) {
      return;
    }

    void fetchPost(params.id)
      .then(setPost)
      .catch((postError) => {
        setError(postError instanceof Error ? postError.message : "Failed to load post.");
      });
  }, [params.id]);

  if (!post && !error) {
    return <div className="px-4 pt-16 text-sm text-gray-500">Loading post...</div>;
  }

  if (error || !post) {
    return <div className="px-4 pt-16 text-sm text-red-500">{error || "Post unavailable."}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-12 pb-24">
      <div className="mx-auto max-w-lg">
        <RankPostCard
          post={post}
          onProfileClick={() => router.push(`/profile/${post.user.username}`)}
          onRankThis={(postId) => router.push(`/create?sourcePost=${encodeURIComponent(postId)}`)}
        />
      </div>
    </div>
  );
}
