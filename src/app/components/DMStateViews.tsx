import { MobileTopBar } from "./MobileTopBar";

function DMSkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-gray-100 ${className}`} />;
}

export function DMPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileTopBar>
        <div className="mb-3 flex items-center justify-between">
          <DMSkeletonBlock className="h-8 w-32" />
          <DMSkeletonBlock className="h-9 w-9 rounded-xl" />
        </div>
        <DMSkeletonBlock className="h-10 w-full rounded-2xl" />
      </MobileTopBar>
      <DMThreadListSkeleton />
    </div>
  );
}

export function DMThreadListSkeleton() {
  return (
    <>
      <div className="border-b border-gray-100 bg-white px-4 py-3">
        <DMSkeletonBlock className="mb-3 h-3 w-20" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-shrink-0 flex-col items-center gap-2">
              <DMSkeletonBlock className="h-12 w-12" />
              <DMSkeletonBlock className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1 px-4 py-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-2xl p-3">
            <DMSkeletonBlock className="h-12 w-12 flex-shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <DMSkeletonBlock className="h-4 w-32" />
                <DMSkeletonBlock className="h-3 w-12" />
              </div>
              <DMSkeletonBlock className="h-3 w-48 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function DMConversationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <DMSkeletonBlock className="h-7 w-7 self-end" />
        <div className="space-y-1">
          <DMSkeletonBlock className="h-10 w-52 rounded-2xl" />
          <DMSkeletonBlock className="h-2.5 w-14" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="space-y-1">
          <DMSkeletonBlock className="h-10 w-44 rounded-2xl" />
          <DMSkeletonBlock className="ml-auto h-2.5 w-14" />
        </div>
      </div>
      <div className="flex gap-2">
        <DMSkeletonBlock className="h-7 w-7 self-end" />
        <div className="space-y-1">
          <DMSkeletonBlock className="h-10 w-60 rounded-2xl" />
          <DMSkeletonBlock className="h-2.5 w-14" />
        </div>
      </div>
    </div>
  );
}
