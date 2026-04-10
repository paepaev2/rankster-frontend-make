'use client';

import React, { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Users, ChevronDown, ChevronUp, Loader2, Download, Check } from "lucide-react";
import type { RankPost, TierData } from "../lib/feedUi";
import { TierListDisplay } from "./TierListDisplay";
import { CATEGORIES } from "../data/mockData";

interface RankPostCardProps {
  post: RankPost;
  onProfileClick?: (userId: string) => void;
  onTopicClick?: (postId: string) => void;
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number | { tl: number; tr: number; br: number; bl: number }
) {
  const radius = typeof r === "number"
    ? { tl: r, tr: r, br: r, bl: r }
    : r;
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + w - radius.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
  ctx.lineTo(x + w, y + h - radius.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
  ctx.lineTo(x + radius.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, startY: number,
  maxWidth: number, lineHeight: number,
  maxLines = 3
): number {
  const words = text.split(" ");
  let line = "";
  let y = startY;
  let lineCount = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      if (lineCount >= maxLines - 1) {
        ctx.fillText(line.trimEnd() + "…", x, y);
        return y + lineHeight;
      }
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
      lineCount++;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
  return y + lineHeight;
}

async function tryLoadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    // Timeout in case CORS hangs silently
    setTimeout(() => resolve(null), 4000);
    img.src = src;
  });
}

const TIER_HEX: Record<string, string> = {
  S: "#ef4444",
  A: "#f97316",
  B: "#d97706",
  C: "#16a34a",
  D: "#2563eb",
};

