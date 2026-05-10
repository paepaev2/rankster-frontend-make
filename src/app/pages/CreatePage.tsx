'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Globe, GripVertical, Image, Lock, Plus, Search, Trash2, Type, X } from "lucide-react";
import { CATEGORIES, TRENDING_TOPICS } from "../data/mockData";
import { TierListDisplay } from "../components/TierListDisplay";
import { hasUsableCoverImage, type RankPost, type TierData, type TierItem as FeedTierItem, type TierRow, type TrendingTopic } from "../lib/feedUi";
import { createRankPost, ensureMockSession, fetchPost, fetchTrendingTopics, updateRankPost, uploadImage } from "../lib/ranksterApi";

type Mode = "choose" | "create-new" | "rank-existing";
type ItemFormat = "text" | "image";
type ImageUploadTarget = "cover" | "items" | "rank";

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

type DragPayload = { item: TierItem; fromTierId: string | null };
type PointerDragState = DragPayload & { x: number; y: number };
type PointerDragHandlers = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel"
>;

const TIER_COLOR_PALETTE = [
  "bg-red-500",
  "bg-orange-400",
  "bg-brand-yellow",
  "bg-green-500",
  "bg-brand-blue",
  "bg-brand-blue",
  "bg-brand-yellow",
  "bg-teal-500",
];

const DEFAULT_TIERS: Tier[] = [
  { id: "S", label: "S", items: [] },
  { id: "A", label: "A", items: [] },
  { id: "B", label: "B", items: [] },
  { id: "C", label: "C", items: [] },
  { id: "D", label: "D", items: [] },
];

const LEGACY_TIER_KEYS = ["S", "A", "B", "C", "D"] as const;
const CREATE_STEP_COUNT = 4;

function StepProgress({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: CREATE_STEP_COUNT }, (_, index) => {
        const segment = index + 1;
        return (
          <div
            key={segment}
            className={`h-1 flex-1 rounded-full ${segment <= step ? "bg-brand-blue/100" : "bg-gray-200"}`}
          />
        );
      })}
    </div>
  );
}

function createDefaultTiers(): Tier[] {
  return DEFAULT_TIERS.map((tier) => ({ ...tier, items: [] }));
}

function mapPostItems(post: RankPost): TierItem[] {
  const itemsById = new Map<string, TierItem>();

  const rowItems = post.tierRows?.flatMap((row) => row.items) ?? [];

  [...post.allItems, ...rowItems, ...Object.values(post.tiers).flat()].forEach((item) => {
    itemsById.set(item.id, {
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      imageUrl: item.imageUrl,
    });
  });

  return Array.from(itemsById.values());
}

function mapPostTierData(post: RankPost): Tier[] {
  const toTierItems = (items: FeedTierItem[]): TierItem[] =>
    items.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      imageUrl: item.imageUrl,
    }));

  if (post.tierRows && post.tierRows.length > 0) {
    return post.tierRows.map((row) => ({
      id: row.id,
      label: row.label,
      items: toTierItems(row.items),
    }));
  }

  return LEGACY_TIER_KEYS.map((tier) => ({
    id: tier,
    label: tier,
    items: toTierItems(post.tiers[tier]),
  }));
}

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

function buildTierPayload(tiers: Tier[]): TierData {
  const toFeedItems = (items: TierItem[] = []): FeedTierItem[] =>
    items.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      imageUrl: item.imageUrl,
    }));

  return LEGACY_TIER_KEYS.reduce<TierData>(
    (payload, key, index) => {
      const directMatch = tiers.find((tier) => tier.id === key || tier.label.trim().toUpperCase() === key);
      payload[key] = toFeedItems((directMatch ?? tiers[index])?.items);
      return payload;
    },
    { S: [], A: [], B: [], C: [], D: [] },
  );
}

function buildTierRowsPayload(tiers: Tier[]): TierRow[] {
  return tiers.map((tier, index) => ({
    id: tier.id || `tier-${index + 1}`,
    label: tier.label.trim() || tier.id || `Tier ${index + 1}`,
    items: tier.items.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      imageUrl: item.imageUrl,
    })),
  }));
}

