import Image from "next/image";
import { BarChart3, ChevronRight, Megaphone, ShieldCheck, Timer, Utensils } from "lucide-react";
import type { MockRankCampaign } from "../data/mockCampaigns";

interface SponsoredRankCampaignCardProps {
  campaign: MockRankCampaign;
  onRank: () => void;
}

export function SponsoredRankCampaignCard({ campaign, onRank }: SponsoredRankCampaignCardProps) {
  const previewItems = campaign.items.slice(0, 4);

  return (
    <article className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-black text-white shadow-sm">
            {campaign.sponsorLogoText}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-sm font-bold text-gray-900">{campaign.sponsorName}</p>
              <span className="flex-shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Ad
              </span>
            </div>
            <p className="truncate text-xs text-gray-400">@{campaign.sponsorHandle} · Sponsored ranking campaign</p>
          </div>
        </div>
        <Megaphone size={18} className="mt-1 flex-shrink-0 text-amber-500" />
      </div>

      <button type="button" onClick={onRank} className="block w-full text-left">
        <div className="relative mx-4 overflow-hidden rounded-2xl">
          <Image
            src={campaign.coverImage}
            alt={campaign.tierListName}
            width={900}
            height={520}
            className="h-40 w-full object-cover"
            sizes="(max-width: 640px) 100vw, 520px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
              <BarChart3 size={12} />
              Preference data campaign
            </div>
            <h2 className="text-lg font-black leading-tight text-white">{campaign.tierListName}</h2>
            <p className="mt-1 max-w-[280px] text-xs leading-5 text-white/80">{campaign.objective}</p>
          </div>
        </div>
      </button>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          {previewItems.map((item) => (
            <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-50 p-2">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Utensils size={16} />
                </div>
              )}
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-gray-700">{item.name}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
            <Timer size={12} />
            {campaign.estimatedTime}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
            <ShieldCheck size={12} />
            Aggregated results
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{campaign.rewardText}</span>
        </div>

        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-xs leading-5 text-gray-400">{campaign.disclosure}</p>
          <button
            type="button"
            onClick={onRank}
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-2xl bg-brand-blue px-4 py-2.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
          >
            Rank menu
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
