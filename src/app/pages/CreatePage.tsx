'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Globe, GripVertical, Image, Lock, Plus, Search, Trash2, Type, X } from "lucide-react";
import { CATEGORIES, TRENDING_TOPICS } from "../data/mockData";
import type { RankPost, TierData, TierItem as FeedTierItem, TrendingTopic } from "../lib/feedUi";
import { createRankPost, ensureMockSession, fetchPost, fetchTrendingTopics } from "../lib/ranksterApi";

type Mode = "choose" | "create-new" | "rank-existing";
type ItemFormat = "text" | "image";

interface TierItem {
  id: string;
  name: string;
  emoji?: string;
  imageUrl?: string;
}

interface Tier {
  id: string;
  label: string;
  items: TierItem[];
}

const TIER_COLOR_PALETTE = [
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
];

const DEFAULT_TIERS: Tier[] = [
  { id: "tier_S", label: "S", items: [] },
  { id: "tier_A", label: "A", items: [] },
  { id: "tier_B", label: "B", items: [] },
  { id: "tier_C", label: "C", items: [] },
  { id: "tier_D", label: "D", items: [] },
];

function createDefaultTiers(): Tier[] {
  return DEFAULT_TIERS.map((tier) => ({ ...tier, items: [] }));
}

function mapPostItems(post: RankPost): TierItem[] {
  return post.allItems.map((item) => ({
    id: item.id,
    name: item.name,
    emoji: item.emoji,
  }));
}

function buildTierPayload(tiers: Tier[]): TierData {
  const toFeedItems = (items: TierItem[] = []): FeedTierItem[] =>
    items.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
    }));

  return {
    S: toFeedItems(tiers[0]?.items),
    A: toFeedItems(tiers[1]?.items),
    B: toFeedItems(tiers[2]?.items),
    C: toFeedItems(tiers[3]?.items),
    D: toFeedItems(tiers[4]?.items),
  };
}

function TextChip({
  item,
  draggable: isDraggable,
  onDragStart,
  onDragEnd,
  onRemove,
  removable = true,
}: {
  item: TierItem;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onRemove?: () => void;
  removable?: boolean;
}) {
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`inline-flex select-none items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm ${
        isDraggable ? "cursor-grab active:cursor-grabbing active:opacity-50" : ""
      }`}
    >
      {item.emoji && <span>{item.emoji}</span>}
      {item.name}
      {removable && onRemove && (
        <button
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 text-gray-300 transition-colors hover:text-red-400"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

function ImageChip({
  item,
  draggable: isDraggable,
  onDragStart,
  onDragEnd,
  onRemove,
  removable = true,
}: {
  item: TierItem;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onRemove?: () => void;
  removable?: boolean;
}) {
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`relative flex w-16 select-none flex-col items-center ${
        isDraggable ? "cursor-grab active:cursor-grabbing active:opacity-50" : ""
      }`}
    >
      <div className="h-14 w-14 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <Image size={20} />
          </div>
        )}
      </div>
      <span className="mt-0.5 max-w-[56px] text-center text-[10px] font-medium leading-tight text-gray-600 line-clamp-2">
        {item.name}
      </span>
      {removable && onRemove && (
        <button
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-white transition-colors hover:bg-red-500"
        >
          <X size={8} />
        </button>
      )}
    </div>
  );
}

function TierImageChip({
  item,
  onDragStart,
  onDragEnd,
  onRemove,
}: {
  item: TierItem;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="relative flex w-12 cursor-grab select-none flex-col items-center active:cursor-grabbing active:opacity-50"
    >
      <div className="h-10 w-10 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <Image size={14} />
          </div>
        )}
      </div>
      <span className="mt-0.5 max-w-[44px] text-center text-[9px] font-medium leading-tight text-gray-600 line-clamp-2">
        {item.name}
      </span>
      {onRemove && (
        <button
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-400 text-white transition-colors hover:bg-red-500"
        >
          <X size={7} />
        </button>
      )}
    </div>
  );
}

interface RankAddItemRowProps {
  itemFormat: ItemFormat;
  rankNewEmoji: string;
  rankNewImageUrl: string;
  rankNewName: string;
  onEmojiChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onAddItem: () => void;
}

