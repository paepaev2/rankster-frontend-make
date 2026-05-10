'use client';

import React, { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Users, ChevronDown, ChevronUp, Loader2, Download, Check } from "lucide-react";
import { hasUsableCoverImage, type Comment as RankPostComment, type RankPost, type TierRow, type User } from "../lib/feedUi";
import { TierListDisplay } from "./TierListDisplay";
import { CATEGORIES } from "../data/mockData";
import { useSaved } from "../lib/savedContext";
import { createComment, deleteRankPost, likeComment, likePost, unlikeComment, unlikePost, updateRankPost } from "../lib/ranksterApi";

interface RankPostCardProps {
  post: RankPost;
  onProfileClick?: (user: User) => void;
  onTopicClick?: (postId: string) => void;
  onRankThis?: (postId: string) => void;
  onEditTierList?: (postId: string) => void;
  onPostUpdated?: (post: RankPost) => void;
  onPostDeleted?: (postId: string) => void;
  currentUser?: User | null;
  isAuthLoading?: boolean;
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
  B: "#fcca00",
  C: "#16a34a",
  D: "#1e72c0",
};
const TIER_HEX_SEQUENCE = ["#ef4444", "#f97316", "#fcca00", "#16a34a", "#1e72c0", "#155a99", "#fcca00", "#14b8a6"];

