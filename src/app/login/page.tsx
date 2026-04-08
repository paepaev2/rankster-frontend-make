'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    // Auth logic goes here
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg mb-4">
            <Trophy size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Log in to continue ranking</p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@example.com"
              className="w-full mt-2 bg-white rounded-xl px-4 py-3.5 text-sm text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                className="w-full bg-white rounded-xl px-4 py-3.5 pr-12 text-sm text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          <div className="flex justify-end">
            <button className="text-xs text-violet-500 hover:text-violet-700 font-medium">
              Forgot password?
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full mt-6 bg-violet-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg"
        >
          Log In
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-violet-600 font-bold hover:text-violet-700"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
