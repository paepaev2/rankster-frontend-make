'use client';

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, GripVertical, ChevronRight, Globe, Lock, Search } from "lucide-react";
import { CATEGORIES, TRENDING_TOPICS } from "../data/mockData";

type Mode = "choose" | "create-new" | "rank-existing";

interface TierItem {
  id: string;
  name: string;
  emoji?: string;
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

export function CreatePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("");
  const [items, setItems] = useState<TierItem[]>([]);
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1=info, 2=items, 3=rank
  const [searchTopic, setSearchTopic] = useState("");

  // Drag state
  const dragPayload = useRef<{ item: TierItem; fromTierId: string | null } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null); // tier.id or "unranked"

  const filteredTopics = TRENDING_TOPICS.filter((t) =>
    t.title.toLowerCase().includes(searchTopic.toLowerCase())
  );

  // ── Item pool ────────────────────────────────────────────────────────────────

  const addItem = () => {
    if (!newItemName.trim()) return;
    setItems([...items, {
      id: `item_${Date.now()}`,
      name: newItemName.trim(),
      emoji: newItemEmoji || undefined,
    }]);
    setNewItemName("");
    setNewItemEmoji("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const getUnrankedItems = () => {
    const rankedIds = new Set(tiers.flatMap((t) => t.items).map((i) => i.id));
    return items.filter((i) => !rankedIds.has(i.id));
  };

  // ── Tier data ────────────────────────────────────────────────────────────────

  const moveItemToTier = (item: TierItem, fromTierId: string | null, toTierId: string) => {
    setTiers((prev) =>
      prev.map((tier) => {
        if (tier.id === fromTierId) return { ...tier, items: tier.items.filter((i) => i.id !== item.id) };
        if (tier.id === toTierId) return { ...tier, items: [...tier.items, item] };
        return tier;
      })
    );
  };

  const removeFromTier = (item: TierItem, tierId: string) => {
    setTiers((prev) =>
      prev.map((tier) =>
        tier.id === tierId ? { ...tier, items: tier.items.filter((i) => i.id !== item.id) } : tier
      )
    );
  };

  const addTier = () => {
    const newId = `tier_${Date.now()}`;
    setTiers((prev) => [...prev, { id: newId, label: "New", items: [] }]);
    setEditingTierId(newId);
  };

  const deleteTier = (tierId: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
  };

  const renameTier = (tierId: string, newLabel: string) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, label: newLabel } : t))
    );
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────────

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

  // ── Misc ─────────────────────────────────────────────────────────────────────

  const handlePublish = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-4 pt-12 pb-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <X size={22} />
          </button>
          <h1 className="text-base font-bold text-gray-900">
            {mode === "choose" ? "Create" : mode === "create-new" ? "New Tier List" : "Rank a Topic"}
          </h1>
          {mode !== "choose" && (
            <button
              onClick={() => {
                setMode("choose"); setStep(1);
                setTiers(DEFAULT_TIERS); setItems([]);
                setTitle(""); setCategory("");
              }}
              className="text-sm text-violet-500 font-medium"
            >
              Reset
            </button>
          )}
          {mode === "choose" && <div className="w-8" />}
        </div>
      </div>

      {/* ── Choose Mode ── */}
      {mode === "choose" && (
        <div className="px-4 pt-6 pb-8 space-y-4">
          <p className="text-gray-500 text-sm text-center">What would you like to do?</p>

          <button
            onClick={() => setMode("create-new")}
            className="w-full bg-white rounded-2xl p-5 border-2 border-violet-200 hover:border-violet-400 text-left shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-bold text-gray-900">Create New Tier List</h3>
                <p className="text-sm text-gray-500 mt-1">Add your own topic, items, and share with the community</p>
              </div>
              <ChevronRight size={20} className="text-violet-400 group-hover:text-violet-600 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => setMode("rank-existing")}
            className="w-full bg-white rounded-2xl p-5 border-2 border-orange-200 hover:border-orange-400 text-left shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl mb-2">🔥</div>
                <h3 className="font-bold text-gray-900">Rank an Existing Topic</h3>
                <p className="text-sm text-gray-500 mt-1">Share your take on trending topics and compare with others</p>
              </div>
              <ChevronRight size={20} className="text-orange-400 group-hover:text-orange-600 transition-colors" />
            </div>
          </button>

          <div className="mt-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Hot Right Now 🔥</h2>
            <div className="space-y-2">
              {TRENDING_TOPICS.slice(0, 3).map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setMode("rank-existing")}
                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:border-violet-200 transition-all shadow-sm text-left"
                >
                  <img src={topic.coverImage} alt={topic.title} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{topic.title}</p>
                    <p className="text-xs text-gray-400">{(topic.participantCount / 1000).toFixed(1)}k ranked this</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Rank Existing ── */}
      {mode === "rank-existing" && (
        <div className="px-4 pt-4 pb-8">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="Search existing topics..."
              className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div className="space-y-3">
            {filteredTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => {
                  setTitle(topic.title);
                  setCategory(topic.category);
                  setMode("create-new");
                  setStep(3);
                  setTiers(DEFAULT_TIERS);
                  setItems([
                    { id: "si1", name: "Item 1" },
                    { id: "si2", name: "Item 2" },
                    { id: "si3", name: "Item 3" },
                    { id: "si4", name: "Item 4" },
                    { id: "si5", name: "Item 5" },
                  ]);
                }}
                className="w-full flex gap-3 bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-violet-200 shadow-sm transition-all text-left"
              >
                <img src={topic.coverImage} alt={topic.title} className="w-20 h-20 object-cover flex-shrink-0" />
                <div className="py-3 pr-3 flex-1">
                  <span className="text-xs text-violet-500 font-medium">
                    {CATEGORIES.find((c) => c.id === topic.category)?.emoji}
                  </span>
                  <h3 className="font-bold text-sm text-gray-900 mt-0.5">{topic.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {(topic.participantCount / 1000).toFixed(1)}k participants
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Info ── */}
      {mode === "create-new" && step === 1 && (
        <div className="px-4 pt-4 pb-8 space-y-4">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-violet-500" : "bg-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">Step 1 of 3 — Topic Info</p>

          <div className="bg-white rounded-2xl p-4 space-y-4 border border-gray-100 shadow-sm">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Best Movies of 2024"
                className="w-full mt-2 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Category *</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-sm transition-all border-2 ${
                      category === cat.id
                        ? "border-violet-400 bg-violet-50 text-violet-700"
                        : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span className="text-xs font-medium truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this tier list about?"
                rows={3}
                className="w-full mt-2 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:bg-white transition-all resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Visibility</label>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border-2 transition-all ${isPublic ? "border-violet-400 bg-violet-50 text-violet-700" : "border-gray-100 text-gray-500"}`}
                >
                  <Globe size={15} /> Public
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border-2 transition-all ${!isPublic ? "border-violet-400 bg-violet-50 text-violet-700" : "border-gray-100 text-gray-500"}`}
                >
                  <Lock size={15} /> Private
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => title && category && setStep(2)}
            disabled={!title || !category}
            className="w-full bg-violet-600 text-white py-3.5 rounded-2xl font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-700 transition-all shadow-lg"
          >
            Next: Add Items →
          </button>
        </div>
      )}

      {/* ── Step 2: Items ── */}
      {mode === "create-new" && step === 2 && (
        <div className="px-4 pt-4 pb-8 space-y-4">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-violet-500" : "bg-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">Step 2 of 3 — Add Items</p>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Add Items to Rank</label>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newItemEmoji}
                onChange={(e) => setNewItemEmoji(e.target.value)}
                placeholder="🎬"
                className="w-12 bg-gray-50 rounded-xl text-center py-2.5 text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="Item name (press Enter)"
                className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <button
                onClick={addItem}
                className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center text-white hover:bg-violet-600 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-300">
                  <span className="text-3xl">📝</span>
                  <p className="text-sm mt-2">Add items to rank</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <GripVertical size={16} className="text-gray-300" />
                    {item.emoji && <span>{item.emoji}</span>}
                    <span className="text-sm text-gray-800 flex-1">{item.name}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
              {items.length} item{items.length !== 1 ? "s" : ""} added
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-white border border-gray-200 text-gray-600 py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => items.length >= 2 && setStep(3)}
              disabled={items.length < 2}
              className="flex-2 flex-1 bg-violet-600 text-white py-3.5 rounded-2xl font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-700 transition-all shadow-lg"
            >
              Next: Rank →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Rank ── */}
      {mode === "create-new" && step === 3 && (
        <div className="px-4 pt-4 pb-8 space-y-4">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-violet-500" : "bg-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">Step 3 of 3 — Build Your Ranking</p>

          {/* Tier rows — each is a drop target */}
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            {tiers.map((tier, index) => {
              const bgColor = TIER_COLOR_PALETTE[index % TIER_COLOR_PALETTE.length];
              const isOver = dragOverId === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`border-b border-gray-100 last:border-0 transition-colors ${isOver ? "bg-violet-50" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverId(tier.id); }}
                  onDragLeave={(e) => {
                    // only clear if leaving the row itself, not a child
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverId(null);
                  }}
                  onDrop={() => handleDropOnTier(tier.id)}
                >
                  <div className="flex items-stretch min-h-[56px]">
                    {/* Tier label — dynamic width, click to rename */}
                    <div className={`${bgColor} min-w-[3.5rem] px-2 flex items-center justify-center flex-shrink-0`}>
                      {editingTierId === tier.id ? (
                        <input
                          autoFocus
                          value={tier.label}
                          onChange={(e) => renameTier(tier.id, e.target.value)}
                          onBlur={() => setEditingTierId(null)}
                          onKeyDown={(e) => { if (e.key === "Enter") setEditingTierId(null); }}
                          className="w-full bg-transparent text-white font-black text-sm text-center focus:outline-none border-b border-white/60 min-w-0"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingTierId(tier.id)}
                          title="Click to rename"
                          className="font-black text-white text-sm text-center w-full h-full flex items-center justify-center hover:bg-black/10 transition-colors leading-tight break-all py-2"
                        >
                          {tier.label || "?"}
                        </button>
                      )}
                    </div>

                    {/* Items inside the tier */}
                    <div className="flex flex-wrap gap-1.5 p-2 flex-1 min-h-[56px]">
                      {tier.items.map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={() => handleDragStart(item, tier.id)}
                          onDragEnd={handleDragEnd}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 font-medium shadow-sm cursor-grab active:cursor-grabbing active:opacity-50 select-none"
                        >
                          {item.emoji && <span>{item.emoji}</span>}
                          {item.name}
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); removeFromTier(item, tier.id); }}
                            className="ml-0.5 text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {/* Drop hint when dragging over an empty tier */}
                      {isOver && tier.items.length === 0 && (
                        <span className="text-xs text-violet-400 italic self-center">Drop here</span>
                      )}
                    </div>

                    {/* Delete tier */}
                    {tiers.length > 1 && (
                      <button
                        onClick={() => deleteTier(tier.id)}
                        className="flex-shrink-0 w-9 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        title="Remove tier"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add tier */}
            <button
              onClick={addTier}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-violet-500 hover:text-violet-700 hover:bg-violet-50 transition-colors border-t border-gray-100"
            >
              <Plus size={14} />
              Add Tier
            </button>
          </div>

          {/* Unranked pool — also a drop target */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Unranked ({getUnrankedItems().length})
            </p>
            <div
              className={`flex flex-wrap gap-2 min-h-[52px] rounded-xl p-2 border-2 border-dashed transition-colors ${
                dragOverId === "unranked"
                  ? "border-gray-400 bg-gray-100"
                  : "border-gray-200 bg-white"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOverId("unranked"); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverId(null);
              }}
              onDrop={handleDropOnUnranked}
            >
              {getUnrankedItems().map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item, null)}
                  onDragEnd={handleDragEnd}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm text-gray-700 shadow-sm cursor-grab active:cursor-grabbing active:opacity-50 select-none"
                >
                  {item.emoji && <span>{item.emoji}</span>}
                  {item.name}
                </div>
              ))}
              {getUnrankedItems().length === 0 && dragOverId !== "unranked" && (
                <p className="text-sm text-green-600 font-medium self-center">✅ All items ranked!</p>
              )}
              {dragOverId === "unranked" && (
                <p className="text-sm text-gray-400 italic self-center">Drop to unrank</p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Drag items into tiers · Drag between tiers to re-rank · Click a tier label to rename it
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-white border border-gray-200 text-gray-600 py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handlePublish}
              className="flex-2 flex-1 bg-violet-600 text-white py-3.5 rounded-2xl font-bold hover:bg-violet-700 transition-all shadow-lg"
            >
              🚀 Publish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
