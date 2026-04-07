import React, { ReactNode } from "react";
import { NavBar } from "./NavBar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto relative">
        <main className="pb-20">
          {children}
        </main>
        <NavBar />
      </div>
    </div>
  );
}
