'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Edit, Image as ImageIcon, Search, Send, Smile } from "lucide-react";
import { fetchMessageThread, fetchMessageThreads, sendMessage } from "../lib/ranksterApi";
import { useMockSession } from "../lib/useMockSession";
import type { Message, MessageThreadDetail } from "../lib/feedUi";

export function DMPage() {
  const { session, isLoading: isAuthLoading, error: authError } = useMockSession();
  const [threads, setThreads] = useState<Message[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<MessageThreadDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading || authError) {
      return;
    }

    let cancelled = false;
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
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, authError]);

  useEffect(() => {
    if (!activeThreadId) {
      setActiveThread(null);
      return;
    }

    let cancelled = false;
    setIsThreadLoading(true);

    void fetchMessageThread(activeThreadId)
      .then((thread) => {
        if (!cancelled) {
          setActiveThread(thread);
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

    try {
      const created = await sendMessage(activeThreadId, newMessage.trim());
      setActiveThread((current) => {
        if (!current || current.id !== activeThreadId) {
          return current;
        }
        return {
          ...current,
          messages: [...current.messages, created],
        };
      });
      setThreads((currentThreads) => {
        const currentThread = currentThreads.find((thread) => thread.id === activeThreadId);
        if (!currentThread) {
          return currentThreads;
        }
        const updated: Message = {
          ...currentThread,
          lastMessage: created.text,
          timestamp: created.timestamp,
          unread: 0,
        };
        return [updated, ...currentThreads.filter((thread) => thread.id !== activeThreadId)];
      });
      setNewMessage("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send message.");
    }
  };

  if (isAuthLoading || !session) {
    return <div className="px-4 pt-16 text-sm text-gray-500">Loading messages...</div>;
  }

  if (activeThreadId) {
    const activeChatUser = activeThread?.user ?? threads.find((thread) => thread.id === activeThreadId)?.user;

    return (
      <div className="flex h-screen flex-col bg-white">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 pt-12 pb-4 backdrop-blur-md">
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
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
          {isThreadLoading ? (
            <p className="text-sm text-gray-500">Loading conversation...</p>
          ) : (
            <div className="space-y-3">
              {activeThread?.messages.map((message) => (
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
              ))}
            </div>
          )}
        </div>

        <div className="fixed right-0 bottom-0 left-0 mx-auto max-w-lg border-t border-gray-100 bg-white px-4 py-3 pb-6">
          {error ? <p className="mb-2 text-sm text-red-500">{error}</p> : null}
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
              disabled={!newMessage.trim()}
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
            <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-500 transition-colors hover:bg-violet-100" aria-label="New message">
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
    </div>
  );
}

