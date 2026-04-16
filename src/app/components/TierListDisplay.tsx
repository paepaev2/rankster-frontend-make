import React from "react";
import { TIER_COLORS, type TierData } from "../lib/feedUi";

interface TierListDisplayProps {
  tiers: TierData;
  compact?: boolean;
}

export function TierListDisplay({ tiers, compact = false }: TierListDisplayProps) {
  const tierKeys = ["S", "A", "B", "C", "D"] as const;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
      {tierKeys.map((tier) => {
        const items = tiers[tier];
        const colors = TIER_COLORS[tier];
        if (compact && items.length === 0) return null;

        return (
          <div key={tier} className="flex items-stretch border-b border-gray-100 last:border-b-0 min-h-[40px]">
            {/* Tier Label */}
            <div className={`${colors.bg} flex items-center justify-center ${compact ? "w-9 min-h-[36px]" : "w-12 min-h-[44px]"} flex-shrink-0`}>
              <span className="font-black text-white text-sm">{tier}</span>
            </div>
            {/* Tier Items */}
            <div className="flex flex-wrap gap-1.5 p-1.5 flex-1 bg-gray-50">
              {items.length === 0 ? (
                <span className="text-xs text-gray-300 self-center px-1 italic">Empty</span>
              ) : (
                items.map((item) => (
                  <span
                    key={item.id}
                    className={`inline-flex items-center gap-1 ${compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"} bg-white rounded-lg border border-gray-200 text-gray-700 font-medium shadow-sm`}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className={compact ? "h-4 w-4 rounded object-cover" : "h-5 w-5 rounded object-cover"}
                      />
                    ) : (
                      item.emoji && <span>{item.emoji}</span>
                    )}
                    {item.name}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