function TextChip({
  item,
  draggable: isDraggable,
  onDragStart,
  onDragEnd,
  pointerDragHandlers,
  onRemove,
  removable = true,
}: {
  item: TierItem;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  pointerDragHandlers?: PointerDragHandlers;
  onRemove?: () => void;
  removable?: boolean;
}) {
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...pointerDragHandlers}
      className={`inline-flex select-none items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm ${
        isDraggable ? "cursor-grab touch-none active:cursor-grabbing active:opacity-50" : ""
      }`}
    >
      {item.emoji && <span>{item.emoji}</span>}
      {item.name}
      {removable && onRemove && (
        <button
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
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
  pointerDragHandlers,
  onRemove,
  removable = true,
}: {
  item: TierItem;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  pointerDragHandlers?: PointerDragHandlers;
  onRemove?: () => void;
  removable?: boolean;
}) {
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...pointerDragHandlers}
      className={`relative flex w-16 flex-shrink-0 select-none flex-col items-center overflow-hidden ${
        isDraggable ? "cursor-grab touch-none active:cursor-grabbing active:opacity-50" : ""
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
      <span className="mt-0.5 max-w-[56px] overflow-hidden break-words text-center text-[10px] font-medium leading-tight text-gray-600 line-clamp-2">
        {item.name}
      </span>
      {removable && onRemove && (
        <button
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
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
  pointerDragHandlers,
  onRemove,
}: {
  item: TierItem;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  pointerDragHandlers?: PointerDragHandlers;
  onRemove?: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...pointerDragHandlers}
      className="relative flex w-12 flex-shrink-0 cursor-grab touch-none select-none flex-col items-center overflow-hidden active:cursor-grabbing active:opacity-50"
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
      <span className="mt-0.5 max-w-[44px] overflow-hidden break-words text-center text-[9px] font-medium leading-tight text-gray-600 line-clamp-2">
        {item.name}
      </span>
      {onRemove && (
        <button
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
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
  isUploadingImage: boolean;
  rankNewEmoji: string;
  rankNewImageUrl: string;
  rankNewName: string;
  onEmojiChange: (value: string) => void;
  onImageUpload: (file: File) => void;
  onImageUrlChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onAddItem: () => void;
}

function RankAddItemRow({
  itemFormat,
  isUploadingImage,
  rankNewEmoji,
  rankNewImageUrl,
  rankNewName,
  onEmojiChange,
  onImageUpload,
  onImageUrlChange,
  onNameChange,
  onAddItem,
}: RankAddItemRowProps) {
  const isImageFormat = itemFormat === "image";

  return (
    <div className="space-y-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className={isImageFormat ? "flex flex-col gap-2 sm:flex-row" : "flex gap-2"}>
        {!isImageFormat ? (
          <input
            type="text"
            value={rankNewEmoji}
            onChange={(event) => onEmojiChange(event.target.value)}
            placeholder="🎬"
            className="w-12 rounded-lg border border-gray-100 bg-gray-50 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        ) : (
          <div className="flex min-w-0 flex-1 gap-2">
            <input
              type="text"
              value={rankNewImageUrl}
              onChange={(event) => onImageUrlChange(event.target.value)}
              placeholder="Image URL"
              className="min-w-0 flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
            <label className="flex flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-brand-blue/15 bg-brand-blue/10 px-3 text-xs font-semibold text-brand-blue transition-colors hover:bg-brand-blue/15">
              {isUploadingImage ? "..." : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isUploadingImage}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) {
                    onImageUpload(file);
                  }
                }}
              />
            </label>
          </div>
        )}
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            type="text"
            value={rankNewName}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onAddItem()}
            placeholder="Item name"
            className="min-w-0 flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
          <button
            onClick={onAddItem}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-blue/100 text-white transition-colors hover:bg-brand-blue"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("choose");
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
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
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadingImageTarget, setUploadingImageTarget] = useState<ImageUploadTarget | null>(null);
  const [loadingSourcePostId, setLoadingSourcePostId] = useState<string | null>(null);
  const [loadingEditPostId, setLoadingEditPostId] = useState<string | null>(null);
  const [selectedSourcePostId, setSelectedSourcePostId] = useState<string | null>(null);
  const [selectedSourceTags, setSelectedSourceTags] = useState<string[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const dragPayload = useRef<DragPayload | null>(null);
  const pointerDragRef = useRef<PointerDragState | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [pointerDrag, setPointerDrag] = useState<PointerDragState | null>(null);

  const filteredTopics = trendingTopics.filter((topic) =>
    topic.title.toLowerCase().includes(searchTopic.toLowerCase()),
  );
  const selectedCategory = CATEGORIES.find((categoryItem) => categoryItem.id === category);
  const hasCoverPreview = hasUsableCoverImage(coverImage);

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
      setCoverImage(hasUsableCoverImage(post.coverImage) ? post.coverImage : "");
      setDescription("");
      setEditingPostId(null);
      setSelectedSourcePostId(post.id);
      setSelectedSourceTags(post.tags);
      setItemFormat(post.allItems.some((item) => item.imageUrl) ? "image" : "text");
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

  const loadEditPost = useCallback(async (postId: string) => {
    setLoadingEditPostId(postId);
    setPublishError(null);

    try {
      await ensureMockSession();
      const post = await fetchPost(postId);
      if (!post.canEdit) {
        throw new Error("You can only edit your own ranking.");
      }

      setTitle(post.title);
      setCategory(post.category);
      setCoverImage(hasUsableCoverImage(post.coverImage) ? post.coverImage : "");
      setDescription(post.description);
      setIsPublic(post.isPublic);
      setSelectedSourcePostId(null);
      setSelectedSourceTags(post.tags);
      setItemFormat(post.allItems.some((item) => item.imageUrl) ? "image" : "text");
      setItems(mapPostItems(post));
      setTiers(mapPostTierData(post));
      setMode("create-new");
      setStep(3);
      setEditingPostId(post.id);
      setShowAddInRank(false);
      setRankNewName("");
      setRankNewEmoji("");
      setRankNewImageUrl("");
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Failed to load that ranking for editing.");
    } finally {
      setLoadingEditPostId((current) => (current === postId ? null : current));
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("editPost")) {
      return;
    }

    const sourcePostId = searchParams.get("sourcePost");
    if (!sourcePostId || sourcePostId === selectedSourcePostId || loadingSourcePostId === sourcePostId) {
      return;
    }

    void loadSourcePost(sourcePostId);
  }, [loadSourcePost, loadingSourcePostId, searchParams, selectedSourcePostId]);

  useEffect(() => {
    const editPostId = searchParams.get("editPost");
    if (!editPostId || editPostId === editingPostId || loadingEditPostId === editPostId) {
      return;
    }

    void loadEditPost(editPostId);
  }, [editingPostId, loadEditPost, loadingEditPostId, searchParams]);

  const uploadListImage = async (file: File, target: ImageUploadTarget) => {
    setImageUploadError(null);
    setUploadingImageTarget(target);
    try {
      await ensureMockSession();
      const uploaded = await uploadImage(file, target === "cover" ? "tier-cover" : "rank-item");
      if (target === "cover") {
        setCoverImage(uploaded.url);
      } else if (target === "items") {
        setNewItemImageUrl(uploaded.url);
      } else {
        setRankNewImageUrl(uploaded.url);
      }
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setUploadingImageTarget(null);
    }
  };

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

  const resolvePointerDropZone = (clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY);
    if (!(element instanceof HTMLElement)) {
      return null;
    }

    return element.closest<HTMLElement>("[data-rank-drop-zone]")?.dataset.rankDropZone ?? null;
  };

  const clearPointerDrag = () => {
    pointerDragRef.current = null;
    setPointerDrag(null);
    dragPayload.current = null;
    setDragOverId(null);
  };

  const handleDragStart = (item: TierItem, fromTierId: string | null) => {
    dragPayload.current = { item, fromTierId };
  };

  const handleDragEnd = () => {
    dragPayload.current = null;
    setDragOverId(null);
  };

  const commitDrop = (payload: DragPayload, dropZoneId: string | null) => {
    if (!dropZoneId) {
      return;
    }

    if (dropZoneId === "unranked") {
      if (payload.fromTierId !== null) {
        removeFromTier(payload.item, payload.fromTierId);
      }
      return;
    }

    if (payload.fromTierId !== dropZoneId) {
      moveItemToTier(payload.item, payload.fromTierId, dropZoneId);
    }
  };

  const handlePointerDragStart = (
    event: React.PointerEvent<HTMLDivElement>,
    item: TierItem,
    fromTierId: string | null,
  ) => {
    if (event.pointerType === "mouse") {
      return;
    }

    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button,input,textarea,a,label")) {
      return;
    }

    const nextDrag = { item, fromTierId, x: event.clientX, y: event.clientY };
    dragPayload.current = { item, fromTierId };
    pointerDragRef.current = nextDrag;
    setPointerDrag(nextDrag);
    setDragOverId(resolvePointerDropZone(event.clientX, event.clientY));
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const activeDrag = pointerDragRef.current;
    if (!activeDrag) {
      return;
    }

    const nextDrag = { ...activeDrag, x: event.clientX, y: event.clientY };
    pointerDragRef.current = nextDrag;
    setPointerDrag(nextDrag);
    setDragOverId(resolvePointerDropZone(event.clientX, event.clientY));
    event.preventDefault();
  };

  const handlePointerDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const activeDrag = pointerDragRef.current;
    if (!activeDrag) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    commitDrop(activeDrag, resolvePointerDropZone(event.clientX, event.clientY));
    clearPointerDrag();
    event.preventDefault();
  };

  const getPointerDragHandlers = (item: TierItem, fromTierId: string | null): PointerDragHandlers => ({
    onPointerDown: (event) => handlePointerDragStart(event, item, fromTierId),
    onPointerMove: handlePointerDragMove,
    onPointerUp: handlePointerDragEnd,
    onPointerCancel: handlePointerDragEnd,
  });

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
    setCoverImage("");
    setDescription("");
    setCategory("");
    setIsPublic(true);
    setItemFormat("text");
    setShowAddInRank(false);
    setSearchTopic("");
    setSelectedSourcePostId(null);
    setSelectedSourceTags([]);
    setEditingPostId(null);
    setPublishError(null);
    setImageUploadError(null);
    setUploadingImageTarget(null);
    setLoadingSourcePostId(null);
    setLoadingEditPostId(null);
  };

  const handlePublish = async () => {
    setPublishError(null);
    setIsPublishing(true);

    try {
      await ensureMockSession();
      const payload = {
        title,
        category,
        coverImage: hasCoverPreview ? coverImage : "",
        description,
        tags: selectedSourceTags.length > 0 ? selectedSourceTags : [],
        tiers: buildTierPayload(tiers),
        tierRows: buildTierRowsPayload(tiers),
        allItems: items.map((item) => ({
          id: item.id,
          name: item.name,
          emoji: item.emoji,
          imageUrl: item.imageUrl,
        })),
        isPublic,
      };
      const savedPost = editingPostId
        ? await updateRankPost(editingPostId, payload)
        : await createRankPost({
            ...payload,
            sourcePostId: selectedSourcePostId ?? undefined,
          });
      router.push(`/topic/${savedPost.id}`);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Failed to save your ranking.");
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
            {editingPostId ? "Edit Tier List" : mode === "choose" ? "Create" : mode === "create-new" ? "New Tier List" : "Rank a Topic"}
          </h1>
          {mode !== "choose" ? (
            <button onClick={handleReset} className="text-sm font-medium text-brand-blue">
              {editingPostId ? "Cancel" : "Reset"}
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
            className="group w-full rounded-2xl border-2 border-brand-blue/25 bg-white p-5 text-left shadow-sm transition-all hover:border-brand-blue/55"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 text-2xl">🏆</div>
                <h3 className="font-bold text-gray-900">Create New Tier List</h3>
                <p className="mt-1 text-sm text-gray-500">Add your own topic, items, and share with the community</p>
              </div>
              <ChevronRight size={20} className="text-brand-blue/70 transition-colors group-hover:text-brand-blue" />
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
              {trendingTopics.slice(0, 3).map((topic) => {
                const hasCoverImage = hasUsableCoverImage(topic.coverImage);

                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      void loadSourcePost(topic.postId ?? topic.id);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-all hover:border-brand-blue/25"
                  >
                    {hasCoverImage ? (
                      <img src={topic.coverImage} alt={topic.title} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-sm font-black text-brand-blue">
                        {CATEGORIES.find((categoryItem) => categoryItem.id === topic.category)?.emoji ?? "#"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{topic.title}</p>
                      <p className="text-xs text-gray-400">{formatCount(topic.participantCount)} ranked this</p>
                    </div>
                    <ChevronRight size={16} className="flex-shrink-0 text-gray-400" />
                  </button>
                );
              })}
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
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div className="space-y-3">
            {filteredTopics.map((topic) => {
              const topicCategory = CATEGORIES.find((categoryItem) => categoryItem.id === topic.category);
              const hasCoverImage = hasUsableCoverImage(topic.coverImage);

              return (
                <button
                  key={topic.id}
                  onClick={() => {
                    void loadSourcePost(topic.postId ?? topic.id);
                  }}
                  className="flex w-full gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-all hover:border-brand-blue/25"
                >
                  {hasCoverImage ? (
                    <img src={topic.coverImage} alt={topic.title} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-lg">
                      {topicCategory?.emoji ?? "#"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-brand-blue">{topicCategory?.emoji} {topicCategory?.name}</span>
                    <h3 className="mt-0.5 text-sm font-bold text-gray-900">{topic.title}</h3>
                    <p className="mt-1 text-xs text-gray-400">{formatCount(topic.participantCount)} ranked this</p>
                  </div>
                  <div className="flex items-center">
                    {loadingSourcePostId === (topic.postId ?? topic.id) ? (
                      <span className="text-xs font-medium text-brand-blue">Loading...</span>
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === "create-new" && step === 1 && (
        <div className="space-y-4 px-4 pt-4 pb-8">
          <StepProgress step={step} />
          <p className="text-xs font-medium text-gray-400">Step 1 of 4 — Tier list setup</p>

          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Tier list name *</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Best Movies of 2024"
                className="mt-2 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Cover photo</label>
                  <p className="mt-0.5 text-[11px] text-gray-400">Optional. This is shown on the feed, search, and topic page.</p>
                </div>
                {hasCoverPreview ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage("");
                      setImageUploadError(null);
                    }}
                    className="text-xs font-semibold text-red-500 transition-colors hover:text-red-600"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                {hasCoverPreview ? (
                  <div className="relative aspect-[16/9] bg-gray-100">
                    <img
                      src={coverImage}
                      alt={`${title || "Tier list"} cover`}
                      className="h-full w-full object-cover"
                      onError={() => setCoverImage("")}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-3">
                      <p className="truncate text-xs font-bold text-white">{title || "Tier list cover"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] flex-col items-center justify-center px-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                      <Image size={22} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-800">Upload a cover for this tier list</p>
                    <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-400">
                      If you skip this, Rankster will keep using the clean no-cover layout.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-2 flex gap-2">
                <input
                  type="url"
                  value={coverImage}
                  onChange={(event) => setCoverImage(event.target.value)}
                  placeholder="Paste image URL or upload a photo"
                  className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
                <label className="flex h-10 cursor-pointer items-center rounded-xl border border-brand-blue/15 bg-brand-blue/10 px-3 text-xs font-semibold text-brand-blue transition-colors hover:bg-brand-blue/15">
                  {uploadingImageTarget === "cover" ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploadingImageTarget !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) {
                        void uploadListImage(file, "cover");
                      }
                    }}
                  />
                </label>
              </div>
              {imageUploadError ? <p className="mt-2 text-xs font-medium text-red-500">{imageUploadError}</p> : null}
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
                        ? "border-brand-blue/55 bg-brand-blue/10 text-brand-blue-dark"
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
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Item Format</label>
              <p className="mt-0.5 mb-2 text-[11px] text-gray-400">Applies to all items in this list</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setItemFormat("text")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm transition-all ${
                    itemFormat === "text"
                      ? "border-brand-blue/55 bg-brand-blue/10 font-semibold text-brand-blue-dark"
                      : "border-gray-100 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  <Type size={15} /> Text
                </button>
                <button
                  onClick={() => setItemFormat("image")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm transition-all ${
                    itemFormat === "image"
                      ? "border-brand-blue/55 bg-brand-blue/10 font-semibold text-brand-blue-dark"
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
                    isPublic ? "border-brand-blue/55 bg-brand-blue/10 text-brand-blue-dark" : "border-gray-100 text-gray-500"
                  }`}
                >
                  <Globe size={15} /> Public
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm transition-all ${
                    !isPublic ? "border-brand-blue/55 bg-brand-blue/10 text-brand-blue-dark" : "border-gray-100 text-gray-500"
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
            className="w-full rounded-2xl bg-brand-blue py-3.5 font-bold text-white shadow-lg transition-all hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next: Add Items →
          </button>
        </div>
      )}

      {mode === "create-new" && step === 2 && (
        <div className="space-y-4 px-4 pt-4 pb-8">
          <StepProgress step={step} />
          <p className="text-xs font-medium text-gray-400">Step 2 of 4 — Add Items</p>

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
                  className="w-12 rounded-xl border border-gray-100 bg-gray-50 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
                <input
                  type="text"
                  value={newItemName}
                  onChange={(event) => setNewItemName(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && addItem()}
                  placeholder="Item name (press Enter)"
                  className="flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
                <button
                  onClick={addItem}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/100 text-white transition-colors hover:bg-brand-blue"
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
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemImageUrl}
                    onChange={(event) => setNewItemImageUrl(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && addItem()}
                    placeholder="Image URL (optional)"
                    className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                  <label className="flex h-10 cursor-pointer items-center rounded-xl border border-brand-blue/15 bg-brand-blue/10 px-3 text-xs font-semibold text-brand-blue transition-colors hover:bg-brand-blue/15">
                    {uploadingImageTarget === "items" ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploadingImageTarget !== null}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) {
                          void uploadListImage(file, "items");
                        }
                      }}
                    />
                  </label>
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
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-blue/100 text-white transition-colors hover:bg-brand-blue"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {imageUploadError && <p className="text-xs font-medium text-red-500">{imageUploadError}</p>}
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
              className="flex-1 rounded-2xl bg-brand-blue py-3.5 font-bold text-white shadow-lg transition-all hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next: Rank →
            </button>
          </div>
        </div>
      )}

      {mode === "create-new" && step === 3 && (
        <div className="space-y-4 px-4 pt-4 pb-8">
          <StepProgress step={step} />
          <p className="text-xs font-medium text-gray-400">Step 3 of 4 — Build Your Ranking</p>
          {editingPostId && (
            <div className="rounded-2xl border border-brand-blue/15 bg-brand-blue/10 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">Editing Your Ranking</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{title}</p>
              <p className="mt-1 text-xs text-gray-500">Saving here updates the original post instead of creating a new one.</p>
            </div>
          )}
          {selectedSourcePostId && (
            <div className="rounded-2xl border border-brand-blue/15 bg-brand-blue/10 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">Ranking Existing Topic</p>
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
                  data-rank-drop-zone={tier.id}
                  className={`border-b border-gray-100 transition-colors last:border-0 ${isOver ? "bg-brand-blue/10" : ""}`}
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

                    <div className={`flex min-h-[56px] min-w-0 flex-1 flex-wrap gap-1.5 overflow-hidden p-2 ${itemFormat === "image" ? "items-start content-start" : "items-center"}`}>
                      {tier.items.map((item) =>
                        itemFormat === "image" ? (
                          <TierImageChip
                            key={item.id}
                            item={item}
                            onDragStart={() => handleDragStart(item, tier.id)}
                            onDragEnd={handleDragEnd}
                            pointerDragHandlers={getPointerDragHandlers(item, tier.id)}
                            onRemove={() => removeFromTier(item, tier.id)}
                          />
                        ) : (
                          <TextChip
                            key={item.id}
                            item={item}
                            draggable
                            onDragStart={() => handleDragStart(item, tier.id)}
                            onDragEnd={handleDragEnd}
                            pointerDragHandlers={getPointerDragHandlers(item, tier.id)}
                            onRemove={() => removeFromTier(item, tier.id)}
                          />
                        ),
                      )}
                      {isOver && tier.items.length === 0 && <span className="self-center text-xs italic text-brand-blue/70">Drop here</span>}
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
              className="flex w-full items-center justify-center gap-2 border-t border-gray-100 py-2.5 text-sm text-brand-blue transition-colors hover:bg-brand-blue/10 hover:text-brand-blue-dark"
            >
              <Plus size={14} /> Add Tier
            </button>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Unranked ({getUnrankedItems().length})</p>
              <button
                onClick={() => setShowAddInRank(!showAddInRank)}
                className="flex items-center gap-1 text-xs font-medium text-brand-blue transition-colors hover:text-brand-blue-dark"
              >
                <Plus size={13} />
                Add item
              </button>
            </div>

            {showAddInRank && (
              <div className="mb-2">
                <RankAddItemRow
                  itemFormat={itemFormat}
                  isUploadingImage={uploadingImageTarget !== null}
                  rankNewEmoji={rankNewEmoji}
                  rankNewImageUrl={rankNewImageUrl}
                  rankNewName={rankNewName}
                  onEmojiChange={setRankNewEmoji}
                  onImageUpload={(file) => void uploadListImage(file, "rank")}
                  onImageUrlChange={setRankNewImageUrl}
                  onNameChange={setRankNewName}
                  onAddItem={addItemInRank}
                />
                {imageUploadError && <p className="mt-2 text-xs font-medium text-red-500">{imageUploadError}</p>}
              </div>
            )}

            <div
              data-rank-drop-zone="unranked"
              className={`min-h-[52px] overflow-hidden rounded-xl border-2 border-dashed p-2 transition-colors ${
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
              <div className="flex min-w-0 flex-wrap gap-2 overflow-hidden">
                {getUnrankedItems().map((item) =>
                  itemFormat === "image" ? (
                    <ImageChip
                      key={item.id}
                      item={item}
                      draggable
                      onDragStart={() => handleDragStart(item, null)}
                      onDragEnd={handleDragEnd}
                      pointerDragHandlers={getPointerDragHandlers(item, null)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ) : (
                    <TextChip
                      key={item.id}
                      item={item}
                      draggable
                      onDragStart={() => handleDragStart(item, null)}
                      onDragEnd={handleDragEnd}
                      pointerDragHandlers={getPointerDragHandlers(item, null)}
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
              Drag items into tiers · On mobile, press and drag with one finger · Click a tier label to rename · × to remove an item
            </p>
          </div>

          {pointerDrag && (
            <div
              className="pointer-events-none fixed z-[70] max-w-[80vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-brand-blue/25 bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-2xl"
              style={{ left: pointerDrag.x, top: pointerDrag.y }}
            >
              {itemFormat === "image" && pointerDrag.item.imageUrl ? (
                <div className="flex min-w-0 items-center gap-2">
                  <img src={pointerDrag.item.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  <span className="truncate">{pointerDrag.item.name}</span>
                </div>
              ) : (
                <span>
                  {pointerDrag.item.emoji ? `${pointerDrag.item.emoji} ` : ""}
                  {pointerDrag.item.name}
                </span>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 font-bold text-gray-600 transition-all hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 rounded-2xl bg-brand-blue py-3.5 font-bold text-white shadow-lg transition-all hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next: Caption →
            </button>
          </div>
          {publishError && <p className="text-sm text-red-500">{publishError}</p>}
        </div>
      )}

      {mode === "create-new" && step === 4 && (
        <div className="space-y-4 px-4 pt-4 pb-8">
          <StepProgress step={step} />
          <p className="text-xs font-medium text-gray-400">Step 4 of 4 — Caption & Preview</p>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {hasCoverPreview ? (
              <div className="mb-4 aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100">
                <img src={coverImage} alt={`${title || "Tier list"} cover preview`} className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">Preview</p>
                <h2 className="mt-1 truncate text-lg font-black text-gray-900">{title}</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedCategory?.emoji} {selectedCategory?.name ?? "Uncategorized"}
                </p>
              </div>
              <span className="flex-shrink-0 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-500">
                {isPublic ? "Public" : "Private"}
              </span>
            </div>

            <TierListDisplay tiers={buildTierPayload(tiers)} tierRows={buildTierRowsPayload(tiers)} />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Post caption</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a caption for your post..."
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
            <p className="mt-2 text-xs text-gray-400">
              The tier list name stays as the post title. This caption appears under it in the feed.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(3)}
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 font-bold text-gray-600 transition-all hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => void handlePublish()}
              disabled={isPublishing}
              className="flex-1 rounded-2xl bg-brand-blue py-3.5 font-bold text-white shadow-lg transition-all hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing ? (editingPostId ? "Saving..." : "Publishing...") : editingPostId ? "Save changes" : "🚀 Publish"}
            </button>
          </div>
          {publishError && <p className="text-sm text-red-500">{publishError}</p>}
        </div>
      )}
    </div>
  );
}