const FONT = (size: number, weight: "normal" | "bold" = "normal") =>
  `${weight === "bold" ? "bold " : ""}${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

async function generateStoryImage(post: RankPost): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1e1b4b");   // indigo-950
  bg.addColorStop(0.5, "#2e1065"); // violet-950
  bg.addColorStop(1, "#0f0a1e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle circle decorations
  ctx.globalAlpha = 0.07;
  for (const [cx, cy, cr] of [[180, 200, 280], [950, 400, 200], [100, 1700, 350], [1000, 1600, 180]] as [number, number, number][]) {
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = "#7c3aed";
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── App logo / header ───────────────────────────────────────────────────────
  ctx.fillStyle = "#7c3aed";
  roundRect(ctx, 80, 80, 90, 90, 22);
  ctx.fill();
  ctx.font = FONT(52);
  ctx.textAlign = "center";
  ctx.fillText("🏆", 125, 148);

  ctx.fillStyle = "#ffffff";
  ctx.font = FONT(64, "bold");
  ctx.textAlign = "left";
  ctx.fillText("Rankster", 190, 148);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = FONT(36);
  ctx.fillText("Tier List", 192, 196);

  // ── White card ──────────────────────────────────────────────────────────────
  const CARD_X = 60, CARD_Y = 240, CARD_W = 960, CARD_R = 40;

  // Dynamically compute card height based on tier count
  const TIER_KEYS = ["S", "A", "B", "C", "D"] as const;
  const activeTiers = TIER_KEYS.filter((k) => post.tiers[k]?.length > 0);
  const TIER_ROW_H = 96, TIER_GAP = 14;
  const tierBlockH = activeTiers.length * TIER_ROW_H + (activeTiers.length - 1) * TIER_GAP;
  const BANNER_H = 380;
  const CARD_H = BANNER_H + 80 + 220 + tierBlockH + 120 + 100; // banner + title + padding + tiers + user + pad
  const CARD_BOTTOM = CARD_Y + CARD_H;

  // Card shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_R);
  ctx.fill();
  ctx.restore();

  // ── Cover banner ────────────────────────────────────────────────────────────
  ctx.save();
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, BANNER_H, { tl: CARD_R, tr: CARD_R, bl: 0, br: 0 });
  ctx.clip();

  // Try cover image, fall back to gradient
  const coverImg = await tryLoadImage(post.coverImage);
  if (coverImg) {
    ctx.drawImage(coverImg, CARD_X, CARD_Y, CARD_W, BANNER_H);
  } else {
    const bannerGrad = ctx.createLinearGradient(CARD_X, CARD_Y, CARD_X + CARD_W, CARD_Y + BANNER_H);
    bannerGrad.addColorStop(0, "#7c3aed");
    bannerGrad.addColorStop(1, "#4f46e5");
    ctx.fillStyle = bannerGrad;
    ctx.fillRect(CARD_X, CARD_Y, CARD_W, BANNER_H);
  }

  // Dark overlay on banner bottom half for legibility
  const bannerOverlay = ctx.createLinearGradient(0, CARD_Y + BANNER_H * 0.4, 0, CARD_Y + BANNER_H);
  bannerOverlay.addColorStop(0, "rgba(0,0,0,0)");
  bannerOverlay.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = bannerOverlay;
  ctx.fillRect(CARD_X, CARD_Y, CARD_W, BANNER_H);
  ctx.restore();

  // Participant count chip
  const chipY = CARD_Y + 28;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  roundRect(ctx, CARD_X + 32, chipY, 250, 44, 22);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = FONT(30);
  ctx.textAlign = "left";
  const count = post.participantCount >= 1000
    ? `${(post.participantCount / 1000).toFixed(1)}k`
    : String(post.participantCount);
  ctx.fillText(`👥  ${count} ranked this`, CARD_X + 56, chipY + 30);

  // Title over banner
  ctx.fillStyle = "#ffffff";
  ctx.font = FONT(60, "bold");
  const titleY = CARD_Y + BANNER_H - 110;
  wrapText(ctx, post.title, CARD_X + 40, titleY, CARD_W - 80, 72, 2);

  // ── Title section below banner ───────────────────────────────────────────────
  let curY = CARD_Y + BANNER_H + 44;

  // Category pill
  const catInfo = CATEGORIES.find((c) => c.id === post.category);
  if (catInfo) {
    ctx.fillStyle = "#ede9fe"; // violet-100
    roundRect(ctx, CARD_X + 40, curY, 0, 48, 24); // width computed below
    const pillText = `${catInfo.emoji}  ${catInfo.name}`;
    ctx.font = FONT(32, "bold");
    const pillW = ctx.measureText(pillText).width + 48;
    ctx.fillStyle = "#ede9fe";
    roundRect(ctx, CARD_X + 40, curY, pillW, 48, 24);
    ctx.fill();
    ctx.fillStyle = "#5b21b6"; // violet-800
    ctx.textAlign = "left";
    ctx.fillText(pillText, CARD_X + 64, curY + 34);
    curY += 80;
  }

  // "Rankings" section label
  ctx.fillStyle = "#6b7280"; // gray-500
  ctx.font = FONT(30, "bold");
  ctx.textAlign = "left";
  ctx.fillText("TIER RANKINGS", CARD_X + 40, curY);
  curY += 48;

  // ── Tier rows ────────────────────────────────────────────────────────────────
  for (const tier of TIER_KEYS) {
    const items = post.tiers[tier] ?? [];
    if (items.length === 0) continue;

    const rowX = CARD_X + 40;
    const rowW = CARD_W - 80;
    const labelW = 80;
    const itemsX = rowX + labelW + 12;
    const itemsW = rowW - labelW - 12;

    // Tier label box
    const color = TIER_HEX[tier] ?? "#6b7280";
    ctx.fillStyle = color;
    roundRect(ctx, rowX, curY, labelW, TIER_ROW_H, { tl: 16, tr: 0, bl: 16, br: 0 });
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = FONT(52, "bold");
    ctx.textAlign = "center";
    ctx.fillText(tier, rowX + labelW / 2, curY + TIER_ROW_H / 2 + 18);

    // Items area
    ctx.fillStyle = "#f9fafb"; // gray-50
    roundRect(ctx, itemsX, curY, itemsW, TIER_ROW_H, { tl: 0, tr: 16, bl: 0, br: 16 });
    ctx.fill();

    ctx.fillStyle = "#374151"; // gray-700
    ctx.font = FONT(34);
    ctx.textAlign = "left";
    const rawText = items.map((it) => (it.emoji ? `${it.emoji} ${it.name}` : it.name)).join("  ·  ");
    const maxChars = Math.floor(itemsW / 20);
    const displayText = rawText.length > maxChars ? rawText.slice(0, maxChars) + "…" : rawText;
    ctx.fillText(displayText, itemsX + 20, curY + TIER_ROW_H / 2 + 12);

    curY += TIER_ROW_H + TIER_GAP;
  }

  curY += 24;

  // ── User credit ──────────────────────────────────────────────────────────────
  // Avatar circle with initial
  const avatarR = 40;
  const avatarX = CARD_X + 40 + avatarR;
  const avatarY = curY + avatarR;
  ctx.fillStyle = "#7c3aed";
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.fill();

  // Try to load user avatar
  const userImg = await tryLoadImage(post.user.avatar);
  if (userImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(userImg, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = FONT(40, "bold");
    ctx.textAlign = "center";
    ctx.fillText(post.user.displayName[0]?.toUpperCase() ?? "?", avatarX, avatarY + 14);
  }

  const textX = CARD_X + 40 + avatarR * 2 + 20;
  ctx.fillStyle = "#111827";
  ctx.font = FONT(38, "bold");
  ctx.textAlign = "left";
  ctx.fillText(post.user.displayName, textX, curY + 44);

  ctx.fillStyle = "#9ca3af";
  ctx.font = FONT(32);
  ctx.fillText(`@${post.user.username} · my ranking`, textX, curY + 86);

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = Math.min(CARD_BOTTOM + 60, H - 80);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = FONT(34);
  ctx.textAlign = "center";
  ctx.fillText("rankster · let's rank everything", W / 2, footerY);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas export failed"));
      },
      "image/png"
    );
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

type ShareState = "idle" | "generating" | "done" | "error";

export function RankPostCard({ post, onProfileClick, onTopicClick }: RankPostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [igState, setIgState] = useState<ShareState>("idle");
  const [igToast, setIgToast] = useState<string | null>(null);

  const category = CATEGORIES.find((c) => c.id === post.category);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  const handleShareInstagram = async () => {
    setShareOpen(false);
    setIgState("generating");
    setIgToast(null);

    try {
      const blob = await generateStoryImage(post);
      const file = new File([blob], "rankster-story.png", { type: "image/png" });

      // Mobile path — Web Share API with files (iOS Safari / Android Chrome)
      // The system share sheet includes Instagram Stories as a target
      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file] });
        setIgState("done");
        setTimeout(() => setIgState("idle"), 3000);
        return;
      }

      // Desktop / unsupported path — download + instructions
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rankster-story.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIgState("done");
      setIgToast("Image saved! Open Instagram → Stories → Gallery icon, then select rankster-story.png");
      setTimeout(() => {
        setIgState("idle");
        setIgToast(null);
      }, 7000);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User cancelled the share sheet — not an error
        setIgState("idle");
      } else {
        console.error("Instagram share failed:", err);
        setIgState("error");
        setIgToast("Couldn't generate the share image. Try again.");
        setTimeout(() => {
          setIgState("idle");
          setIgToast(null);
        }, 4000);
      }
    }
  };

  const handleCopyLink = async () => {
    setShareOpen(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/topic/${post.id}`);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => onProfileClick?.(post.user.id)} className="relative">
            <Image
              src={post.user.avatar}
              alt={post.user.displayName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-100"
            />
            {post.user.verified && (
              <span className="absolute -bottom-0.5 -right-0.5 bg-violet-500 rounded-full w-4 h-4 flex items-center justify-center">
                <span className="text-white text-[8px]">✓</span>
              </span>
            )}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onProfileClick?.(post.user.id)}
                className="font-semibold text-gray-900 text-sm hover:text-violet-600 transition-colors"
              >
                {post.user.displayName}
              </button>
              <span className="text-gray-400 text-xs">·</span>
              <span className="text-gray-400 text-xs">{post.createdAt}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${category?.color || "bg-gray-100 text-gray-600"}`}>
                {category?.emoji} {category?.name}
              </span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Cover Image & Title */}
      <button onClick={() => onTopicClick?.(post.id)} className="w-full text-left">
        <div className="relative">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={720}
            height={288}
            className="h-36 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-base leading-tight">{post.title}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Users size={11} className="text-white/70" />
              <span className="text-white/70 text-xs">{formatCount(post.participantCount)} ranked this</span>
            </div>
          </div>
        </div>
      </button>

      {/* Tier List */}
      <div className="px-4 pt-3">
        <TierListDisplay tiers={post.tiers} compact={!expanded} />
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full text-center text-xs text-violet-500 font-medium mt-2 py-1 hover:text-violet-700 flex items-center justify-center gap-1"
          >
            <ChevronDown size={14} /> Show full tier list
          </button>
        )}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="w-full text-center text-xs text-violet-500 font-medium mt-2 py-1 hover:text-violet-700 flex items-center justify-center gap-1"
          >
            <ChevronUp size={14} /> Collapse
          </button>
        )}
      </div>

      {/* Description */}
      {post.description && (
        <div className="px-4 pt-2">
          <p className="text-sm text-gray-600 leading-relaxed">{post.description}</p>
        </div>
      )}

      {/* Tags */}
      <div className="px-4 pt-2 flex flex-wrap gap-1">
        {post.tags.map((tag) => (
          <span key={tag} className="text-xs text-violet-500 hover:text-violet-700 cursor-pointer">
            #{tag}
          </span>
        ))}
      </div>

      {/* IG generating overlay */}
      {igState === "generating" && (
        <div className="mx-4 mt-3 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
          <Loader2 size={18} className="text-pink-500 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Creating story card…</p>
            <p className="text-xs text-gray-400">Drawing your tier list onto an IG story canvas</p>
          </div>
        </div>
      )}

      {/* IG toast (done / error) */}
      {igToast && (
        <div className={`mx-4 mt-3 flex items-start gap-3 px-4 py-3 rounded-xl border ${
          igState === "error"
            ? "bg-red-50 border-red-100"
            : "bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100"
        }`}>
          {igState === "done" ? (
            <Download size={18} className="text-pink-500 flex-shrink-0 mt-0.5" />
          ) : (
            <span className="text-base flex-shrink-0">⚠️</span>
          )}
          <p className="text-xs text-gray-700 leading-relaxed">{igToast}</p>
        </div>
      )}

      {igState === "done" && !igToast && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-xl border border-green-100">
          <Check size={16} className="text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Shared to Instagram Stories!</p>
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50 mt-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-all ${liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
          >
            <Heart size={19} className={liked ? "fill-red-500" : ""} />
            <span className="text-xs font-semibold">{formatCount(likeCount)}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-violet-500 transition-colors"
          >
            <MessageCircle size={19} />
            <span className="text-xs font-semibold">{formatCount(post.comments.length)}</span>
          </button>

          {/* Share dropdown */}
          <div className="relative">
            <button
              onClick={() => setShareOpen(!shareOpen)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 transition-colors"
            >
              <Share2 size={19} />
              <span className="text-xs font-semibold">{formatCount(post.shares)}</span>
            </button>

            {shareOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShareOpen(false)}
                />
                <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 min-w-[200px] z-20 overflow-hidden">
        

                  <div className="h-px bg-gray-100 my-1" />

                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <span>🔗</span> Copy Link
                  </button>
                  {/* Instagram Stories */}
                  <button
                    onClick={handleShareInstagram}
                    disabled={igState === "generating"}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {igState === "generating" ? (
                      <Loader2 size={18} className="text-gray-500 animate-spin flex-shrink-0" />
                    ) : (
                      <span className="text-lg leading-none">📸</span>
                    )}
                    <span>
                      {igState === "generating" ? "Generating…" : "Share to Instagram"}
                    </span>
                  </button>
                  <button
                    onClick={() => setShareOpen(false)}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <span>𝕏</span> Share to Twitter/X
                  </button>
                  <button
                    onClick={() => setShareOpen(false)}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <span>💬</span> Share to WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setSaved(!saved)}
          className={`transition-colors ${saved ? "text-violet-500" : "text-gray-400 hover:text-violet-500"}`}
        >
          <Bookmark size={19} className={saved ? "fill-violet-500" : ""} />
        </button>
      </div>

      {/* Comments */}
      {showComments && post.comments.length > 0 && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
          {post.comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <Image
                src={comment.user.avatar}
                alt={comment.user.displayName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover flex-shrink-0"
              />
              <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800">{comment.user.username}</span>
                  <button className="flex items-center gap-0.5 text-gray-400 hover:text-red-400 text-xs">
                    <Heart size={10} />
                    <span>{comment.likes}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{comment.text}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-600 text-xs font-bold">A</span>
            </div>
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-700 border border-gray-100 focus:outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