const FONT = (size: number, weight: "normal" | "bold" = "normal") =>
  `${weight === "bold" ? "bold " : ""}${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

function displayTierRows(post: RankPost): TierRow[] {
  if (post.tierRows && post.tierRows.length > 0) {
    return post.tierRows;
  }
  return (["S", "A", "B", "C", "D"] as const).map((tier) => ({ id: tier, label: tier, items: post.tiers[tier] }));
}

function tierRowColor(row: TierRow, index: number) {
  const key = row.id in TIER_HEX ? row.id : row.label.trim().toUpperCase();
  return TIER_HEX[key] ?? TIER_HEX_SEQUENCE[index % TIER_HEX_SEQUENCE.length];
}

async function generateStoryImage(post: RankPost): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1e72c0");
  bg.addColorStop(0.58, "#155a99");
  bg.addColorStop(1, "#0b2a47");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle circle decorations
  ctx.globalAlpha = 0.07;
  for (const [cx, cy, cr] of [[180, 200, 280], [950, 400, 200], [100, 1700, 350], [1000, 1600, 180]] as [number, number, number][]) {
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = "#fcca00";
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── App logo / header ───────────────────────────────────────────────────────
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 80, 80, 90, 90, 22);
  ctx.fill();
  ctx.fillStyle = "#1e72c0";
  roundRect(ctx, 96, 126, 22, 30, 5);
  ctx.fill();
  roundRect(ctx, 132, 132, 22, 24, 5);
  ctx.fill();
  ctx.fillStyle = "#fcca00";
  roundRect(ctx, 113, 104, 26, 52, 6);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = FONT(20, "bold");
  ctx.textAlign = "center";
  ctx.fillText("1", 126, 136);

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
  const activeTiers = displayTierRows(post).filter((row) => row.items.length > 0);
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

  const coverImg = hasUsableCoverImage(post.coverImage) ? await tryLoadImage(post.coverImage) : null;
  if (coverImg) {
    ctx.drawImage(coverImg, CARD_X, CARD_Y, CARD_W, BANNER_H);
  } else {
    const bannerGrad = ctx.createLinearGradient(CARD_X, CARD_Y, CARD_X + CARD_W, CARD_Y + BANNER_H);
    bannerGrad.addColorStop(0, "#1e72c0");
    bannerGrad.addColorStop(1, "#fcca00");
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
    ctx.fillStyle = "rgba(30,114,192,0.12)";
    roundRect(ctx, CARD_X + 40, curY, 0, 48, 24); // width computed below
    const pillText = `${catInfo.emoji}  ${catInfo.name}`;
    ctx.font = FONT(32, "bold");
    const pillW = ctx.measureText(pillText).width + 48;
    ctx.fillStyle = "rgba(30,114,192,0.12)";
    roundRect(ctx, CARD_X + 40, curY, pillW, 48, 24);
    ctx.fill();
    ctx.fillStyle = "#155a99";
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
  for (const [tierIndex, row] of activeTiers.entries()) {
    const items = row.items;
    if (items.length === 0) continue;

    const rowX = CARD_X + 40;
    const rowW = CARD_W - 80;
    const rowLabel = row.label || row.id;
    const labelW = rowLabel.length > 2 ? 150 : 80;
    const itemsX = rowX + labelW + 12;
    const itemsW = rowW - labelW - 12;

    // Tier label box
    const color = tierRowColor(row, tierIndex);
    ctx.fillStyle = color;
    roundRect(ctx, rowX, curY, labelW, TIER_ROW_H, { tl: 16, tr: 0, bl: 16, br: 0 });
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = FONT(rowLabel.length > 2 ? 26 : 52, "bold");
    ctx.textAlign = "center";
    wrapText(ctx, rowLabel, rowX + labelW / 2, curY + (rowLabel.length > 2 ? 38 : TIER_ROW_H / 2 + 18), labelW - 16, 30, 2);

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
  ctx.fillStyle = "#1e72c0";
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
type ShareToastKind = "share-sheet" | "download" | "error";

export function RankPostCard({
  post: initialPost,
  onProfileClick,
  onTopicClick,
  onRankThis,
  onEditTierList,
  onPostUpdated,
  onPostDeleted,
  currentUser,
  isAuthLoading = false,
}: RankPostCardProps) {
  const [post, setPost] = useState(initialPost);
  const [liked, setLiked] = useState(initialPost.isLiked);
  const [likeCount, setLikeCount] = useState(initialPost.likes);
  const [isPostLikePending, setIsPostLikePending] = useState(false);
  const { savedIds, toggleSave } = useSaved();
  const saved = savedIds.has(post.id);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<RankPostComment[]>(initialPost.comments);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [pendingCommentLikeIds, setPendingCommentLikeIds] = useState<Set<string>>(() => new Set());
  const [postActionOpen, setPostActionOpen] = useState(false);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [isPostSaving, setIsPostSaving] = useState(false);
  const [isPostDeleting, setIsPostDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(initialPost.title);
  const [editDescription, setEditDescription] = useState(initialPost.description);
  const [editCategory, setEditCategory] = useState(initialPost.category);
  const [editTags, setEditTags] = useState(initialPost.tags.join(", "));
  const [editIsPublic, setEditIsPublic] = useState(initialPost.isPublic);
  const [shareOpen, setShareOpen] = useState(false);
  const [igState, setIgState] = useState<ShareState>("idle");
  const [igToast, setIgToast] = useState<string | null>(null);
  const [igToastKind, setIgToastKind] = useState<ShareToastKind>("share-sheet");

  const category = CATEGORIES.find((c) => c.id === post.category);
  const hasCoverImage = hasUsableCoverImage(post.coverImage);
  const commentPreview = comments.slice(0, 2);

  useEffect(() => {
    setPost(initialPost);
    setLiked(initialPost.isLiked);
    setLikeCount(initialPost.likes);
    setComments(initialPost.comments);
    setEditTitle(initialPost.title);
    setEditDescription(initialPost.description);
    setEditCategory(initialPost.category);
    setEditTags(initialPost.tags.join(", "));
    setEditIsPublic(initialPost.isPublic);
  }, [initialPost]);

  const handleLike = async () => {
    if (!currentUser) {
      setPostActionError("Sign in to like posts.");
      return;
    }

    if (isPostLikePending) {
      return;
    }

    const previousLiked = liked;
    const previousLikeCount = likeCount;
    const nextLiked = !previousLiked;
    const nextLikeCount = Math.max(0, previousLikeCount + (nextLiked ? 1 : -1));

    setIsPostLikePending(true);
    setPostActionError(null);
    setLiked(nextLiked);
    setLikeCount(nextLikeCount);

    try {
      const updatedLike = nextLiked ? await likePost(post.id) : await unlikePost(post.id);
      const updatedPost = { ...post, likes: updatedLike.likes, isLiked: updatedLike.isLiked };
      setPost(updatedPost);
      setLiked(updatedLike.isLiked);
      setLikeCount(updatedLike.likes);
      onPostUpdated?.(updatedPost);
    } catch (error) {
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);
      setPostActionError(error instanceof Error ? error.message : "Could not update the post like.");
    } finally {
      setIsPostLikePending(false);
    }
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  const handleShareInstagram = async () => {
    setShareOpen(false);
    setIgState("generating");
    setIgToast(null);
    setIgToastKind("share-sheet");

    try {
      const blob = await generateStoryImage(post);
      const file = new File([blob], "rankster-story.png", { type: "image/png" });

      // Mobile path: the browser can hand the image to the OS share sheet.
      // Instagram appears only when the device/browser exposes it as a share target.
      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file] });
        setIgState("done");
        setIgToastKind("share-sheet");
        setIgToast("Share sheet opened. If Instagram is available there, choose it to add the image to a story; otherwise save the image from the sheet.");
        setTimeout(() => {
          setIgState("idle");
          setIgToast(null);
        }, 7000);
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
      setIgToastKind("download");
      setIgToast("Story image downloaded. Open Instagram, start a story, tap the gallery picker, and choose rankster-story.png.");
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
        setIgToastKind("error");
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

  const handleStartEditPost = () => {
    setEditTitle(post.title);
    setEditDescription(post.description);
    setEditCategory(post.category);
    setEditTags(post.tags.join(", "));
    setEditIsPublic(post.isPublic);
    setPostActionError(null);
    setPostActionOpen(false);
    setIsEditingPost(true);
  };

  const handleSavePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = editTitle.trim();
    const category = editCategory.trim();
    if (!title || !category || isPostSaving) {
      return;
    }

    setIsPostSaving(true);
    setPostActionError(null);
    try {
      const updatedPost = await updateRankPost(post.id, {
        title,
        category,
        description: editDescription.trim(),
        tags: editTags
          .split(",")
          .map((tag) => tag.trim().replace(/^#/, ""))
          .filter(Boolean),
        tiers: post.tiers,
        tierRows: post.tierRows,
        allItems: post.allItems,
        isPublic: editIsPublic,
      });
      setPost(updatedPost);
      setIsEditingPost(false);
      onPostUpdated?.(updatedPost);
    } catch (error) {
      setPostActionError(error instanceof Error ? error.message : "Could not update this post.");
    } finally {
      setIsPostSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (isPostDeleting || !window.confirm("Delete this ranking post? This cannot be undone.")) {
      return;
    }

    setIsPostDeleting(true);
    setPostActionError(null);
    setPostActionOpen(false);
    try {
      await deleteRankPost(post.id);
      onPostDeleted?.(post.id);
    } catch (error) {
      setPostActionError(error instanceof Error ? error.message : "Could not delete this post.");
    } finally {
      setIsPostDeleting(false);
    }
  };

  const handleCommentLike = async (comment: RankPostComment) => {
    if (!currentUser) {
      setShowComments(true);
      setCommentError("Sign in to like comments.");
      return;
    }

    if (pendingCommentLikeIds.has(comment.id)) {
      return;
    }

    setPendingCommentLikeIds((currentIds) => new Set(currentIds).add(comment.id));
    setCommentError(null);
    try {
      const updatedComment = comment.isLiked ? await unlikeComment(comment.id) : await likeComment(comment.id);
      setComments((currentComments) =>
        currentComments.map((currentComment) =>
          currentComment.id === comment.id
            ? { ...currentComment, likes: updatedComment.likes, isLiked: updatedComment.isLiked }
            : currentComment,
        ),
      );
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Could not update the comment like.");
    } finally {
      setPendingCommentLikeIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(comment.id);
        return nextIds;
      });
    }
  };

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text || isCommentSubmitting) {
      return;
    }

    if (isAuthLoading) {
      setCommentError("Checking your session. Please try again in a moment.");
      return;
    }

    if (!currentUser) {
      setCommentError("Sign in to comment on this ranking.");
      return;
    }

    setIsCommentSubmitting(true);
    setCommentError(null);
    try {
      const createdComment = await createComment(post.id, text);
      const commentWithCurrentProfile =
        createdComment.user.id === currentUser.id
          ? { ...createdComment, user: currentUser }
          : createdComment;
      setComments((currentComments) => [commentWithCurrentProfile, ...currentComments]);
      setCommentText("");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Could not add your comment.");
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between ${hasCoverImage ? "p-4 pb-3" : "px-3 pt-3 pb-1"}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => onProfileClick?.(post.user)} className="relative">
            <Image
              src={post.user.avatar}
              alt={post.user.displayName}
              width={40}
              height={40}
              className={`${hasCoverImage ? "h-10 w-10" : "h-9 w-9"} rounded-full object-cover ring-2 ring-brand-blue/15`}
            />
            {post.user.verified && (
              <span className="absolute -bottom-0.5 -right-0.5 bg-brand-blue/100 rounded-full w-4 h-4 flex items-center justify-center">
                <span className="text-white text-[8px]">✓</span>
              </span>
            )}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onProfileClick?.(post.user)}
                className="truncate font-semibold text-gray-900 text-sm hover:text-brand-blue transition-colors"
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
        <div className="relative">
          <button
            onClick={() => post.canEdit && setPostActionOpen(!postActionOpen)}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label={post.canEdit ? "Open post actions" : "More post options"}
            aria-expanded={post.canEdit ? postActionOpen : undefined}
          >
            <MoreHorizontal size={18} />
          </button>
          {post.canEdit && postActionOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPostActionOpen(false)} />
              <div className="absolute right-0 top-8 z-20 min-w-[160px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                <button
                  type="button"
                  onClick={handleStartEditPost}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Edit post
                </button>
                {onEditTierList ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPostActionOpen(false);
                      onEditTierList(post.id);
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Edit tier list
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={isPostDeleting}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPostDeleting ? "Deleting..." : "Delete post"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {postActionError ? (
        <div className="mx-4 mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          {postActionError}
        </div>
      ) : null}

      {isEditingPost ? (
        <form onSubmit={handleSavePost} className="mx-4 mb-3 space-y-3 rounded-2xl border border-brand-blue/15 bg-brand-blue/10 p-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-blue">
              Title
            </label>
            <input
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              className="w-full rounded-xl border border-brand-blue/15 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-brand-blue/35 focus:ring-2 focus:ring-brand-blue/15"
              placeholder="Ranking title"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-blue">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              className="min-h-20 w-full resize-none rounded-xl border border-brand-blue/15 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-blue/35 focus:ring-2 focus:ring-brand-blue/15"
              placeholder="What is this ranking about?"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-blue">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(event) => setEditCategory(event.target.value)}
                className="w-full rounded-xl border border-brand-blue/15 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-brand-blue/35 focus:ring-2 focus:ring-brand-blue/15"
              >
                {CATEGORIES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.emoji} {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-blue">
                Tags
              </label>
              <input
                value={editTags}
                onChange={(event) => setEditTags(event.target.value)}
                className="w-full rounded-xl border border-brand-blue/15 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-blue/35 focus:ring-2 focus:ring-brand-blue/15"
                placeholder="anime, sports, food"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <input
              type="checkbox"
              checked={editIsPublic}
              onChange={(event) => setEditIsPublic(event.target.checked)}
              className="h-4 w-4 rounded border-brand-blue/25 text-brand-blue focus:ring-brand-blue"
            />
            Public post
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPostSaving || editTitle.trim() === ""}
              className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isPostSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingPost(false);
                setPostActionError(null);
              }}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* Cover Image & Title */}
      <button onClick={() => onTopicClick?.(post.id)} className="w-full text-left">
        {hasCoverImage ? (
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
        ) : (
          <div className="px-3 pb-0 pt-0">
            <h3 className="text-[15px] font-black leading-snug text-gray-900">{post.title}</h3>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
              <Users size={12} className="text-brand-blue/70" />
              <span>{formatCount(post.participantCount)} ranked this</span>
            </div>
          </div>
        )}
      </button>

      {/* Tier List */}
      <div className={`${hasCoverImage ? "px-4 pt-3" : "px-3 pt-2"}`}>
        <TierListDisplay tiers={post.tiers} tierRows={post.tierRows} compact={!expanded} />
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full text-center text-xs text-brand-blue font-medium mt-2 py-1 hover:text-brand-blue-dark flex items-center justify-center gap-1"
          >
            <ChevronDown size={14} /> Show full tier list
          </button>
        )}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="w-full text-center text-xs text-brand-blue font-medium mt-2 py-1 hover:text-brand-blue-dark flex items-center justify-center gap-1"
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
          <span key={tag} className="text-xs text-brand-blue hover:text-brand-blue-dark cursor-pointer">
            #{tag}
          </span>
        ))}
      </div>

      {!showComments && commentPreview.length > 0 ? (
        <div className="mx-4 mt-3 rounded-2xl bg-gray-50/90 px-3 py-2.5 text-left">
          <div className="space-y-2">
            {commentPreview.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => onProfileClick?.(comment.user)}
                  className="h-[22px] w-[22px] flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue/35"
                  aria-label={`Open ${comment.user.displayName}'s profile`}
                >
                  <Image
                    src={comment.user.avatar}
                    alt={comment.user.displayName}
                    width={22}
                    height={22}
                    className="h-[22px] w-[22px] rounded-full object-cover"
                  />
                </button>
                <div className="min-w-0 flex-1 truncate text-xs text-gray-600">
                  <button
                    type="button"
                    onClick={() => onProfileClick?.(comment.user)}
                    className="font-semibold text-gray-800 transition-colors hover:text-brand-blue focus:outline-none focus:text-brand-blue"
                  >
                    {comment.user.username}
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() => setShowComments(true)}
                    className="text-left transition-colors hover:text-gray-800 focus:outline-none focus:text-gray-800"
                  >
                    {comment.text}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {comments.length > commentPreview.length ? (
            <button
              type="button"
              onClick={() => setShowComments(true)}
              className="mt-2 text-[11px] font-semibold text-brand-blue transition-colors hover:text-brand-blue-dark"
            >
              View all {formatCount(comments.length)} comments
            </button>
          ) : null}
        </div>
      ) : null}

      {/* IG generating overlay */}
      {igState === "generating" && (
        <div className="mx-4 mt-3 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-yellow/15 to-brand-blue/10 rounded-xl border border-brand-yellow/30">
          <Loader2 size={18} className="text-brand-blue animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Creating story card…</p>
            <p className="text-xs text-gray-400">Drawing your tier list as a story-sized image</p>
          </div>
        </div>
      )}

      {/* IG toast (done / error) */}
      {igToast && (
        <div className={`mx-4 mt-3 flex items-start gap-3 px-4 py-3 rounded-xl border ${
          igState === "error"
            ? "bg-red-50 border-red-100"
            : "bg-gradient-to-r from-brand-yellow/15 to-brand-blue/10 border-brand-yellow/30"
        }`}>
          {igState === "done" && igToastKind === "share-sheet" ? (
            <Check size={18} className="text-brand-blue flex-shrink-0 mt-0.5" />
          ) : igState === "done" && igToastKind === "download" ? (
            <Download size={18} className="text-brand-blue flex-shrink-0 mt-0.5" />
          ) : (
            <span className="text-base flex-shrink-0">⚠️</span>
          )}
          <p className="text-xs text-gray-700 leading-relaxed">{igToast}</p>
        </div>
      )}

      {igState === "done" && !igToast && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-xl border border-green-100">
          <Check size={16} className="text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Story image is ready to share.</p>
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50 mt-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={isPostLikePending}
            className={`flex items-center gap-1.5 transition-all ${liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
            aria-label={liked ? "Unlike post" : "Like post"}
          >
            <Heart size={19} className={liked ? "fill-red-500" : ""} />
            <span className="text-xs font-semibold">{formatCount(likeCount)}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-brand-blue transition-colors"
          >
            <MessageCircle size={19} />
            <span className="text-xs font-semibold">{formatCount(comments.length)}</span>
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
                <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 min-w-[240px] z-20 overflow-hidden">
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-gray-900">Share this ranking</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-400">
                      Instagram opens only if your mobile share sheet offers it; otherwise we save the story image.
                    </p>
                  </div>

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
                    <span className="flex min-w-0 flex-col">
                      <span>{igState === "generating" ? "Generating…" : "Share story image"}</span>
                      {igState !== "generating" && (
                        <span className="text-[11px] font-normal leading-tight text-gray-400">Use share sheet or download fallback</span>
                      )}
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
          {onRankThis ? (
            <button
              type="button"
              onClick={() => onRankThis(post.id)}
              className="rounded-full border border-brand-blue/20 bg-brand-blue/10 px-2.5 py-1 text-[11px] font-bold text-brand-blue-dark transition-colors hover:border-brand-blue/35 hover:bg-brand-blue/15"
            >
              Rank this
            </button>
          ) : null}
        </div>

        <button
          onClick={() => toggleSave(post)}
          className={`transition-colors ${saved ? "text-brand-blue" : "text-gray-400 hover:text-brand-blue"}`}
          title={saved ? "Remove from saved" : "Save to rank later"}
        >
          <Bookmark size={19} className={saved ? "fill-brand-blue" : ""} />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => onProfileClick?.(comment.user)}
                  className="h-7 w-7 flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue/35"
                  aria-label={`Open ${comment.user.displayName}'s profile`}
                >
                  <Image
                    src={comment.user.avatar}
                    alt={comment.user.displayName}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                </button>
                <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onProfileClick?.(comment.user)}
                      className="text-xs font-semibold text-gray-800 transition-colors hover:text-brand-blue focus:outline-none focus:text-brand-blue"
                    >
                      {comment.user.username}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCommentLike(comment)}
                      disabled={pendingCommentLikeIds.has(comment.id)}
                      className={`flex items-center gap-0.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        comment.isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
                      }`}
                      aria-label={comment.isLiked ? "Unlike comment" : "Like comment"}
                    >
                      <Heart size={10} className={comment.isLiked ? "fill-red-500" : ""} />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-gray-50 px-3 py-3 text-center text-xs text-gray-400">
              Be the first to comment on this ranking.
            </div>
          )}

          {commentError ? (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              {commentError}
            </div>
          ) : null}

          {isAuthLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-xs font-medium text-gray-500">
              Loading your profile before commenting...
            </div>
          ) : currentUser ? (
            <form onSubmit={handleSubmitComment} className="flex gap-2.5">
              <Image
                src={currentUser.avatar}
                alt={currentUser.displayName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover flex-shrink-0"
              />
              <input
                type="text"
                placeholder={`Comment as ${currentUser.displayName}`}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-700 border border-gray-100 focus:outline-none focus:border-brand-blue/35 focus:ring-1 focus:ring-brand-blue/15"
              />
              <button
                type="submit"
                disabled={isCommentSubmitting || commentText.trim() === ""}
                className="rounded-xl bg-brand-blue px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                {isCommentSubmitting ? "Posting..." : "Post"}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-blue/15 bg-brand-blue/10 px-3 py-3">
              <div>
                <p className="text-xs font-bold text-brand-blue-dark">Sign in to comment</p>
                <p className="mt-0.5 text-xs text-brand-blue">Join the conversation with your Rankster profile.</p>
              </div>
              <a
                href="/login"
                className="shrink-0 rounded-xl bg-brand-blue px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-blue-dark"
              >
                Log in
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
