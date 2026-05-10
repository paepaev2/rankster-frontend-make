"use client";

import React, { useState } from "react";
import { TIER_COLORS, type TierData, type TierItem, type TierRow } from "../lib/feedUi";

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

function imageItemClasses(compact: boolean) {
  return compact
    ? "w-[72px] sm:w-20"
    : "w-[88px] sm:w-28";
}

function imageClasses(compact: boolean) {
  return compact
    ? "h-16 sm:h-[72px]"
    : "h-20 sm:h-24";
}

export function TierListDisplay({ tiers, tierRows, compact = false }: TierListDisplayProps) {
  const rows = tierRows && tierRows.length > 0 ? tierRows : fallbackTierRows(tiers);
  const [previewItem, setPreviewItem] = useState<TierItem | null>(null);

  return (
    <>
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
              <div className={`flex flex-wrap ${compact ? "gap-1.5 p-1.5" : "gap-2 p-2"} flex-1 bg-gray-50`}>
                {items.length === 0 ? (
                  <span className="text-xs text-gray-300 self-center px-1 italic">Empty</span>
                ) : (
                  items.map((item) =>
                    item.imageUrl ? (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPreviewItem(item);
                        }}
                        className={`${imageItemClasses(compact)} group relative overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-blue/40`}
                        aria-label={`Preview ${item.name}`}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className={`${imageClasses(compact)} w-full object-cover`}
                        />
                        <span className="absolute inset-x-1 bottom-1 rounded-full bg-white/95 px-1.5 py-0.5 text-center text-[10px] font-bold leading-tight text-gray-800 shadow-sm line-clamp-2">
                          {item.name}
                        </span>
                      </button>
                    ) : (
                      <span
                        key={item.id}
                        className={`inline-flex items-center gap-1 ${compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"} bg-white rounded-lg border border-gray-200 text-gray-700 font-medium shadow-sm`}
                      >
                        {item.emoji && <span>{item.emoji}</span>}
                        {item.name}
                      </span>
                    ),
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {previewItem?.imageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${previewItem.name} image preview`}
          onClick={(event) => {
            event.stopPropagation();
            setPreviewItem(null);
          }}
        >
          <div
            className="relative max-h-full w-full max-w-3xl"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <button
              type="button"
              className="absolute right-2 top-2 z-10 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-gray-800 shadow-lg transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/70"
              onClick={() => setPreviewItem(null)}
            >
              Close
            </button>
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
              <img
                src={previewItem.imageUrl}
                alt={previewItem.name}
                className="max-h-[78vh] w-full object-contain bg-black"
              />
              <div className="px-4 py-3">
                <p className="text-sm font-black text-gray-900">{previewItem.name}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
