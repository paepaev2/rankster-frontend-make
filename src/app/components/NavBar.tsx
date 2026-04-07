'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, LayoutGrid, MessageCircle } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/create", icon: PlusCircle, label: "Create", primary: true },
  { to: "/board", icon: LayoutGrid, label: "Board" },
  { to: "/dm", icon: MessageCircle, label: "DM", badge: 4 },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-bottom">
      <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map(({ to, icon: Icon, label, primary, badge }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              href={to}
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
                    {badge && badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                        {badge}
                      </span>
                    )}
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
