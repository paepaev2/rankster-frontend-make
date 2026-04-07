'use client';

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Settings, Share2, UserPlus, UserCheck, Grid3X3, BarChart2, Heart } from "lucide-react";
import { USERS, MOCK_POSTS, MY_RANKINGS } from "../data/mockData";
import { TierListDisplay } from "../components/TierListDisplay";
import { CATEGORIES } from "../data/mockData";

const PROFILE_TABS = ["Rankings", "Liked", "Stats"];

export function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string | undefined;
  const [activeTab, setActiveTab] = useState("Rankings");
  const [following, setFollowing] = useState(false);

  // Determine which user to show
  const isMe = !username || username === "me";
  const currentUser = USERS[4]; // logged-in user
  const profileUser = isMe
    ? currentUser
    : USERS.find((u) => u.username === username || u.id === username) || USERS[0];

  const userPosts = isMe ? MY_RANKINGS : MOCK_POSTS.filter((p) => p.user.id === profileUser.id);
  const likedPosts = MOCK_POSTS.filter((p) => p.isLiked);

  const formatFollowers = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Controls */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="px-4 pt-12 pb-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-600">
            <ArrowLeft size={22} />
          </button>
          <span className="text-base font-bold text-gray-900">@{profileUser.username}</span>
          <div className="flex items-center gap-1">
            <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700">
              <Share2 size={19} />
            </button>
            {isMe && (
              <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700">
                <Settings size={19} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white">
        {/* Cover gradient */}
        <div className="h-28 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/30"
                style={{
                  width: `${40 + i * 20}px`,
                  height: `${40 + i * 20}px`,
                  top: `${Math.sin(i) * 30 + 20}%`,
                  left: `${i * 18}%`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative">
              <img
                src={profileUser.avatar}
                alt={profileUser.displayName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
              />
              {profileUser.verified && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white text-[10px]">✓</span>
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-12">
              {isMe ? (
                <button className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all">
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setFollowing(!following)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    following
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-violet-600 text-white hover:bg-violet-700"
                  }`}
                >
                  {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                  {following ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900">{profileUser.displayName}</h2>
              {profileUser.verified && (
                <span className="bg-violet-100 text-violet-600 text-xs font-bold px-2 py-0.5 rounded-full">Verified</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-2">@{profileUser.username}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{profileUser.bio}</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: "Rankings", value: profileUser.totalRankings },
              { label: "Followers", value: formatFollowers(profileUser.followers) },
              { label: "Following", value: formatFollowers(profileUser.following) },
              { label: "Likes", value: `${((userPosts.reduce((a, p) => a + p.likes, 0)) / 1000).toFixed(0)}k` },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-base font-black text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-t border-gray-100">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab
                  ? "text-violet-600 border-violet-600"
                  : "text-gray-400 border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        {/* Rankings */}
        {activeTab === "Rankings" && (
          <div className="space-y-3">
            {userPosts.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-4xl">📋</span>
                <p className="text-gray-400 mt-3 text-sm">No rankings yet</p>
                {isMe && (
                  <button
                    onClick={() => router.push("/create")}
                    className="mt-4 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all"
                  >
                    Create your first ranking
                  </button>
                )}
              </div>
            ) : (
              userPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="relative">
                    <img src={post.coverImage} alt={post.title} className="w-full h-28 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-3">
                      <span className="text-[10px] text-white/70 bg-white/20 px-2 py-0.5 rounded-full">
                        {CATEGORIES.find((c) => c.id === post.category)?.emoji}{" "}
                        {CATEGORIES.find((c) => c.id === post.category)?.name}
                      </span>
                      <h3 className="text-white font-bold text-sm mt-1">{post.title}</h3>
                    </div>
                  </div>
                  <div className="p-3">
                    <TierListDisplay tiers={post.tiers} compact />
                    <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart size={12} className="text-red-400" />
                        {(post.likes / 1000).toFixed(1)}k likes
                      </span>
                      <span>{post.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Liked */}
        {activeTab === "Liked" && (
          <div className="grid grid-cols-2 gap-3">
            {likedPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="relative">
                  <img src={post.coverImage} alt={post.title} className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-2">
                    <p className="text-white text-xs font-bold leading-tight line-clamp-2">{post.title}</p>
                  </div>
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1">
                    <img src={post.user.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                    <span className="text-[10px] text-gray-400">@{post.user.username}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {activeTab === "Stats" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-violet-500" />
                <h3 className="font-bold text-gray-900">Profile Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Rankings", value: profileUser.totalRankings, emoji: "🏆" },
                  { label: "Followers", value: formatFollowers(profileUser.followers), emoji: "👥" },
                  { label: "Following", value: formatFollowers(profileUser.following), emoji: "➡️" },
                  { label: "Total Likes", value: `${(userPosts.reduce((a, p) => a + p.likes, 0) / 1000).toFixed(1)}k`, emoji: "❤️" },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xl mb-1">{s.emoji}</div>
                    <p className="text-lg font-black text-gray-900">{s.value}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Favorite Categories</h3>
              {[
                { name: "Music", emoji: "🎵", pct: 40 },
                { name: "Gaming", emoji: "🎮", pct: 28 },
                { name: "Movies & TV", emoji: "🎬", pct: 20 },
                { name: "Sports", emoji: "🏀", pct: 12 },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span>{cat.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{cat.name}</span>
                      <span className="text-gray-400">{cat.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${cat.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
