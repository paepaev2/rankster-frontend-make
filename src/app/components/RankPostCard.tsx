import React, { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Users, ChevronDown, ChevronUp } from "lucide-react";
import type { RankPost } from "../lib/feedUi";
import { TierListDisplay } from "./TierListDisplay";
import { CATEGORIES } from "../data/mockData";

interface RankPostCardProps {
  post: RankPost;
  onProfileClick?: (userId: string) => void;
  onTopicClick?: (postId: string) => void;
  onRankThis?: (postId: string) => void;
}

export function RankPostCard({ post, onProfileClick, onTopicClick, onRankThis }: RankPostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const category = CATEGORIES.find((c) => c.id === post.category);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onProfileClick?.(post.user.id)}
            className="relative"
          >
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
      <button
        onClick={() => onTopicClick?.(post.id)}
        className="w-full text-left"
      >
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
            <ChevronDown size={14} />
            Show full tier list
          </button>
        )}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="w-full text-center text-xs text-violet-500 font-medium mt-2 py-1 hover:text-violet-700 flex items-center justify-center gap-1"
          >
            <ChevronUp size={14} />
            Collapse
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

      {onRankThis && (
        <div className="px-4 pt-3">
          <button
            onClick={() => onRankThis(post.id)}
            className="w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100"
          >
            Rank This Yourself
          </button>
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
          <div className="relative">
            <button
              onClick={() => setShareOpen(!shareOpen)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 transition-colors"
            >
              <Share2 size={19} />
              <span className="text-xs font-semibold">{formatCount(post.shares)}</span>
            </button>
            {shareOpen && (
              <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[160px] z-10">
                {["Copy Link", "Share to Twitter/X", "Share to Instagram", "Share to WhatsApp"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setShareOpen(false)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 rounded-lg transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
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
