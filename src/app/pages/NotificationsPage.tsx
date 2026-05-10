'use client';

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCheck, Trophy, UserPlus } from "lucide-react";
import { AppErrorState } from "../components/AppStateViews";
import {
  fetchNotifications,
  getNotificationsSocketUrl,
  markAllNotificationsRead,
  markNotificationRead,
  parseNotificationSocketEvent,
} from "../lib/ranksterApi";
import type { RanksterNotification } from "../lib/feedUi";
import { useMockSession } from "../lib/useMockSession";

const NOTIFICATION_POP_MS = 4500;
const AUTO_MARK_READ_MS = 2200;

function NotificationSkeleton() {
  return (
    <div className="space-y-2 px-4 py-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-2xl bg-gray-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-full animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function notificationIcon(type: RanksterNotification["type"]) {
  if (type === "follow") {
    return <UserPlus size={18} />;
  }
  if (type === "rank") {
    return <Trophy size={18} />;
  }
  return <Bell size={18} />;
}

function notificationTone(type: RanksterNotification["type"]) {
  if (type === "follow") {
    return "bg-sky-50 text-sky-600";
  }
  if (type === "rank") {
    return "bg-brand-yellow/15 text-brand-yellow-dark";
  }
  return "bg-rose-50 text-rose-600";
}

export function NotificationsPage() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading, error: authError } = useMockSession();
  const [notifications, setNotifications] = useState<RanksterNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freshNotificationIds, setFreshNotificationIds] = useState<string[]>([]);
  const freshTimersRef = useRef<number[]>([]);
  const autoReadTimersRef = useRef<number[]>([]);

  function showTemporaryNotificationState(notificationId: string) {
    setFreshNotificationIds((current) =>
      current.includes(notificationId) ? current : [...current, notificationId],
    );

    const timer = window.setTimeout(() => {
      setFreshNotificationIds((current) => current.filter((id) => id !== notificationId));
    }, NOTIFICATION_POP_MS);
    freshTimersRef.current.push(timer);
  }

  function markNotificationSeenLocally(notificationId: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );
    setUnreadCount((current) => Math.max(current - 1, 0));
  }

  function scheduleAutoMarkRead(notificationId: string) {
    const timer = window.setTimeout(() => {
      markNotificationSeenLocally(notificationId);
      void markNotificationRead(notificationId).catch((markError) => {
        setError(markError instanceof Error ? markError.message : "Failed to update notification.");
      });
    }, AUTO_MARK_READ_MS);
    autoReadTimersRef.current.push(timer);
  }

  function scheduleAutoMarkAllRead() {
    const timer = window.setTimeout(() => {
      void markAllNotificationsRead()
        .then((response) => {
          setNotifications(response.items);
          setUnreadCount(response.unreadCount);
        })
        .catch((markError) => {
          setError(markError instanceof Error ? markError.message : "Failed to update notifications.");
        });
    }, AUTO_MARK_READ_MS);
    autoReadTimersRef.current.push(timer);
  }

  useEffect(() => {
    return () => {
      freshTimersRef.current.forEach(window.clearTimeout);
      autoReadTimersRef.current.forEach(window.clearTimeout);
      freshTimersRef.current = [];
      autoReadTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (isAuthLoading || authError) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void fetchNotifications()
      .then((response) => {
        if (!cancelled) {
          setNotifications(response.items);
          setUnreadCount(response.unreadCount);

          const unreadNotifications = response.items.filter((notification) => !notification.read);
          unreadNotifications.forEach((notification) => showTemporaryNotificationState(notification.id));
          if (unreadNotifications.length > 0) {
            scheduleAutoMarkAllRead();
          }
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load notifications.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authError, isAuthLoading]);

  useEffect(() => {
    if (isAuthLoading || authError || !session) {
      return;
    }

    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(getNotificationsSocketUrl());
      socket.onmessage = (event) => {
        try {
          const payload = parseNotificationSocketEvent(event.data as string);
          setUnreadCount(payload.unreadCount);

          if (payload.type !== "notification" || !payload.notification) {
            return;
          }

          const notification = payload.notification;
          setNotifications((current) => [
            notification,
            ...current.filter((item) => item.id !== notification.id),
          ]);
          showTemporaryNotificationState(notification.id);
          scheduleAutoMarkRead(notification.id);
        } catch {
          setError("Received an unreadable notification update.");
        }
      };
    } catch {
      socket = null;
    }

    return () => {
      socket?.close();
      freshTimersRef.current.forEach(window.clearTimeout);
      autoReadTimersRef.current.forEach(window.clearTimeout);
      freshTimersRef.current = [];
      autoReadTimersRef.current = [];
    };
  }, [authError, isAuthLoading, session?.user.id]);

  async function handleNotificationClick(notification: RanksterNotification) {
    if (!notification.read) {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
      setUnreadCount((current) => Math.max(current - 1, 0));

      try {
        await markNotificationRead(notification.id);
      } catch (markError) {
        setError(markError instanceof Error ? markError.message : "Failed to update notification.");
      }
    }

    if (notification.href) {
      router.push(notification.href);
    }
  }

  async function handleMarkAllRead() {
    setIsMarkingAll(true);
    setError(null);

    try {
      const response = await markAllNotificationsRead();
      setNotifications(response.items);
      setUnreadCount(response.unreadCount);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Failed to update notifications.");
    } finally {
      setIsMarkingAll(false);
    }
  }

  if (isAuthLoading) {
    return <NotificationSkeleton />;
  }

  if (!session) {
    return (
      <div className="px-4 pt-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm text-gray-700">Sign in to see your notifications.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-2xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
              <p className="text-xs font-medium text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You are all caught up"}
              </p>
            </div>
            <button
              onClick={() => void handleMarkAllRead()}
              disabled={unreadCount === 0 || isMarkingAll}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors hover:bg-brand-blue/15 disabled:opacity-40"
              aria-label="Mark all notifications as read"
            >
              <CheckCheck size={19} />
            </button>
          </div>
          {authError || error ? <p className="mt-3 text-sm text-red-500">{authError || error}</p> : null}
        </div>
      </div>

      {isLoading ? (
        <NotificationSkeleton />
      ) : error && notifications.length === 0 ? (
        <div className="px-4 py-4">
          <AppErrorState title="Could not load notifications" message={error} variant="inline" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-blue/10 text-brand-blue">
            <Bell size={28} />
          </div>
          <h2 className="mt-4 text-lg font-black text-gray-900">No notifications yet</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Follows, comments, and ranking activity will show up here. Message alerts stay in DM.
          </p>
        </div>
      ) : (
        <div className="space-y-2 px-4 py-4">
          {notifications.map((notification) => {
            const isFresh = freshNotificationIds.includes(notification.id);

            return (
              <button
                key={notification.id}
                onClick={() => void handleNotificationClick(notification)}
                className={`flex w-full gap-3 rounded-3xl border p-4 text-left shadow-sm transition-all duration-700 hover:-translate-y-0.5 hover:shadow-md ${
                  isFresh
                    ? "scale-[1.01] border-rose-200 bg-rose-50 shadow-rose-100"
                    : "border-gray-100 bg-white"
                }`}
              >
                <div className="relative flex-shrink-0">
                  {notification.actor ? (
                    <Image
                      src={notification.actor.avatar}
                      alt={notification.actor.displayName}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${notificationTone(notification.type)}`}>
                      {notificationIcon(notification.type)}
                    </div>
                  )}
                  {notification.actor ? (
                    <span className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-xl border-2 border-white ${notificationTone(notification.type)}`}>
                      {notificationIcon(notification.type)}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm ${notification.read ? "font-bold text-gray-800" : "font-black text-gray-900"}`}>
                      {notification.title}
                    </p>
                    <span className="flex-shrink-0 text-[10px] font-medium text-gray-400">{notification.createdAt}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-gray-500">{notification.body}</p>
                  {notification.actor ? (
                    <p className="mt-2 text-xs font-bold text-brand-blue">@{notification.actor.username}</p>
                  ) : null}
                </div>
                {!notification.read ? <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
