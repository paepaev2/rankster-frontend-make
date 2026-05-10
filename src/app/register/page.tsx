'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { AppLogo } from "@/app/components/AppLogo";
import { MobileTopBar } from "@/app/components/MobileTopBar";
import { loginWithGoogleCredential } from "@/app/lib/ranksterApi";
import { useSession } from "@/app/lib/useMockSession";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [googleError, setGoogleError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { session, isLoading: isSessionLoading } = useSession();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!isSessionLoading && session) {
      router.replace("/");
    }
  }, [isSessionLoading, router, session]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = "Name is required.";
    if (!username.trim()) e.username = "Username is required.";
    else if (!/^[a-z0-9_]{3,20}$/.test(username)) e.username = "3–20 chars, letters, numbers and _ only.";
    if (!email.trim()) e.email = "Email is required.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "At least 6 characters.";
    if (confirmPassword !== password) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleRegister = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setGoogleError("Email registration is not enabled yet. Use Google to create your account.");
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setGoogleError("Google sign-up did not return a credential.");
      return;
    }

    try {
      setIsSigningIn(true);
      setGoogleError("");
      await loginWithGoogleCredential(response.credential);
      router.replace("/");
    } catch (loginError) {
      setGoogleError(loginError instanceof Error ? loginError.message : "Failed to continue with Google.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    type = "text",
    extra?: React.ReactNode
  ) => (
    <div>
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</label>
      <div className="relative mt-2">
        <input
          type={type}
          value={value}
          onChange={(e) => { onChange(e.target.value); setErrors((prev) => ({ ...prev, [id]: "" })); }}
          placeholder={placeholder}
          autoComplete={id === "email" ? "email" : id === "username" ? "username" : id === "displayName" ? "name" : undefined}
          className={`w-full bg-white rounded-xl px-4 py-3 text-sm text-gray-800 border focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-transparent transition-all ${errors[id] ? "border-red-300" : "border-gray-200"}`}
        />
        {extra}
      </div>
      {errors[id] && <p className="text-xs text-red-500 mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MobileTopBar outerClassName="" innerClassName="px-4 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
      </MobileTopBar>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <AppLogo size="md" className="mb-3 shadow-lg" />
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">Start ranking everything</p>
        </div>

        <div className="space-y-3 mb-6">
          {googleClientId ? (
            <div className="flex justify-center rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <GoogleLogin
                onSuccess={(response) => void handleGoogleSuccess(response)}
                onError={() => setGoogleError("Google sign-up was cancelled or failed.")}
                text="signup_with"
                shape="pill"
                theme="outline"
                width="320"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-brand-yellow/35 bg-brand-yellow/15 px-4 py-3 text-sm text-brand-yellow-dark">
              Add <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable Google sign-up.
            </div>
          )}
          <p className="text-center text-xs font-medium text-gray-400">
            Google is the active account creation method right now.
          </p>
        </div>

        <div className="relative mb-6">
          <div className="h-px bg-gray-200" />
          <span className="absolute inset-x-0 -top-2 mx-auto w-fit bg-gray-50 px-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
            Or
          </span>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleRegister();
          }}
        >
          {field("displayName", "Display Name", displayName, setDisplayName, "Your name")}
          {field("username", "Username", username, (v) => setUsername(v.toLowerCase().replace(/\s/g, "_")), "e.g. tierqueen")}
          {field("email", "Email", email, setEmail, "you@example.com", "email")}

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: "" })); }}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                className={`w-full bg-white rounded-xl px-4 py-3 pr-12 text-sm text-gray-800 border focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-transparent transition-all ${errors.password ? "border-red-300" : "border-gray-200"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: "" })); }}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`w-full mt-2 bg-white rounded-xl px-4 py-3 text-sm text-gray-800 border focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-transparent transition-all ${errors.confirmPassword ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>
          {googleError && <p className="mt-3 text-xs text-red-500">{googleError}</p>}
          {isSigningIn && <p className="mt-3 text-xs text-brand-blue">Setting up your Google account...</p>}

          <button
            type="submit"
            className="w-full mt-6 bg-brand-blue text-white py-4 rounded-2xl font-bold text-base hover:bg-brand-blue-dark active:scale-[0.98] transition-all shadow-lg"
          >
            Continue with Email
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-brand-blue font-bold hover:text-brand-blue-dark"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
