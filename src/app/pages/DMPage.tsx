'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Image as ImageIcon, Search, Send, Smile } from "lucide-react";
import { loginPathForReturnTo, messagePathForUsername } from "../lib/navigation";
import { fetchMessageThread, fetchMessageThreads, getMessageThreadSocketUrl, sendMessage, startMessageThread } from "../lib/ranksterApi";
import { useMockSession } from "../lib/useMockSession";
import type { ChatMessage, ChatSocketEvent, Message, MessageThreadDetail } from "../lib/feedUi";

type SocketStatus = "idle" | "connecting" | "connected" | "fallback";

function DMSkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-gray-100 ${className}`} />;
}

function DMPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="px-4 pt-12 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <DMSkeletonBlock className="h-8 w-32" />
            <DMSkeletonBlock className="h-9 w-9 rounded-xl" />
          </div>
          <DMSkeletonBlock className="h-10 w-full rounded-2xl" />
        </div>
      </div>
      <DMThreadListSkeleton />
    </div>
  );
}

function DMThreadListSkeleton() {
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

function DMConversationSkeleton() {
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

interface DMPageProps {
  initialUsername?: string;
}

function buildThreadSummary(thread: MessageThreadDetail): Message {
  const lastMessage = thread.messages.at(-1);
  return {
    id: thread.id,
    user: thread.user,
    lastMessage: lastMessage?.text ?? "Say hi to start the conversation",
    timestamp: lastMessage?.timestamp ?? "now",
    unread: 0,
  };
}

export function DMPage({ initialUsername }: DMPageProps) {
  const router = useRouter();
  const { session, isLoading: isAuthLoading, error: authError } = useMockSession();
  const [threads, setThreads] = useState<Message[]>([]);
  const [isThreadsLoading, setIsThreadsLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<MessageThreadDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const startedUsernameRef = useRef<string | null>(null);

  const appendMessage = useCallback((threadId: string, message: ChatMessage) => {
    setActiveThread((current) => {
      if (!current || current.id !== threadId || current.messages.some((entry) => entry.id === message.id)) {
        return current;
      }
      return {
        ...current,
        messages: [...current.messages, message],
      };
    });
    setThreads((currentThreads) => {
      const currentThread = currentThreads.find((thread) => thread.id === threadId);
      if (!currentThread) {
        return currentThreads;
      }
      const updated: Message = {
        ...currentThread,
        lastMessage: message.text,
        timestamp: message.timestamp,
        unread: 0,
      };
      return [updated, ...currentThreads.filter((thread) => thread.id !== threadId)];
    });
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (authError) {
      setIsThreadsLoading(false);
      return;
    }

    let cancelled = false;
    setIsThreadsLoading(true);
    void fetchMessageThreads()
      .then((items) => {
        if (!cancelled) {
          setThreads(items);
        }
      })
      .catch((messageError) => {
        if (!cancelled) {
          setError(messageError instanceof Error ? messageError.message : "Failed to load messages.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsThreadsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, authError]);

  useEffect(() => {
    const username = initialUsername?.trim();
    if (!username || isAuthLoading || authError || !session || startedUsernameRef.current === username) {
      return;
    }

    let cancelled = false;
    startedUsernameRef.current = username;
    setIsThreadLoading(true);
    setError(null);

    void startMessageThread(username)
      .then((thread) => {
        if (cancelled) {
          return;
        }

        setActiveThread(thread);
        setActiveThreadId(thread.id);
        setThreads((currentThreads) => [
          buildThreadSummary(thread),
          ...currentThreads.filter((item) => item.id !== thread.id),
        ]);
        router.replace("/dm", { scroll: false });
      })
      .catch((threadError) => {
        if (!cancelled) {
          startedUsernameRef.current = null;
          setError(threadError instanceof Error ? threadError.message : "Failed to start conversation.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsThreadLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authError, initialUsername, isAuthLoading, router, session]);

  useEffect(() => {
    if (!activeThreadId) {
      setActiveThread(null);
      setSocketStatus("idle");
      return;
    }

    let cancelled = false;
    setIsThreadLoading(true);

    void fetchMessageThread(activeThreadId)
      .then((thread) => {
        if (!cancelled) {
          setActiveThread(thread);
          setThreads((currentThreads) =>
            currentThreads.map((item) => (item.id === thread.id ? { ...item, unread: 0 } : item)),
          );
          window.dispatchEvent(new Event("rankster:messages-read"));
        }
      })
      .catch((threadError) => {
        if (!cancelled) {
          setError(threadError instanceof Error ? threadError.message : "Failed to load conversation.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsThreadLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeThreadId]);

  useEffect(() => {
    if (!activeThreadId || isThreadLoading) {
      return;
    }

    let socket: WebSocket;
    try {
      socket = new WebSocket(getMessageThreadSocketUrl(activeThreadId));
    } catch (socketError) {
      setSocketStatus("fallback");
      setError(socketError instanceof Error ? socketError.message : "Realtime chat is unavailable.");
      return;
    }

    socketRef.current = socket;
    setSocketStatus("connecting");

    socket.onopen = () => {
      setSocketStatus("connected");
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as ChatSocketEvent;
        if (payload.type === "message" && payload.message) {
          appendMessage(payload.threadId, payload.message);
          setIsSending(false);
        }
        if (payload.type === "error" && payload.error) {
          setError(payload.error);
          setIsSending(false);
        }
      } catch {
        setError("Received an unreadable chat update.");
      }
    };

    socket.onerror = () => {
      setSocketStatus("fallback");
    };

    socket.onclose = () => {
      setSocketStatus((current) => (current === "connected" || current === "connecting" ? "fallback" : current));
      setIsSending(false);
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [activeThreadId, appendMessage, isThreadLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeThread?.messages.length]);

  const filteredThreads = threads.filter((thread) => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return true;
    }
    return (
      thread.user.displayName.toLowerCase().includes(normalized) ||
      thread.user.username.toLowerCase().includes(normalized)
    );
  });

  const openThread = (thread: Message) => {
    setError(null);
    setActiveThreadId(thread.id);
  };

  const handleSendMessage = async () => {
    if (!activeThreadId || !newMessage.trim()) {
      return;
    }

    const text = newMessage.trim();
    setNewMessage("");
    setError(null);
    setIsSending(true);

    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "message", text }));
      return;
    }

    try {
      const created = await sendMessage(activeThreadId, text);
      appendMessage(activeThreadId, created);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send message.");
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  if (isAuthLoading) {
    return <DMPageSkeleton />;
  }

  if (!session) {
    const returnPath = initialUsername ? messagePathForUsername(initialUsername) : "/dm";
    return (
      <div className="px-4 pt-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm text-gray-700">
            {initialUsername ? `Sign in to message @${initialUsername}.` : "Sign in to open your direct messages."}
          </p>
          <button
            onClick={() => router.push(loginPathForReturnTo(returnPath))}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (activeThreadId) {
    const activeChatUser = activeThread?.user ?? threads.find((thread) => thread.id === activeThreadId)?.user;

    return (
      <div className="fixed top-0 bottom-16 left-1/2 z-40 flex w-full max-w-lg -translate-x-1/2 flex-col overflow-hidden bg-white">
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-100 bg-white/95 px-4 pt-12 pb-4 backdrop-blur-md">
          <button onClick={() => setActiveThreadId(null)} className="text-gray-500 transition-colors hover:text-gray-700" aria-label="Back to messages">
            <ArrowLeft size={22} />
          </button>
          {activeChatUser ? (
            <>
              <Image
                src={activeChatUser.avatar}
                alt={activeChatUser.displayName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-bold text-gray-900">{activeChatUser.displayName}</p>
                <p className="text-xs font-medium text-green-500">Active now</p>
              </div>
            </>
          ) : null}
          <div className="ml-auto">
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                socketStatus === "connected"
                  ? "bg-green-50 text-green-600"
                  : socketStatus === "connecting"
                    ? "bg-yellow-50 text-yellow-600"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {socketStatus === "connected" ? "Live" : socketStatus === "connecting" ? "Connecting" : "Realtime fallback"}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {isThreadLoading ? (
            <DMConversationSkeleton />
          ) : (
            <div className="space-y-3">
              {activeThread?.messages.length === 0 ? (
                <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
                  {activeChatUser ? (
                    <Image
                      src={activeChatUser.avatar}
                      alt={activeChatUser.displayName}
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] rounded-3xl object-cover shadow-sm"
                    />
                  ) : null}
                  <h2 className="mt-4 text-lg font-black text-gray-900">Message {activeChatUser?.displayName ?? "this user"}</h2>
                  <p className="mt-1 max-w-[260px] text-sm leading-6 text-gray-500">
                    Start the conversation with a ranking take, recommendation, or quick hello.
                  </p>
                </div>
              ) : (
                activeThread?.messages.map((message) => (
                  <div key={message.id} className={`flex gap-2 ${message.mine ? "justify-end" : "justify-start"}`}>
                    {!message.mine && activeChatUser ? (
                      <Image
                        src={activeChatUser.avatar}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 self-end rounded-full object-cover"
                      />
                    ) : null}
                    <div className="max-w-[75%]">
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm ${
                          message.mine
                            ? "rounded-br-sm bg-violet-600 text-white"
                            : "rounded-bl-sm bg-gray-100 text-gray-800"
                        }`}
                      >
                        {message.text}
                      </div>
                      <p className={`mt-1 text-[10px] text-gray-400 ${message.mine ? "text-right" : "text-left"}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3">
          {error ? <p className="mb-2 text-sm text-red-500">{error}</p> : null}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Chatbox</p>
          <div className="flex items-center gap-2">
            <button className="text-gray-400 transition-colors hover:text-violet-500" aria-label="Attach image">
              <ImageIcon size={20} />
            </button>
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5">
              <input
                type="text"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSendMessage();
                  }
                }}
                placeholder="Message..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
              <button className="text-gray-400 transition-colors hover:text-yellow-500" aria-label="Emoji picker">
                <Smile size={18} />
              </button>
            </div>
            <button
              onClick={() => void handleSendMessage()}
              disabled={!newMessage.trim() || isSending}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white transition-all hover:bg-violet-700 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="px-4 pt-12 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900">Messages</h1>
            <button
              onClick={() => router.push("/search")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-500 transition-colors hover:bg-violet-100"
              aria-label="Find someone to message"
            >
              <Edit size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-2xl bg-gray-100 py-2.5 pr-4 pl-10 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          {authError || error ? <p className="mt-3 text-sm text-red-500">{authError || error}</p> : null}
        </div>
      </div>

      {isThreadsLoading ? (
        <DMThreadListSkeleton />
      ) : (
        <>
          <div className="border-b border-gray-100 bg-white px-4 py-3">
            <p className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Quick Chat</p>
            <div className="no-scrollbar flex gap-3 overflow-x-auto">
              {threads.slice(0, 4).map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread)}
                  className="flex flex-shrink-0 flex-col items-center gap-1"
                >
                  <div className="relative">
                    <Image
                      src={thread.user.avatar}
                      alt={thread.user.displayName}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  </div>
                  <span className="max-w-[48px] truncate text-[10px] text-gray-500">{thread.user.username}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 px-4 py-3">
            {filteredThreads.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl">💬</span>
                <p className="mt-3 text-sm text-gray-500">No conversations yet</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-white"
                >
                  <div className="relative flex-shrink-0">
                    <Image
                      src={thread.user.avatar}
                      alt={thread.user.displayName}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    {thread.unread > 0 ? (
                      <span className="absolute top-[-4px] right-[-4px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-50 bg-violet-500 text-[9px] font-bold text-white">
                        {thread.unread}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${thread.unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                        {thread.user.displayName}
                      </span>
                      <span className="text-[10px] text-gray-400">{thread.timestamp}</span>
                    </div>
                    <p className={`mt-0.5 truncate text-xs ${thread.unread > 0 ? "font-medium text-gray-700" : "text-gray-400"}`}>
                      {thread.lastMessage}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
