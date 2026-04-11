'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { isMockAuthEnabled, loginWithGoogleCredential, loginWithMockUser } from "@/app/lib/ranksterApi";
import { useSession } from "@/app/lib/useMockSession";

const DEV_MOCK_USERS = [
  { username: "me", label: "Alex Rivera" },
  { username: "rankmaster99", label: "Jordan Miles" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { session, isLoading: isSessionLoading } = useSession();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const mockAuthEnabled = isMockAuthEnabled();

  useEffect(() => {
    if (!mockAuthEnabled && !isSessionLoading && session) {
      router.replace("/");
    }
  }, [isSessionLoading, mockAuthEnabled, router, session]);

  const handleLogin = () => {
    setError("Email login is not enabled yet. Use Google to continue.");
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError("Google sign-in did not return a credential.");
      return;
    }

    try {
      setIsSigningIn(true);
      setError("");
      await loginWithGoogleCredential(response.credential);
      router.replace("/");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Failed to sign in with Google.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleMockLogin = async (username: string) => {
    try {
      setIsSigningIn(true);
      setError("");
      await loginWithMockUser(username);
      router.replace("/dm");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Failed to sign in with mock user.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-14 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
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

        <div className="space-y-3">
          {mockAuthEnabled ? (
            <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-500">Dev chat testing</p>
              <p className="mt-1 text-xs text-gray-500">
                Pick one mock user here, then use an incognito/private window for the other user.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEV_MOCK_USERS.map((user) => (
                  <button
                    key={user.username}
                    type="button"
                    onClick={() => void handleMockLogin(user.username)}
                    className={`rounded-xl border px-3 py-2 text-left transition-all ${
                      session?.user.username === user.username
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-gray-100 bg-gray-50 text-gray-700 hover:border-violet-200"
                    }`}
                  >
                    <span className="block text-sm font-bold">{user.label}</span>
                    <span className="text-xs text-gray-400">@{user.username}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {googleClientId ? (
            <div className="flex justify-center rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <GoogleLogin
                onSuccess={(response) => void handleGoogleSuccess(response)}
                onError={() => setError("Google sign-in was cancelled or failed.")}
                text="continue_with"
                shape="pill"
                theme="outline"
                width="320"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Add <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable Google sign-in.
            </div>
          )}
          <p className="text-center text-xs font-medium text-gray-400">
            Google is the active sign-in method right now.
          </p>
        </div>

        <div className="relative my-6">
          <div className="h-px bg-gray-200" />
          <span className="absolute inset-x-0 -top-2 mx-auto w-fit bg-gray-50 px-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
            Or
          </span>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleLogin();
          }}
        >
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@example.com"
              autoComplete="email"
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
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-white rounded-xl px-4 py-3.5 pr-12 text-sm text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all"
              />
              <button
                type="button"
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

          {isSigningIn && (
            <p className="text-xs text-violet-600 font-medium">Signing you in with Google...</p>
          )}

          <div className="flex justify-end">
            <button type="button" className="text-xs text-violet-500 hover:text-violet-700 font-medium">
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            className="w-full mt-6 bg-violet-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg"
          >
            Continue with Email
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{" "}
          <button
            type="button"
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
