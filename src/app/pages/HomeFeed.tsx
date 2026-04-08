'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trophy, Flame } from "lucide-react";
import { MOCK_POSTS, USERS } from "../data/mockData";
import { RankPostCard } from "../components/RankPostCard";

const FILTER_TABS = ["For You", "Following"];

export function HomeFeed() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("For You");

  const currentUser = USERS[4]; // "me"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-12 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
                <Trophy size={16} className="text-white" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">Rankit</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/leaderboard")}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-violet-50 text-violet-500 transition-colors"
              >
                <Flame size={20} />
              </button>
              <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-violet-200"
              >
                <img src={currentUser.avatar} alt="me" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 pb-0">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab
                    ? "text-violet-600 border-violet-600"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 py-4 space-y-4">
        {MOCK_POSTS.map((post) => (
          <RankPostCard
            key={post.id}
            post={post}
            onProfileClick={(id) => router.push(`/profile/${id}`)}
            onTopicClick={(postId) => router.push(`/topic/${postId}`)}
          />
        ))}

        <div className="text-center py-6">
          <button className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-all shadow-sm">
            Load more rankings
          </button>
        </div>
      </div>
    </div>
  );
}
