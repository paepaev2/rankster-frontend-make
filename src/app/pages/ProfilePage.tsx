'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { RankPostCard } from "../components/RankPostCard";
import type { ProfileResponse } from "../lib/feedUi";
import { fetchCurrentUserProfile, fetchUserProfile } from "../lib/ranksterApi";
import { useMockSession } from "../lib/useMockSession";

export function ProfilePage() {
  const params = useParams<{ username?: string }>();
  const username = params?.username;
  const isMe = !username;
  const { session, isLoading: isAuthLoading, error: authError } = useMockSession();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMe) {
      if (!isAuthLoading && !authError) {
        void fetchCurrentUserProfile()
          .then(setProfile)
          .catch((profileError) => {
            setError(profileError instanceof Error ? profileError.message : "Failed to load profile.");
          });
      }
      return;
    }

    if (!username) {
      return;
    }

    void fetchUserProfile(username)
      .then(setProfile)
      .catch((profileError) => {
        setError(profileError instanceof Error ? profileError.message : "Failed to load profile.");
      });
  }, [authError, isAuthLoading, isMe, username]);

  if ((isMe && (isAuthLoading || !session)) || (!profile && !error)) {
    return <div className="px-4 pt-16 text-sm text-gray-500">Loading profile...</div>;
  }

  if (authError || error || !profile) {
    return <div className="px-4 pt-16 text-sm text-red-500">{authError || error || "Profile unavailable."}</div>;
  }

  const user = profile.user;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-12 pb-24">
      <div className="mx-auto max-w-lg space-y-4">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <Image src={user.avatar} alt={user.displayName} width={72} height={72} className="h-[72px] w-[72px] rounded-3xl object-cover" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                {isMe ? "Profile" : "Creator profile"}
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">{user.displayName}</h1>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-600">{user.bio}</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Followers" value={user.followers.toLocaleString()} />
            <Stat label="Following" value={user.following.toLocaleString()} />
            <Stat label="Rankings" value={user.totalRankings.toLocaleString()} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
              {isMe ? "Your rankings" : "Published rankings"}
            </h2>
            <span className="text-sm text-gray-400">{profile.rankings.length} posts</span>
          </div>
          {profile.rankings.map((post) => (
            <RankPostCard key={post.id} post={post} />
          ))}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-3 py-4 text-center">
      <p className="text-lg font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
