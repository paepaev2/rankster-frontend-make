import type { ReactNode } from "react";
import { cn } from "./ui/utils";

export const MOBILE_TOP_SAFE_PADDING_CLASS = "pt-[max(0.5rem,calc(env(safe-area-inset-top)+0.25rem))]";

interface MobileTopBarProps {
  children: ReactNode;
  outerClassName?: string;
  innerClassName?: string;
}

export function MobileTopBar({
  children,
  outerClassName = "sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md",
  innerClassName = "px-4 pb-4",
}: MobileTopBarProps) {
  return (
    <div className={outerClassName}>
      <div className={cn("px-4 pb-4", MOBILE_TOP_SAFE_PADDING_CLASS, innerClassName)}>
        {children}
      </div>
    </div>
  );
}
