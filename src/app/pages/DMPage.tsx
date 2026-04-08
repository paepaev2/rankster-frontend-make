import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchMessageThreads } from "../lib/ranksterApi";
import { useMockSession } from "../lib/useMockSession";
import type { Message } from "../lib/feedUi";

export function DMPage() {
  const { session, isLoading: isAuthLoading, error: authError } = useMockSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !authError) {
      void fetchMessageThreads()
        .then(setMessages)
        .catch((messageError) => {
          setError(messageError instanceof Error ? messageError.message : "Failed to load messages.");
        });
    }
  }, [isAuthLoading, authError]);

  if (isAuthLoading || !session) {
    return <div className="px-4 pt-16 text-sm text-gray-500">Loading messages...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-12 pb-24">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Messages</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Direct messages</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">Signed in as {session.user.displayName}. Your message list is now coming from the backend contract.</p>
        </div>

        {authError || error ? (
          <div className="rounded-3xl border border-red-100 bg-white p-5 text-sm text-red-500 shadow-sm">{authError || error}</div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <Image src={message.user.avatar} alt={message.user.displayName} width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold text-gray-900">{message.user.displayName}</p>
                    <span className="text-xs text-gray-400">{message.timestamp}</span>
                  </div>
                  <p className="truncate text-sm text-gray-600">{message.lastMessage}</p>
                </div>
                {message.unread > 0 && (
                  <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-violet-500 px-2 text-xs font-bold text-white">
                    {message.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
