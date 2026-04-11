'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, LayoutGrid, MessageCircle } from "lucide-react";
import {
  fetchMessageUnreadCount,
  getMessageInboxSocketUrl,
  parseMessageInboxSocketEvent,
} from "../lib/ranksterApi";
import { useMockSession } from "../lib/useMockSession";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/create", icon: PlusCircle, label: "Create", primary: true },
  { to: "/board", icon: LayoutGrid, label: "Board" },
  { to: "/dm", icon: MessageCircle, label: "DM" },
];

export function NavBar() {
  const pathname = usePathname();
  const { session, isLoading, error } = useMockSession();
  const [dmUnreadCount, setDmUnreadCount] = useState(0);

  useEffect(() => {
    if (isLoading || error || !session) {
      setDmUnreadCount(0);
      return;
    }

    let cancelled = false;
    let socket: WebSocket | null = null;

    const refreshUnreadCount = () => {
      void fetchMessageUnreadCount()
        .then((count) => {
          if (!cancelled) {
            setDmUnreadCount(count);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setDmUnreadCount(0);
          }
        });
    };

    refreshUnreadCount();
    window.addEventListener("rankster:messages-read", refreshUnreadCount);

    try {
      socket = new WebSocket(getMessageInboxSocketUrl());
      socket.onmessage = (event) => {
        try {
          const payload = parseMessageInboxSocketEvent(event.data as string);
          setDmUnreadCount(payload.unreadCount);
        } catch {
          setDmUnreadCount((current) => current);
        }
      };
    } catch {
      socket = null;
    }

    return () => {
      cancelled = true;
      window.removeEventListener("rankster:messages-read", refreshUnreadCount);
      socket?.close();
    };
  }, [error, isLoading, session?.user.id]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-bottom">
      <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map(({ to, icon: Icon, label, primary }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          const isDmItem = to === "/dm";
          const badge = isDmItem ? dmUnreadCount : 0;
          return (
            <Link
              key={to}
              href={to}
              aria-label={isDmItem && badge > 0 ? `DM, ${badge} unread message${badge === 1 ? "" : "s"}` : label}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-full relative"
            >
              {primary ? (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isActive ? "bg-violet-600 scale-95" : "bg-violet-500 hover:bg-violet-600"}`}>
                  <Icon size={22} className="text-white" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Icon
                      size={22}
                      className={`transition-colors ${isActive ? "text-violet-600" : "text-gray-400"}`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    {badge > 0 ? (
                      <span
                        aria-hidden="true"
                        className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white"
                      >
                        {badge}
                      </span>
                    ) : null}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-violet-600" : "text-gray-400"}`}>
                    {label}
                  </span>
                  {isActive && (
                    <span className="absolute top-1 w-4 h-0.5 bg-violet-500 rounded-full" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
