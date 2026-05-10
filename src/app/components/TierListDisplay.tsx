import React from "react";
import { TIER_COLORS, type TierData, type TierRow } from "../lib/feedUi";

interface TierListDisplayProps {
  tiers: TierData;
  tierRows?: TierRow[];
  compact?: boolean;
}

const TIER_KEYS = ["S", "A", "B", "C", "D"] as const;
const TIER_COLOR_SEQUENCE = [
  TIER_COLORS.S,
  TIER_COLORS.A,
  TIER_COLORS.B,
  TIER_COLORS.C,
  TIER_COLORS.D,
  { bg: "bg-brand-blue", text: "text-white", border: "border-brand-blue-dark" },
  { bg: "bg-brand-yellow", text: "text-white", border: "border-brand-yellow" },
  { bg: "bg-teal-500", text: "text-white", border: "border-teal-600" },
];

function fallbackTierRows(tiers: TierData): TierRow[] {
  return TIER_KEYS.map((tier) => ({ id: tier, label: tier, items: tiers[tier] }));
}

function tierColors(row: TierRow, index: number) {
  const key = row.id in TIER_COLORS ? row.id : row.label.trim().toUpperCase();
  return key in TIER_COLORS ? TIER_COLORS[key] : TIER_COLOR_SEQUENCE[index % TIER_COLOR_SEQUENCE.length];
}

export function TierListDisplay({ tiers, tierRows, compact = false }: TierListDisplayProps) {
  const rows = tierRows && tierRows.length > 0 ? tierRows : fallbackTierRows(tiers);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
      {rows.map((row, index) => {
        const items = row.items;
        const colors = tierColors(row, index);
        const label = row.label || row.id;
        const hasLongLabel = label.length > 2;
        if (compact && items.length === 0) return null;

        return (
          <div key={row.id} className="flex items-stretch border-b border-gray-100 last:border-b-0 min-h-[40px]">
            {/* Tier Label */}
            <div
              className={`${colors.bg} flex items-center justify-center ${
                compact ? (hasLongLabel ? "w-14 min-h-[36px]" : "w-9 min-h-[36px]") : hasLongLabel ? "w-16 min-h-[44px]" : "w-12 min-h-[44px]"
              } flex-shrink-0`}
            >
              <span className={`px-1 text-center font-black text-white leading-tight break-words ${hasLongLabel ? "text-[10px]" : "text-sm"}`}>{label}</span>
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
