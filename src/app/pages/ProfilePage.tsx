'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart2, Heart, Pin, PinOff, Settings, Share2, UserCheck, UserPlus } from "lucide-react";
import { TierListDisplay } from "../components/TierListDisplay";
import type { Category, ProfileResponse, RankPost } from "../lib/feedUi";
import {
  fetchCategories,
  fetchCurrentUserProfile,
  fetchUserProfile,
  followUser,
  pinProfilePost,
  unfollowUser,
  unpinProfilePost,
} from "../lib/ranksterApi";
import { useMockSession } from "../lib/useMockSession";

const PROFILE_TABS = ["Rankings", "Liked", "Stats"] as const;

export function ProfilePage() {
  const router = useRouter();
  const params = useParams<{ username?: string }>();
  const username = params?.username;
  const isMe = !username || username === "me";
  const { session, isLoading: isAuthLoading, error: authError } = useMockSession();
  const [activeTab, setActiveTab] = useState<(typeof PROFILE_TABS)[number]>("Rankings");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [following, setFollowing] = useState(false);
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);
  const [isFollowUpdating, setIsFollowUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMe && (isAuthLoading || authError)) {
      return;
    }

    if (isMe && !session) {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const [resolvedProfile, resolvedCategories] = await Promise.all([
          isMe ? fetchCurrentUserProfile() : fetchUserProfile(username ?? ""),
          fetchCategories(),
        ]);

        if (!cancelled) {
          setProfile(resolvedProfile);
          setCategories(resolvedCategories);
          setFollowing(resolvedProfile.isFollowing);
          setPinnedPostId(resolvedProfile.pinnedPostId);
          setError(null);
        }
      } catch (profileError) {
        if (!cancelled) {
          setError(profileError instanceof Error ? profileError.message : "Failed to load profile.");
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [authError, isAuthLoading, isMe, username]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const sortedPosts = useMemo(() => {
    if (!profile) {
      return [] as RankPost[];
    }
    if (!pinnedPostId) {
      return profile.rankings;
    }
    return [
      ...profile.rankings.filter((post) => post.id === pinnedPostId),
      ...profile.rankings.filter((post) => post.id !== pinnedPostId),
    ];
  }, [pinnedPostId, profile]);

  const handleFollowToggle = async () => {
    if (!profile || isMe || isFollowUpdating) {
      return;
    }

    const previousFollowing = following;
    const targetUsername = profile.user.username;

    try {
      setIsFollowUpdating(true);
      const nextFollowing = !previousFollowing;
      setFollowing(nextFollowing);
      setProfile((current) =>
        current
          ? {
              ...current,
              user: {
                ...current.user,
                followers: Math.max(current.user.followers + (nextFollowing ? 1 : -1), 0),
              },
            }
          : current,
      );

      const response = nextFollowing
        ? await followUser(targetUsername)
        : await unfollowUser(targetUsername);

      setFollowing(response.isFollowing);
      setProfile((current) =>
        current
          ? {
              ...current,
              isFollowing: response.isFollowing,
            }
          : current,
      );
    } catch (followError) {
      setFollowing(previousFollowing);
      setProfile((current) =>
        current
          ? {
              ...current,
              user: {
                ...current.user,
                followers: Math.max(current.user.followers + (previousFollowing ? 1 : -1), 0),
              },
              isFollowing: previousFollowing,
            }
          : current,
      );
      setError(followError instanceof Error ? followError.message : "Failed to update follow state.");
    } finally {
      setIsFollowUpdating(false);
    }
  };

  const handlePinToggle = async (postId: string) => {
    if (!isMe) {
      return;
    }

    const nextPinned = pinnedPostId === postId ? null : postId;
    setPinnedPostId(nextPinned);

    try {
      if (nextPinned) {
        await pinProfilePost(postId);
      } else {
        await unpinProfilePost(postId);
      }
    } catch (pinError) {
      setPinnedPostId((current) => (current === postId ? null : postId));
      setError(pinError instanceof Error ? pinError.message : "Failed to update pinned ranking.");
    }
  };

  if (isMe && isAuthLoading) {
    return <div className="px-4 pt-16 text-sm text-gray-500">Loading profile...</div>;
  }

  if (isMe && !session) {
    return (
      <div className="px-4 pt-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm text-gray-700">Sign in to see your profile, likes, and stats.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (!profile && !error) {
    return <div className="px-4 pt-16 text-sm text-gray-500">Loading profile...</div>;
  }

  if (authError || error || !profile) {
    return <div className="px-4 pt-16 text-sm text-red-500">{authError || error || "Profile unavailable."}</div>;
  }

  const profileUser = profile.user;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <button onClick={() => router.back()} className="text-gray-600" aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <span className="text-base font-bold text-gray-900">@{profileUser.username}</span>
          <div className="flex items-center gap-1">
            <button className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors hover:text-gray-700" aria-label="Share profile">
              <Share2 size={19} />
            </button>
            {isMe ? (
              <button
                onClick={() => router.push("/profile/settings")}
                className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors hover:text-gray-700"
                aria-label="Profile settings"
              >
                <Settings size={19} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600">
          <div className="absolute inset-0 opacity-20">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="absolute rounded-full bg-white/30"
                style={{
                  width: `${40 + index * 20}px`,
                  height: `${40 + index * 20}px`,
                  top: `${Math.sin(index) * 30 + 20}%`,
                  left: `${index * 18}%`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="mb-3 flex items-end justify-between -mt-10">
            <div className="relative">
              <Image
                src={profileUser.avatar}
                alt={profileUser.displayName}
                width={80}
                height={80}
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
              />
              {profileUser.verified ? (
                <span className="absolute right-[-4px] bottom-[-4px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-500">
                  <span className="text-[10px] text-white">✓</span>
                </span>
              ) : null}
            </div>
            <div className="mt-12 flex gap-2">
              {isMe ? (
                <button
                  onClick={() => router.push("/profile/edit")}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-200"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => void handleFollowToggle()}
                  disabled={isFollowUpdating}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    following
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-violet-600 text-white hover:bg-violet-700"
                  } ${isFollowUpdating ? "opacity-70" : ""}`}
                >
                  {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                  {isFollowUpdating ? "Updating..." : following ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900">{profileUser.displayName}</h2>
              {profileUser.verified ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-600">Verified</span>
              ) : null}
            </div>
            <p className="mb-2 text-sm text-gray-400">@{profileUser.username}</p>
            <p className="text-sm leading-relaxed text-gray-700">{profileUser.bio}</p>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: "Rankings", value: profile.stats.totalRankings },
              { label: "Followers", value: formatFollowers(profile.stats.followers) },
              { label: "Following", value: formatFollowers(profile.stats.following) },
              { label: "Likes", value: `${(profile.stats.totalLikes / 1000).toFixed(0)}k` },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-base font-black text-gray-900">{stat.value}</p>
                <p className="text-[10px] font-medium text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-0 border-t border-gray-100">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 border-b-2 py-3 text-sm font-semibold transition-all ${
                activeTab === tab ? "border-violet-600 text-violet-600" : "border-transparent text-gray-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === "Rankings" ? (
          <div className="space-y-3">
            {sortedPosts.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl">📋</span>
                <p className="mt-3 text-sm text-gray-400">No rankings yet</p>
                {isMe ? (
                  <button
                    onClick={() => router.push("/create")}
                    className="mt-4 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-700"
                  >
                    Create your first ranking
                  </button>
                ) : null}
              </div>
            ) : (
              sortedPosts.map((post) => {
                const isPinned = pinnedPostId === post.id;
                const category = categoryMap.get(post.category);
                return (
                  <div
                    key={post.id}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                      isPinned ? "border-violet-300 ring-1 ring-violet-200" : "border-gray-100"
                    }`}
                  >
                    {isPinned ? (
                      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
                        <Pin size={11} className="text-violet-500" />
                        <span className="text-[11px] font-semibold text-violet-500">Pinned ranking</span>
                      </div>
                    ) : null}
                    <div className="relative">
                      <div className="relative h-28 w-full">
                        <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 448px" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 p-3">
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white/70">
                          {category?.emoji} {category?.name}
                        </span>
                        <h3 className="mt-1 text-sm font-bold text-white">{post.title}</h3>
                      </div>
                      {isMe ? (
                        <button
                          onClick={() => void handlePinToggle(post.id)}
                          className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-xl shadow-sm transition-all ${
                            isPinned ? "bg-violet-500 text-white" : "bg-black/40 text-white hover:bg-black/60"
                          }`}
                          title={isPinned ? "Unpin" : "Pin to profile"}
                        >
                          {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <TierListDisplay tiers={post.tiers} compact />
                      <div className="mt-2.5 flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Heart size={12} className="text-red-400" />
                          {(post.likes / 1000).toFixed(1)}k likes
                        </span>
                        <span>{post.createdAt}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}

        {activeTab === "Liked" ? (
          <div className="grid grid-cols-2 gap-3">
            {profile.likedPosts.map((post) => (
              <div key={post.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="relative">
                  <div className="relative h-24 w-full">
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 220px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 p-2">
                    <p className="line-clamp-2 text-xs leading-tight font-bold text-white">{post.title}</p>
                  </div>
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1">
                    <Image src={post.user.avatar} alt="" width={16} height={16} className="h-4 w-4 rounded-full object-cover" />
                    <span className="text-[10px] text-gray-400">@{post.user.username}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "Stats" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-violet-500" />
                <h3 className="font-bold text-gray-900">Profile Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Rankings", value: profile.stats.totalRankings, emoji: "🏆" },
                  { label: "Followers", value: formatFollowers(profile.stats.followers), emoji: "👥" },
                  { label: "Following", value: formatFollowers(profile.stats.following), emoji: "➡️" },
                  { label: "Total Likes", value: `${(profile.stats.totalLikes / 1000).toFixed(1)}k`, emoji: "❤️" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-gray-50 p-3">
                    <div className="mb-1 text-xl">{stat.emoji}</div>
                    <p className="text-lg font-black text-gray-900">{stat.value}</p>
                    <p className="text-[10px] font-medium text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-gray-900">Favorite Categories</h3>
              {profile.favoriteCategories.map((category) => (
                <div key={category.id} className="mb-3 flex items-center gap-3 last:mb-0">
                  <span>{category.emoji}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-gray-700">{category.name}</span>
                      <span className="text-gray-400">{category.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${category.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatFollowers(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}
