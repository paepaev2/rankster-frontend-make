export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  totalRankings: number;
  verified: boolean;
}

export interface TierItem {
  id: string;
  name: string;
  emoji?: string;
}

export interface TierData {
  S: TierItem[];
  A: TierItem[];
  B: TierItem[];
  C: TierItem[];
  D: TierItem[];
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

export interface RankPost {
  id: string;
  user: User;
  title: string;
  category: string;
  coverImage: string;
  tiers: TierData;
  allItems: TierItem[];
  description: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  shares: number;
  createdAt: string;
  isPublic: boolean;
  participantCount: number;
}

export interface Message {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  mine: boolean;
  timestamp: string;
}

export interface MessageThreadDetail {
  id: string;
  user: User;
  messages: ChatMessage[];
}

export interface ChatSocketEvent {
  type: "ready" | "message" | "error";
  threadId: string;
  message?: ChatMessage;
  error?: string;
  timestamp: string;
}

export interface MessageInboxSocketEvent {
  type: "ready" | "message";
  thread?: Message;
  unreadCount: number;
  timestamp: string;
}

export interface RanksterNotification {
  id: string;
  type: "comment" | "follow" | "rank" | string;
  title: string;
  body: string;
  actor?: User;
  href: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationSocketEvent {
  type: "ready" | "notification";
  notification?: RanksterNotification;
  unreadCount: number;
  timestamp: string;
}

export interface NotificationsResponse {
  items: RanksterNotification[];
  unreadCount: number;
}

export interface TrendingTopic {
  id: string;
  postId?: string;
  title: string;
  category: string;
  coverImage: string;
  participantCount: number;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface ProfileStatSummary {
  totalRankings: number;
  followers: number;
  following: number;
  totalLikes: number;
}

export interface ProfileCategoryBreakdown {
  id: string;
  name: string;
  emoji: string;
  pct: number;
}

export interface ProfileResponse {
  user: User;
  rankings: RankPost[];
  likedPosts: RankPost[];
  pinnedPostId: string | null;
  stats: ProfileStatSummary;
  favoriteCategories: ProfileCategoryBreakdown[];
  isFollowing: boolean;
}

export interface SearchOverviewResponse {
  users: User[];
  topics: TrendingTopic[];
  categories: Category[];
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
  change: string;
}

export interface CreateRankInput {
  title: string;
  category: string;
  description: string;
  tags: string[];
  tiers: TierData;
  allItems: TierItem[];
  isPublic: boolean;
  sourcePostId?: string;
}

export const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: "bg-red-500", text: "text-white", border: "border-red-600" },
  A: { bg: "bg-orange-400", text: "text-white", border: "border-orange-500" },
  B: { bg: "bg-yellow-400", text: "text-white", border: "border-yellow-500" },
  C: { bg: "bg-green-500", text: "text-white", border: "border-green-600" },
  D: { bg: "bg-blue-500", text: "text-white", border: "border-blue-600" },
};
