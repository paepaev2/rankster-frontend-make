'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    // Auth logic goes here
    router.push("/");
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
          className={`w-full bg-white rounded-xl px-4 py-3 text-sm text-gray-800 border focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all ${errors[id] ? "border-red-300" : "border-gray-200"}`}
        />
        {extra}
      </div>
      {errors[id] && <p className="text-xs text-red-500 mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="px-4 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg mb-3">
            <Trophy size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">Start ranking everything</p>
        </div>

        <div className="space-y-3">
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
                className={`w-full bg-white rounded-xl px-4 py-3 pr-12 text-sm text-gray-800 border focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all ${errors.password ? "border-red-300" : "border-gray-200"}`}
              />
              <button
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
              className={`w-full mt-2 bg-white rounded-xl px-4 py-3 text-sm text-gray-800 border focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all ${errors.confirmPassword ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>

        <button
          onClick={handleRegister}
          className="w-full mt-6 bg-violet-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg"
        >
          Create Account
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-violet-600 font-bold hover:text-violet-700"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