function RankAddItemRow({
  itemFormat,
  rankNewEmoji,
  rankNewImageUrl,
  rankNewName,
  onEmojiChange,
  onImageUrlChange,
  onNameChange,
  onAddItem,
}: RankAddItemRowProps) {
  return (
    <div className="space-y-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex gap-2">
        {itemFormat === "text" ? (
          <input
            type="text"
            value={rankNewEmoji}
            onChange={(event) => onEmojiChange(event.target.value)}
            placeholder="🎬"
            className="w-12 rounded-lg border border-gray-100 bg-gray-50 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        ) : (
          <input
            type="text"
            value={rankNewImageUrl}
            onChange={(event) => onImageUrlChange(event.target.value)}
            placeholder="Image URL"
            className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        )}
        <input
          type="text"
          value={rankNewName}
          onChange={(event) => onNameChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onAddItem()}
          placeholder="Item name"
          className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <button
          onClick={onAddItem}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white transition-colors hover:bg-violet-600"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("choose");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [itemFormat, setItemFormat] = useState<ItemFormat>("text");
  const [newItemName, setNewItemName] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [items, setItems] = useState<TierItem[]>([]);
  const [tiers, setTiers] = useState<Tier[]>(createDefaultTiers);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [showAddInRank, setShowAddInRank] = useState(false);
  const [rankNewName, setRankNewName] = useState("");
  const [rankNewEmoji, setRankNewEmoji] = useState("");
  const [rankNewImageUrl, setRankNewImageUrl] = useState("");
  const [step, setStep] = useState(1);
  const [searchTopic, setSearchTopic] = useState("");
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>(TRENDING_TOPICS);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [loadingSourcePostId, setLoadingSourcePostId] = useState<string | null>(null);
  const [selectedSourcePostId, setSelectedSourcePostId] = useState<string | null>(null);
  const [selectedSourceTags, setSelectedSourceTags] = useState<string[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const dragPayload = useRef<{ item: TierItem; fromTierId: string | null } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const filteredTopics = trendingTopics.filter((topic) =>
    topic.title.toLowerCase().includes(searchTopic.toLowerCase()),
  );

  useEffect(() => {
    let cancelled = false;

    void fetchTrendingTopics()
      .then((topics) => {
        if (!cancelled) {
          setTrendingTopics(topics);
          setTopicsError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setTopicsError(error instanceof Error ? error.message : "Failed to load trending topics.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadSourcePost = useCallback(async (postId: string) => {
    setLoadingSourcePostId(postId);
    setPublishError(null);

    try {
      const post = await fetchPost(postId);
      setTitle(post.title);
      setCategory(post.category);
      setDescription("");
      setSelectedSourcePostId(post.id);
      setSelectedSourceTags(post.tags);
      setItemFormat("text");
      setItems(mapPostItems(post));
      setTiers(createDefaultTiers());
      setMode("create-new");
      setStep(3);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Failed to load that tier list.");
    } finally {
      setLoadingSourcePostId((current) => (current === postId ? null : current));
    }
  }, []);

  useEffect(() => {
    const sourcePostId = searchParams.get("sourcePost");
    if (!sourcePostId || sourcePostId === selectedSourcePostId || loadingSourcePostId === sourcePostId) {
      return;
    }

    void loadSourcePost(sourcePostId);
  }, [loadSourcePost, loadingSourcePostId, searchParams, selectedSourcePostId]);

  const addItem = () => {
    if (!newItemName.trim()) {
      return;
    }
    setItems([
      ...items,
      {
        id: `item_${Date.now()}`,
        name: newItemName.trim(),
        emoji: itemFormat === "text" ? (newItemEmoji || undefined) : undefined,
        imageUrl: itemFormat === "image" ? (newItemImageUrl || undefined) : undefined,
      },
    ]);
    setNewItemName("");
    setNewItemEmoji("");
    setNewItemImageUrl("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    setTiers((prev) =>
      prev.map((tier) => ({ ...tier, items: tier.items.filter((item) => item.id !== id) })),
    );
  };

  const addItemInRank = () => {
    if (!rankNewName.trim()) {
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        name: rankNewName.trim(),
        emoji: itemFormat === "text" ? (rankNewEmoji || undefined) : undefined,
        imageUrl: itemFormat === "image" ? (rankNewImageUrl || undefined) : undefined,
      },
    ]);
    setRankNewName("");
    setRankNewEmoji("");
    setRankNewImageUrl("");
  };

  const getUnrankedItems = () => {
    const rankedIds = new Set(tiers.flatMap((tier) => tier.items).map((item) => item.id));
    return items.filter((item) => !rankedIds.has(item.id));
  };

  const moveItemToTier = (item: TierItem, fromTierId: string | null, toTierId: string) => {
    setTiers((prev) =>
      prev.map((tier) => {
        if (tier.id === fromTierId) {
          return { ...tier, items: tier.items.filter((entry) => entry.id !== item.id) };
        }
        if (tier.id === toTierId) {
          return { ...tier, items: [...tier.items, item] };
        }
        return tier;
      }),
    );
  };

  const removeFromTier = (item: TierItem, tierId: string) => {
    setTiers((prev) =>
      prev.map((tier) =>
        tier.id === tierId ? { ...tier, items: tier.items.filter((entry) => entry.id !== item.id) } : tier,
      ),
    );
  };

  const addTier = () => {
    const newId = `tier_${Date.now()}`;
    setTiers((prev) => [...prev, { id: newId, label: "New", items: [] }]);
    setEditingTierId(newId);
  };

  const deleteTier = (tierId: string) => {
    setTiers((prev) => prev.filter((tier) => tier.id !== tierId));
  };

  const renameTier = (tierId: string, newLabel: string) => {
    setTiers((prev) => prev.map((tier) => (tier.id === tierId ? { ...tier, label: newLabel } : tier)));
  };

  const handleDragStart = (item: TierItem, fromTierId: string | null) => {
    dragPayload.current = { item, fromTierId };
  };

  const handleDragEnd = () => {
    dragPayload.current = null;
    setDragOverId(null);
  };

  const handleDropOnTier = (toTierId: string) => {
    const payload = dragPayload.current;
    if (!payload || payload.fromTierId === toTierId) {
      setDragOverId(null);
      return;
    }
    moveItemToTier(payload.item, payload.fromTierId, toTierId);
    dragPayload.current = null;
    setDragOverId(null);
  };

  const handleDropOnUnranked = () => {
    const payload = dragPayload.current;
    if (!payload || payload.fromTierId === null) {
      setDragOverId(null);
      return;
    }
    removeFromTier(payload.item, payload.fromTierId);
    dragPayload.current = null;
    setDragOverId(null);
  };

  const handleReset = () => {
    router.replace("/create");
    setMode("choose");
    setStep(1);
    setTiers(createDefaultTiers());
    setItems([]);
    setTitle("");
    setDescription("");
    setCategory("");
    setIsPublic(true);
    setItemFormat("text");
    setShowAddInRank(false);
    setSearchTopic("");
    setSelectedSourcePostId(null);
    setSelectedSourceTags([]);
    setPublishError(null);
    setLoadingSourcePostId(null);
  };

  const handlePublish = async () => {
    setPublishError(null);
    setIsPublishing(true);

    try {
      await ensureMockSession();
      const createdPost = await createRankPost({
        title,
        category,
        description,
        tags: selectedSourceTags.length > 0 ? selectedSourceTags : [],
        tiers: buildTierPayload(tiers),
        allItems: items.map((item) => ({
          id: item.id,
          name: item.name,
          emoji: item.emoji,
        })),
        isPublic,
        sourcePostId: selectedSourcePostId ?? undefined,
      });
      router.push(`/topic/${createdPost.id}`);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Failed to publish your ranking.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <X size={22} />
          </button>
          <h1 className="text-base font-bold text-gray-900">
            {mode === "choose" ? "Create" : mode === "create-new" ? "New Tier List" : "Rank a Topic"}
          </h1>
          {mode !== "choose" ? (
            <button onClick={handleReset} className="text-sm font-medium text-violet-500">
              Reset
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </div>

      {mode === "choose" && (
        <div className="space-y-4 px-4 pt-6 pb-8">
          <p className="text-center text-sm text-gray-500">What would you like to do?</p>

          <button
            onClick={() => setMode("create-new")}
            className="group w-full rounded-2xl border-2 border-violet-200 bg-white p-5 text-left shadow-sm transition-all hover:border-violet-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 text-2xl">🏆</div>
                <h3 className="font-bold text-gray-900">Create New Tier List</h3>
                <p className="mt-1 text-sm text-gray-500">Add your own topic, items, and share with the community</p>
              </div>
              <ChevronRight size={20} className="text-violet-400 transition-colors group-hover:text-violet-600" />
            </div>
          </button>

          <button
            onClick={() => setMode("rank-existing")}
            className="group w-full rounded-2xl border-2 border-orange-200 bg-white p-5 text-left shadow-sm transition-all hover:border-orange-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 text-2xl">🔥</div>
                <h3 className="font-bold text-gray-900">Rank an Existing Topic</h3>
                <p className="mt-1 text-sm text-gray-500">Share your take on trending topics and compare with others</p>
              </div>
              <ChevronRight size={20} className="text-orange-400 transition-colors group-hover:text-orange-600" />
            </div>
          </button>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Hot Right Now 🔥</h2>
            {topicsError && <p className="mb-2 text-xs text-red-500">{topicsError}</p>}
            <div className="space-y-2">
              {trendingTopics.slice(0, 3).map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    void loadSourcePost(topic.postId ?? topic.id);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-all hover:border-violet-200"
                >
                  <img src={topic.coverImage} alt={topic.title} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{topic.title}</p>
                    <p className="text-xs text-gray-400">{(topic.participantCount / 1000).toFixed(1)}k ranked this</p>
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "rank-existing" && (
        <div className="px-4 pt-4 pb-8">
          <div className="relative mb-4">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTopic}
              onChange={(event) => setSearchTopic(event.target.value)}
              placeholder="Search existing topics..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div className="space-y-3">
            {filteredTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => {
                  void loadSourcePost(topic.postId ?? topic.id);
                }}
                className="flex w-full gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:border-violet-200"
              >
                <img src={topic.coverImage} alt={topic.title} className="h-20 w-20 flex-shrink-0 object-cover" />
                <div className="flex-1 py-3 pr-3">
                  <span className="text-xs font-medium text-violet-500">
                    {CATEGORIES.find((categoryItem) => categoryItem.id === topic.category)?.emoji}
                  </span>
                  <h3 className="mt-0.5 text-sm font-bold text-gray-900">{topic.title}</h3>
                  <p className="mt-1 text-xs text-gray-400">{(topic.participantCount / 1000).toFixed(1)}k participants</p>
                </div>
                <div className="flex items-center pr-3">
                  {loadingSourcePostId === (topic.postId ?? topic.id) ? (
                    <span className="text-xs font-medium text-violet-500">Loading...</span>
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "create-new" && step === 1 && (
        <div className="space-y-4 px-4 pt-4 pb-8">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((segment) => (
              <div key={segment} className={`h-1 flex-1 rounded-full ${segment <= step ? "bg-violet-500" : "bg-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs font-medium text-gray-400">Step 1 of 3 — Topic Info</p>

          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Best Movies of 2024"
                className="mt-2 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Category *</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {CATEGORIES.map((categoryItem) => (
                  <button
                    key={categoryItem.id}
                    onClick={() => setCategory(categoryItem.id)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-sm transition-all ${
                      category === categoryItem.id
                        ? "border-violet-400 bg-violet-50 text-violet-700"
                        : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200"
                    }`}
                  >
                    <span>{categoryItem.emoji}</span>
                    <span className="truncate text-xs font-medium">{categoryItem.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What's this tier list about?"
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Item Format</label>
              <p className="mt-0.5 mb-2 text-[11px] text-gray-400">Applies to all items in this list</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setItemFormat("text")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm transition-all ${
                    itemFormat === "text"
                      ? "border-violet-400 bg-violet-50 font-semibold text-violet-700"
                      : "border-gray-100 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  <Type size={15} /> Text
                </button>
                <button
                  onClick={() => setItemFormat("image")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm transition-all ${
                    itemFormat === "image"
                      ? "border-violet-400 bg-violet-50 font-semibold text-violet-700"
                      : "border-gray-100 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  <Image size={15} /> Image
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Visibility</label>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm transition-all ${
                    isPublic ? "border-violet-400 bg-violet-50 text-violet-700" : "border-gray-100 text-gray-500"
                  }`}
                >
                  <Globe size={15} /> Public
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm transition-all ${
                    !isPublic ? "border-violet-400 bg-violet-50 text-violet-700" : "border-gray-100 text-gray-500"
                  }`}
                >
                  <Lock size={15} /> Private
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => title && category && setStep(2)}
            disabled={!title || !category}
            className="w-full rounded-2xl bg-violet-600 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next: Add Items →
          </button>
        </div>
      )}

      {mode === "create-new" && step === 2 && (
        <div className="space-y-4 px-4 pt-4 pb-8">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((segment) => (
              <div key={segment} className={`h-1 flex-1 rounded-full ${segment <= step ? "bg-violet-500" : "bg-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs font-medium text-gray-400">Step 2 of 3 — Add Items</p>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Add Items to Rank</label>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                {itemFormat === "text" ? "🔤 Text" : "🖼️ Image"} mode
              </span>
            </div>

            {itemFormat === "text" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemEmoji}
                  onChange={(event) => setNewItemEmoji(event.target.value)}
                  placeholder="🎬"
                  className="w-12 rounded-xl border border-gray-100 bg-gray-50 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <input
                  type="text"
                  value={newItemName}
                  onChange={(event) => setNewItemName(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && addItem()}
                  placeholder="Item name (press Enter)"
                  className="flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <button
                  onClick={addItem}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white transition-colors hover:bg-violet-600"
                >
                  <Plus size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(event) => setNewItemName(event.target.value)}
                  placeholder="Item name *"
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemImageUrl}
                    onChange={(event) => setNewItemImageUrl(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && addItem()}
                    placeholder="Image URL (optional)"
                    className="flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  {newItemImageUrl && (
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200">
                      <img
                        src={newItemImageUrl}
                        alt="preview"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          (event.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <button
                    onClick={addItem}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white transition-colors hover:bg-violet-600"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {items.length === 0 ? (
                <div className="py-8 text-center text-gray-300">
                  <span className="text-3xl">📝</span>
                  <p className="mt-2 text-sm">Add items to rank</p>
                </div>
              ) : itemFormat === "text" ? (
                items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                    <GripVertical size={16} className="text-gray-300" />
                    {item.emoji && <span>{item.emoji}</span>}
                    <span className="flex-1 text-sm text-gray-800">{item.name}</span>
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 transition-colors hover:text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-wrap gap-3 pt-1">
                  {items.map((item) => (
                    <div key={item.id} className="relative flex flex-col items-center gap-1">
                      <div className="h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <Image size={22} />
                          </div>
                        )}
                      </div>
                      <span className="max-w-[64px] text-center text-[10px] leading-tight text-gray-600 line-clamp-2">
                        {item.name}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-white hover:bg-red-500"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-gray-400">
              {items.length} item{items.length !== 1 ? "s" : ""} added
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 font-bold text-gray-600 transition-all hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => items.length >= 2 && setStep(3)}
              disabled={items.length < 2}
              className="flex-1 rounded-2xl bg-violet-600 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next: Rank →
            </button>
          </div>
        </div>
      )}

      {mode === "create-new" && step === 3 && (
        <div className="space-y-4 px-4 pt-4 pb-8">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((segment) => (
              <div key={segment} className={`h-1 flex-1 rounded-full ${segment <= step ? "bg-violet-500" : "bg-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs font-medium text-gray-400">Step 3 of 3 — Build Your Ranking</p>
          {selectedSourcePostId && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-500">Ranking Existing Topic</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{title}</p>
              <p className="mt-1 text-xs text-gray-500">We pulled in the real item list so you can make your own ranking.</p>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {tiers.map((tier, index) => {
              const bgColor = TIER_COLOR_PALETTE[index % TIER_COLOR_PALETTE.length];
              const isOver = dragOverId === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`border-b border-gray-100 transition-colors last:border-0 ${isOver ? "bg-violet-50" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverId(tier.id);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                      setDragOverId(null);
                    }
                  }}
                  onDrop={() => handleDropOnTier(tier.id)}
                >
                  <div className="flex min-h-[56px] items-stretch">
                    <div className={`${bgColor} min-w-[3.5rem] flex-shrink-0 px-2`}>
                      {editingTierId === tier.id ? (
                        <input
                          autoFocus
                          value={tier.label}
                          onChange={(event) => renameTier(tier.id, event.target.value)}
                          onBlur={() => setEditingTierId(null)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              setEditingTierId(null);
                            }
                          }}
                          className="h-full w-full min-w-0 border-b border-white/60 bg-transparent text-center text-sm font-black text-white focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingTierId(tier.id)}
                          title="Click to rename"
                          className="flex h-full w-full items-center justify-center break-all py-2 text-center text-sm leading-tight font-black text-white transition-colors hover:bg-black/10"
                        >
                          {tier.label || "?"}
                        </button>
                      )}
                    </div>

                    <div className={`flex min-h-[56px] flex-1 flex-wrap gap-1.5 p-2 ${itemFormat === "image" ? "items-start" : "items-center"}`}>
                      {tier.items.map((item) =>
                        itemFormat === "image" ? (
                          <TierImageChip
                            key={item.id}
                            item={item}
                            onDragStart={() => handleDragStart(item, tier.id)}
                            onDragEnd={handleDragEnd}
                            onRemove={() => removeFromTier(item, tier.id)}
                          />
                        ) : (
                          <TextChip
                            key={item.id}
                            item={item}
                            draggable
                            onDragStart={() => handleDragStart(item, tier.id)}
                            onDragEnd={handleDragEnd}
                            onRemove={() => removeFromTier(item, tier.id)}
                          />
                        ),
                      )}
                      {isOver && tier.items.length === 0 && <span className="self-center text-xs italic text-violet-400">Drop here</span>}
                    </div>

                    {tiers.length > 1 && (
                      <button
                        onClick={() => deleteTier(tier.id)}
                        className="flex w-9 flex-shrink-0 items-center justify-center text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                        title="Remove tier"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={addTier}
              className="flex w-full items-center justify-center gap-2 border-t border-gray-100 py-2.5 text-sm text-violet-500 transition-colors hover:bg-violet-50 hover:text-violet-700"
            >
              <Plus size={14} /> Add Tier
            </button>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Unranked ({getUnrankedItems().length})</p>
              <button
                onClick={() => setShowAddInRank(!showAddInRank)}
                className="flex items-center gap-1 text-xs font-medium text-violet-500 transition-colors hover:text-violet-700"
              >
                <Plus size={13} />
                Add item
              </button>
            </div>

            {showAddInRank && (
              <div className="mb-2">
                <RankAddItemRow
                  itemFormat={itemFormat}
                  rankNewEmoji={rankNewEmoji}
                  rankNewImageUrl={rankNewImageUrl}
                  rankNewName={rankNewName}
                  onEmojiChange={setRankNewEmoji}
                  onImageUrlChange={setRankNewImageUrl}
                  onNameChange={setRankNewName}
                  onAddItem={addItemInRank}
                />
              </div>
            )}

            <div
              className={`min-h-[52px] rounded-xl border-2 border-dashed p-2 transition-colors ${
                dragOverId === "unranked" ? "border-gray-400 bg-gray-100" : "border-gray-200 bg-white"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverId("unranked");
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDragOverId(null);
                }
              }}
              onDrop={handleDropOnUnranked}
            >
              <div className="flex flex-wrap gap-2">
                {getUnrankedItems().map((item) =>
                  itemFormat === "image" ? (
                    <ImageChip
                      key={item.id}
                      item={item}
                      draggable
                      onDragStart={() => handleDragStart(item, null)}
                      onDragEnd={handleDragEnd}
                      onRemove={() => removeItem(item.id)}
                    />
                  ) : (
                    <TextChip
                      key={item.id}
                      item={item}
                      draggable
                      onDragStart={() => handleDragStart(item, null)}
                      onDragEnd={handleDragEnd}
                      onRemove={() => removeItem(item.id)}
                    />
                  ),
                )}
                {getUnrankedItems().length === 0 && dragOverId !== "unranked" && (
                  <p className="self-center text-sm font-medium text-green-600">✅ All items ranked!</p>
                )}
                {dragOverId === "unranked" && <p className="self-center text-sm italic text-gray-400">Drop to unrank</p>}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Drag items into tiers · Drag between tiers to re-rank · Click a tier label to rename · × to remove an item
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 font-bold text-gray-600 transition-all hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => void handlePublish()}
              disabled={isPublishing}
              className="flex-1 rounded-2xl bg-violet-600 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing ? "Publishing..." : "🚀 Publish"}
            </button>
          </div>
          {publishError && <p className="text-sm text-red-500">{publishError}</p>}
        </div>
      )}
    </div>
  );
}
