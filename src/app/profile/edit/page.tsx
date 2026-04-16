'use client';

import React, { useEffect, useState } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { USERS } from "@/app/data/mockData";
import { ensureMockSession, fetchCurrentUserProfile, updateCurrentUserProfile, uploadImage } from "@/app/lib/ranksterApi";

function isSupportedAvatarUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" && (url.host === "localhost:8000" || url.host === "127.0.0.1:8000")) ||
      (url.protocol === "https:" && (url.hostname === "lh3.googleusercontent.com" || url.hostname === "images.unsplash.com"))
    );
  } catch {
    return false;
  }
}

export default function EditProfilePage() {
  const router = useRouter();
  const me = USERS[4];

  const [displayName, setDisplayName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio);
  const [avatarUrl, setAvatarUrl] = useState(me.avatar);
  const [avatarInput, setAvatarInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [username, setUsername] = useState(me.username);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await ensureMockSession();
        const profile = await fetchCurrentUserProfile();
        if (cancelled) {
          return;
        }
        setDisplayName(profile.user.displayName);
        setBio(profile.user.bio);
        setAvatarUrl(profile.user.avatar);
        setUsername(profile.user.username);
        setError(null);
      } catch (profileError) {
        if (!cancelled) {
          setError(profileError instanceof Error ? profileError.message : "Failed to load profile.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await ensureMockSession();
      await updateCurrentUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar: avatarUrl.trim(),
      });
      setSaved(true);
      router.push("/profile");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      await ensureMockSession();
      const uploaded = await uploadImage(file, "avatar");
      setAvatarUrl(uploaded.url);
      setAvatarInput(uploaded.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload profile photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const applyAvatarUrl = () => {
    const nextAvatarUrl = avatarInput.trim();
    if (!nextAvatarUrl) {
      return;
    }
    if (!isSupportedAvatarUrl(nextAvatarUrl)) {
      setError("Use an uploaded image, Google avatar, Unsplash image, or localhost backend image URL.");
      return;
    }
    setAvatarUrl(nextAvatarUrl);
    setAvatarInput("");
    setError(null);
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
            disabled={isSaving || isLoading}
            className="text-sm font-bold text-violet-600 hover:text-violet-800 transition-colors"
          >
            {saved ? "Saved ✓" : isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="px-4 pt-6 pb-12 space-y-6">
        {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <NextImage
              src={avatarUrl}
              alt="Profile picture"
              width={96}
              height={96}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-md"
              unoptimized
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-500 rounded-xl flex items-center justify-center border-2 border-white">
              <Camera size={14} className="text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Upload a photo or paste an image URL below</p>
          <label className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-violet-700">
            {isUploading ? "Uploading..." : "Upload Photo"}
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  void handleAvatarUpload(file);
                }
              }}
            />
          </label>
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
              <span>@{username}</span>
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
          disabled={isSaving || isLoading}
          className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saved ? "Saved ✓" : isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
