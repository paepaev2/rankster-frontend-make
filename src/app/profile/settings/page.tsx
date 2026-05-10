'use client';

import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, UserCog } from "lucide-react";
import { logout } from "@/app/lib/ranksterApi";

export default function ProfileSettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-bold text-gray-900">Settings</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="space-y-3 px-4 pt-6">
        <button
          type="button"
          onClick={() => router.push("/profile/edit")}
          className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-brand-blue/25 hover:bg-brand-blue/10"
        >
          <span className="flex items-center gap-3">
            <span className="rounded-xl bg-brand-blue/15 p-2 text-brand-blue">
              <UserCog size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-900">Edit profile</span>
              <span className="block text-xs text-gray-400">Update your bio, avatar, and display name</span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-between rounded-2xl border border-red-100 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-red-200 hover:bg-red-50"
        >
          <span className="flex items-center gap-3">
            <span className="rounded-xl bg-red-100 p-2 text-red-500">
              <LogOut size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-900">Sign out</span>
              <span className="block text-xs text-gray-400">Clear your Rankster session on this device</span>
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
