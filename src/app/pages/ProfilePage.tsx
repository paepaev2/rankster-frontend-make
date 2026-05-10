'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart2, Bookmark, Heart, MessageCircle, Pin, PinOff, Search, Settings, Share2, UserCheck, UserPlus, Users, X } from "lucide-react";
import { RankPostCard } from "../components/RankPostCard";
import { hasUsableCoverImage, type ProfileResponse, type RankPost, type User } from "../lib/feedUi";
import { loginPathForReturnTo, messagePathForUsername } from "../lib/navigation";
import { useSaved } from "../lib/savedContext";
import {
  fetchCurrentUserProfile,
  fetchProfileFollowers,
  fetchProfileFollowing,
  fetchUserProfile,
  followUser,
  pinProfilePost,
  unfollowUser,
  unpinProfilePost,
} from "../lib/ranksterApi";
import { useMockSession } from "../lib/useMockSession";

const PROFILE_TABS = ["Rankings", "Saved", "Stats"] as const;
type RelationshipKind = "followers" | "following";

function ProfileSkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-gray-100 ${className}`} />;
}

function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <ProfileSkeletonBlock className="h-6 w-24" />
          <div className="flex gap-2">
            <ProfileSkeletonBlock className="h-9 w-9 rounded-xl" />
            <ProfileSkeletonBlock className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="bg-white">
        <div className="h-28 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
        <div className="px-4 pb-4">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <ProfileSkeletonBlock className="h-20 w-20 rounded-2xl ring-4 ring-white" />
            <div className="flex gap-2">
              <ProfileSkeletonBlock className="h-10 w-24 rounded-xl" />
              <ProfileSkeletonBlock className="h-10 w-24 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <ProfileSkeletonBlock className="h-6 w-44" />
            <ProfileSkeletonBlock className="h-4 w-24" />
            <ProfileSkeletonBlock className="h-4 w-full" />
            <ProfileSkeletonBlock className="h-4 w-3/4" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2 rounded-xl bg-gray-50 p-2">
                <ProfileSkeletonBlock className="mx-auto h-5 w-10" />
                <ProfileSkeletonBlock className="mx-auto h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 p-4">
                <ProfileSkeletonBlock className="h-10 w-10" />
                <div className="flex-1 space-y-2">
                  <ProfileSkeletonBlock className="h-3 w-32" />
                  <ProfileSkeletonBlock className="h-4 w-24" />
                </div>
              </div>
              <ProfileSkeletonBlock className="mx-4 h-5 w-48 rounded-lg" />
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, rowIndex) => (
                  <div key={rowIndex} className="flex min-h-9 overflow-hidden rounded-xl border border-gray-100">
                    <div className="w-12 animate-pulse bg-gray-200" />
                    <div className="flex flex-1 items-center px-3">
                      <ProfileSkeletonBlock className="h-5 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const router = useRouter();
  const params = useParams<{ username?: string }>();
  const username = params?.username;
  const isMe = !username || username === "me";
  const { session, isLoading: isAuthLoading, error: authError } = useMockSession();
  const { savedPosts, toggleSave } = useSaved();
  const [activeTab, setActiveTab] = useState<(typeof PROFILE_TABS)[number]>("Rankings");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [following, setFollowing] = useState(false);
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);
  const [isFollowUpdating, setIsFollowUpdating] = useState(false);
  const [relationshipModal, setRelationshipModal] = useState<RelationshipKind | null>(null);
  const [relationshipUsers, setRelationshipUsers] = useState<User[]>([]);
  const [relationshipTotal, setRelationshipTotal] = useState(0);
  const [relationshipQuery, setRelationshipQuery] = useState("");
  const [isRelationshipLoading, setIsRelationshipLoading] = useState(false);
  const [relationshipError, setRelationshipError] = useState<string | null>(null);
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
        const resolvedProfile = isMe ? await fetchCurrentUserProfile() : await fetchUserProfile(username ?? "");

        if (!cancelled) {
          setProfile(resolvedProfile);
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

  const filteredRelationshipUsers = useMemo(() => {
    const query = relationshipQuery.trim().toLowerCase();
    if (!query) {
      return relationshipUsers;
    }

    return relationshipUsers.filter((user) => {
      return (
        user.displayName.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.bio.toLowerCase().includes(query)
      );
    });
  }, [relationshipQuery, relationshipUsers]);

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
              stats: {
                ...current.stats,
                followers: Math.max(current.stats.followers + (nextFollowing ? 1 : -1), 0),
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
              stats: {
                ...current.stats,
                followers: Math.max(current.stats.followers + (previousFollowing ? 1 : -1), 0),
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

  const handleMessageProfile = () => {
    if (!profile || isMe) {
      return;
    }

    const messagePath = messagePathForUsername(profile.user.username);
    router.push(session ? messagePath : loginPathForReturnTo(messagePath));
  };

  const handleOpenRelationshipModal = async (kind: RelationshipKind) => {
    if (!profile) {
      return;
    }

    setRelationshipModal(kind);
    setRelationshipUsers([]);
    setRelationshipTotal(0);
    setRelationshipQuery("");
    setRelationshipError(null);
    setIsRelationshipLoading(true);

    try {
      const response =
        kind === "followers"
          ? await fetchProfileFollowers(profile.user.username)
          : await fetchProfileFollowing(profile.user.username);
      setRelationshipUsers(response.items);
      setRelationshipTotal(response.total);
    } catch (relationshipLoadError) {
      setRelationshipError(
        relationshipLoadError instanceof Error
          ? relationshipLoadError.message
          : `Failed to load ${kind}.`,
      );
    } finally {
      setIsRelationshipLoading(false);
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
    return <ProfilePageSkeleton />;
  }

  if (isMe && !session) {
    return (
      <div className="px-4 pt-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm text-gray-700">Sign in to see your profile, likes, and stats.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (!profile && !error) {
    return <ProfilePageSkeleton />;
  }

  if (authError || error || !profile) {
    return <div className="px-4 pt-16 text-sm text-red-500">{authError || error || "Profile unavailable."}</div>;
  }

  const profileUser = profile.user;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          {isMe ? (
            <span className="text-xl font-black text-gray-900">Profile</span>
          ) : (
            <button onClick={() => router.back()} className="text-gray-600" aria-label="Go back">
              <ArrowLeft size={22} />
            </button>
          )}
          {!isMe && (
            <span className="text-base font-bold text-gray-900">@{profileUser.username}</span>
          )}
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
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue to-brand-yellow">
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
                <span className="absolute right-[-4px] bottom-[-4px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-blue/100">
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
                <>
                  <button
                    onClick={handleMessageProfile}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-blue/10 px-4 py-2 text-sm font-bold text-brand-blue transition-all hover:bg-brand-blue/15"
                  >
                    <MessageCircle size={15} />
                    Message
                  </button>
                  <button
                    onClick={() => void handleFollowToggle()}
                    disabled={isFollowUpdating}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                      following
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-brand-blue text-white hover:bg-brand-blue-dark"
                    } ${isFollowUpdating ? "opacity-70" : ""}`}
                  >
                    {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    {isFollowUpdating ? "Updating..." : following ? "Following" : "Follow"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900">{profileUser.displayName}</h2>
              {profileUser.verified ? (
                <span className="rounded-full bg-brand-blue/15 px-2 py-0.5 text-xs font-bold text-brand-blue">Verified</span>
              ) : null}
            </div>
            <p className="mb-2 text-sm text-gray-400">@{profileUser.username}</p>
            <p className="text-sm leading-relaxed text-gray-700">{profileUser.bio}</p>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-base font-black text-gray-900">{profile.stats.totalRankings}</p>
              <p className="text-[10px] font-medium text-gray-400">Rankings</p>
            </div>
            <button
              type="button"
              onClick={() => void handleOpenRelationshipModal("followers")}
              className="rounded-xl text-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <p className="text-base font-black text-gray-900">{formatCount(profile.stats.followers)}</p>
              <p className="text-[10px] font-medium text-gray-400">Followers</p>
            </button>
            <button
              type="button"
              onClick={() => void handleOpenRelationshipModal("following")}
              className="rounded-xl text-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <p className="text-base font-black text-gray-900">{formatCount(profile.stats.following)}</p>
              <p className="text-[10px] font-medium text-gray-400">Following</p>
            </button>
            <div className="text-center">
              <p className="text-base font-black text-gray-900">{formatCount(profile.stats.totalLikes)}</p>
              <p className="text-[10px] font-medium text-gray-400">Likes</p>
            </div>
          </div>
        </div>

        {isMe && (
          <div className="flex gap-0 border-t border-gray-100">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 border-b-2 py-3 text-sm font-semibold transition-all ${
                  activeTab === tab ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-400"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
        {!isMe && <div className="border-t border-gray-100" />}
      </div>

      <div className="px-4 py-4">
        {(activeTab === "Rankings" || !isMe) ? (
          <div className="space-y-3">
            {sortedPosts.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl">📋</span>
                <p className="mt-3 text-sm text-gray-400">No rankings yet</p>
                {isMe ? (
                  <button
                    onClick={() => router.push("/create")}
                    className="mt-4 rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-blue-dark"
                  >
                    Create your first ranking
                  </button>
                ) : null}
              </div>
            ) : (
              sortedPosts.map((post) => {
                const isPinned = pinnedPostId === post.id;

                return (
                  <div key={post.id} className="relative">
                    {isPinned ? (
                      <div className="mb-2 flex items-center gap-1.5 rounded-xl border border-brand-blue/25 bg-brand-blue/10 px-3 py-2">
                        <Pin size={11} className="text-brand-blue" />
                        <span className="text-[11px] font-semibold text-brand-blue">Pinned ranking</span>
                      </div>
                    ) : null}
                    {isMe ? (
                      <button
                        onClick={() => void handlePinToggle(post.id)}
                        className={`absolute right-14 z-10 flex h-8 w-8 items-center justify-center rounded-xl shadow-sm transition-all ${
                          isPinned ? "top-14" : "top-3"
                        } ${
                          isPinned ? "bg-brand-blue/100 text-white" : "bg-black/40 text-white hover:bg-black/60"
                        }`}
                        title={isPinned ? "Unpin" : "Pin to profile"}
                      >
                        {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                    ) : null}
                    <RankPostCard
                      post={post}
                      onProfileClick={(user) => router.push(`/profile/${user.username}`)}
                      onTopicClick={(postId) => router.push(`/topic/${postId}`)}
                      onRankThis={(postId) => router.push(`/create?sourcePost=${encodeURIComponent(postId)}`)}
                      onEditTierList={(postId) => router.push(`/create?editPost=${encodeURIComponent(postId)}`)}
                      currentUser={session?.user}
                      isAuthLoading={isAuthLoading}
                      onPostUpdated={(updatedPost) => {
                        setProfile((current) =>
                          current
                            ? {
                                ...current,
                                rankings: current.rankings.map((currentPost) =>
                                  currentPost.id === updatedPost.id ? updatedPost : currentPost,
                                ),
                              }
                            : current,
                        );
                      }}
                      onPostDeleted={(postId) => {
                        setProfile((current) =>
                          current
                            ? {
                                ...current,
                                rankings: current.rankings.filter((currentPost) => currentPost.id !== postId),
                                pinnedPostId: current.pinnedPostId === postId ? null : current.pinnedPostId,
                              }
                            : current,
                        );
                        setPinnedPostId((current) => (current === postId ? null : current));
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>
        ) : null}

        {activeTab === "Saved" && isMe ? (
          savedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4">🔖</span>
              <h3 className="text-base font-bold text-gray-800 mb-1">No saved rankings yet</h3>
              <p className="text-sm text-gray-400 max-w-[220px]">
                Tap the bookmark icon on any ranking to save it and rank it yourself later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-medium">{savedPosts.length} saved</p>
              {savedPosts.map((post) => {
                const hasCoverImage = hasUsableCoverImage(post.coverImage);

                return (
                  <div
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/topic/${post.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/topic/${post.id}`);
                      }
                    }}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex gap-3 p-3 cursor-pointer transition-all hover:border-brand-blue/25 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  >
                    {hasCoverImage ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="64px" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 truncate">{post.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">by @{post.user.username}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <Heart size={11} className="text-red-400" />
                          {formatCount(post.likes)}
                        </span>
                        <span className="text-xs text-gray-400">{post.createdAt}</span>
                      </div>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSave(post);
                      }}
                      className="flex-shrink-0 self-center text-brand-blue hover:text-brand-blue-dark transition-colors p-1"
                      title="Remove from saved"
                    >
                      <Bookmark size={18} className="fill-brand-blue" />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : null}

        {activeTab === "Stats" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-brand-blue" />
                <h3 className="font-bold text-gray-900">Your Statistics</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Rankings", value: profile.stats.totalRankings, emoji: "🏆", color: "text-brand-blue" },
                  { label: "Total Likes", value: formatCount(profile.stats.totalLikes), emoji: "❤️", color: "text-red-500" },
                  { label: "Followers", value: formatCount(profile.stats.followers), emoji: "👥", color: "text-brand-blue" },
                  { label: "Following", value: formatCount(profile.stats.following), emoji: "➡️", color: "text-green-500" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-gray-50 p-3">
                    <div className="mb-1 text-xl">{stat.emoji}</div>
                    <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] font-medium text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-gray-900">Rankings by Category</h3>
              {profile.favoriteCategories.map((category) => (
                <div key={category.id} className="mb-3 flex items-center gap-3 last:mb-0">
                  <span className="w-7 text-lg">{category.emoji}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-gray-700">{category.name}</span>
                      <span className="text-gray-400">{category.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-brand-blue/100" style={{ width: `${category.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-gray-900">Milestones</h3>
              <div className="space-y-2.5">
                {[
                  { label: "First Ranking", done: true, emoji: "🎉" },
                  { label: "10 Rankings", done: true, emoji: "🔟" },
                  { label: "1k Likes", done: true, emoji: "❤️" },
                  { label: "50 Rankings", done: false, emoji: "⭐" },
                  { label: "10k Likes", done: false, emoji: "🚀" },
                ].map((m) => (
                  <div key={m.label} className={`flex items-center gap-3 rounded-xl p-2.5 ${m.done ? "bg-green-50" : "bg-gray-50"}`}>
                    <span className="text-lg">{m.emoji}</span>
                    <span className={`text-sm font-medium ${m.done ? "text-green-700" : "text-gray-400"}`}>{m.label}</span>
                    {m.done && <span className="ml-auto text-xs font-bold text-green-500">✓ Done</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {relationshipModal ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-3 py-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-sm sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-label={relationshipModal === "followers" ? "Followers list" : "Following list"}
          onClick={() => setRelationshipModal(null)}
        >
          <div
            className="flex h-[min(640px,calc(100dvh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-base font-black text-gray-900">@{profileUser.username}</h3>
                  <p className="text-xs font-medium text-gray-400">
                    {isRelationshipLoading
                      ? "Loading people..."
                      : `${formatCount(relationshipTotal)} ${relationshipTotal === 1 ? "person" : "people"}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRelationshipModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close list"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 border-b border-gray-100 px-3 pt-2">
              {(["followers", "following"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => void handleOpenRelationshipModal(kind)}
                  className={`border-b-2 px-3 py-3 text-sm font-black transition-colors ${
                    relationshipModal === kind
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {kind === "followers" ? "Followers" : "Following"}
                </button>
              ))}
            </div>

            <div className="border-b border-gray-100 px-4 py-3">
              <label className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2.5 text-gray-500">
                <Search size={16} />
                <input
                  value={relationshipQuery}
                  onChange={(event) => setRelationshipQuery(event.target.value)}
                  placeholder={`Search ${relationshipModal}`}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              {isRelationshipLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-2xl p-2">
                      <ProfileSkeletonBlock className="h-11 w-11" />
                      <div className="flex-1 space-y-2">
                        <ProfileSkeletonBlock className="h-4 w-32" />
                        <ProfileSkeletonBlock className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : relationshipError ? (
                <div className="rounded-2xl bg-red-50 px-4 py-5 text-center text-sm text-red-500">
                  {relationshipError}
                </div>
              ) : relationshipUsers.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-blue shadow-sm">
                    <Users size={20} />
                  </div>
                  <p className="text-sm font-bold text-gray-700">No people to show yet</p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    New in-app connections will appear here once people follow each other.
                  </p>
                </div>
              ) : filteredRelationshipUsers.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center">
                  <p className="text-sm font-bold text-gray-700">No matches</p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    Try a display name or username from this list.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredRelationshipUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setRelationshipModal(null);
                        router.push(`/profile/${user.username}`);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    >
                      <Image
                        src={user.avatar}
                        alt={user.displayName}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-black text-gray-900">{user.displayName}</p>
                          {user.verified ? (
                            <span className="rounded-full bg-brand-blue/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-blue">
                              ✓
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-gray-400">@{user.username}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">
                        View
                      </span>
                    </button>
                  ))}
                  {relationshipTotal > relationshipUsers.length ? (
                    <p className="px-2 pt-2 text-center text-[11px] text-gray-400">
                      Showing {relationshipUsers.length} of {formatCount(relationshipTotal)} people
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}
