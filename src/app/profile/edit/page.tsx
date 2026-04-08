'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { USERS } from "@/app/data/mockData";

export default function EditProfilePage() {
  const router = useRouter();
  const me = USERS[4];

  const [displayName, setDisplayName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio);
  const [avatarUrl, setAvatarUrl] = useState(me.avatar);
  const [avatarInput, setAvatarInput] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save logic goes here (update context / call API)
    setSaved(true);
    setTimeout(() => router.push("/profile"), 800);
  };

  const applyAvatarUrl = () => {
    if (avatarInput.trim()) {
      setAvatarUrl(avatarInput.trim());
      setAvatarInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-4 pt-12 pb-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-bold text-gray-900">Edit Profile</h1>
          <button
            onClick={handleSave}
            className="text-sm font-bold text-violet-600 hover:text-violet-800 transition-colors"
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>

      <div className="px-4 pt-6 pb-12 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="Profile picture"
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-md"
              onError={(e) => { (e.target as HTMLImageElement).src = me.avatar; }}
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-500 rounded-xl flex items-center justify-center border-2 border-white">
              <Camera size={14} className="text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Paste an image URL below to change your photo</p>
          <div className="flex gap-2 w-full max-w-xs">
            <input
              type="text"
              value={avatarInput}
              onChange={(e) => setAvatarInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyAvatarUrl()}
              placeholder="https://..."
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <button
              onClick={applyAvatarUrl}
              className="px-3 py-2 bg-violet-100 text-violet-600 rounded-xl text-xs font-semibold hover:bg-violet-200 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {/* Display name */}
          <div className="p-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              className="w-full mt-2 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{displayName.length}/40</p>
          </div>

          {/* Username — read-only hint */}
          <div className="p-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
            <div className="mt-2 bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 flex items-center justify-between">
              <span>@{me.username}</span>
              <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Cannot change</span>
            </div>
          </div>

          {/* Bio */}
          <div className="p-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={160}
              placeholder="Tell the world what you rank..."
              className="w-full mt-2 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-all resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{bio.length}/160</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg"
        >
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
