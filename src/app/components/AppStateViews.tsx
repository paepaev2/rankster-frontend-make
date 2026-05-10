import { AlertTriangle, RefreshCcw } from "lucide-react";
import { AppLogo } from "./AppLogo";

interface FeedSkeletonProps {
  count?: number;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-gray-100 ${className}`} />;
}

export function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 p-4 pb-3">
            <SkeletonBlock className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3 w-32" />
              <SkeletonBlock className="h-5 w-24" />
            </div>
            <SkeletonBlock className="h-8 w-8" />
          </div>
          <div className="h-36 animate-pulse bg-gray-100" />
          <div className="space-y-2 p-4">
            {["w-full", "w-11/12", "w-10/12", "w-8/12"].map((width) => (
              <div key={width} className="flex min-h-9 overflow-hidden rounded-xl border border-gray-100">
                <div className="w-14 animate-pulse bg-gray-200" />
                <div className="flex flex-1 items-center gap-2 px-3">
                  <SkeletonBlock className={`h-5 ${width}`} />
                </div>
              </div>
            ))}
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppLoadingState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="px-4 pt-12 pb-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppLogo />
              <SkeletonBlock className="h-6 w-28" />
            </div>
            <div className="flex gap-2">
              <SkeletonBlock className="h-9 w-9 rounded-xl" />
              <SkeletonBlock className="h-9 w-9 rounded-xl" />
            </div>
          </div>
          <div className="flex gap-3">
            <SkeletonBlock className="h-8 w-20 rounded-xl" />
            <SkeletonBlock className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="px-4 py-4">
        <FeedSkeleton />
      </div>
    </div>
  );
}

export function AppErrorState({
  title = "Something went wrong",
  message = "Rankster hit a problem while loading this page. Please try again.",
  onRetry,
  variant = "page",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: "page" | "inline";
}) {
  const shellClassName =
    variant === "page"
      ? "min-h-screen bg-gray-50 px-4 pt-20 pb-24"
      : "rounded-2xl border border-red-100 bg-white p-4";

  return (
    <div className={shellClassName}>
      <div className="mx-auto max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertTriangle size={26} />
        </div>
        <h1 className="mt-4 text-xl font-black text-gray-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
          >
            <RefreshCcw size={16} />
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
