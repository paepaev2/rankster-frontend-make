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

export interface TierRow {
  id: string;
  label: string;
  items: TierItem[];
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  createdAt: string;
  likes: number;
}

export interface RankPost {
  id: string;
  user: User;
  title: string;
  category: string;
  coverImage: string;
  tiers: TierData;
  tierRows?: TierRow[];
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

export interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  coverImage: string;
  participantCount: number;
  tags: string[];
}

export const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: "bg-red-500", text: "text-white", border: "border-red-600" },
  A: { bg: "bg-orange-400", text: "text-white", border: "border-orange-500" },
  B: { bg: "bg-yellow-400", text: "text-white", border: "border-yellow-500" },
  C: { bg: "bg-green-500", text: "text-white", border: "border-green-600" },
  D: { bg: "bg-blue-500", text: "text-white", border: "border-blue-600" },
};

export const CATEGORIES = [
  { id: "movies", name: "Movies & TV", emoji: "🎬", color: "bg-purple-100 text-purple-700" },
  { id: "music", name: "Music", emoji: "🎵", color: "bg-pink-100 text-pink-700" },
  { id: "food", name: "Food & Drinks", emoji: "🍕", color: "bg-orange-100 text-orange-700" },
  { id: "sports", name: "Sports", emoji: "🏀", color: "bg-green-100 text-green-700" },
  { id: "gaming", name: "Gaming", emoji: "🎮", color: "bg-blue-100 text-blue-700" },
  { id: "anime", name: "Anime", emoji: "⛩️", color: "bg-red-100 text-red-700" },
  { id: "travel", name: "Travel", emoji: "✈️", color: "bg-cyan-100 text-cyan-700" },
  { id: "tech", name: "Tech", emoji: "💻", color: "bg-slate-100 text-slate-700" },
  { id: "fashion", name: "Fashion", emoji: "👗", color: "bg-rose-100 text-rose-700" },
  { id: "books", name: "Books", emoji: "📚", color: "bg-amber-100 text-amber-700" },
];

export const USERS: User[] = [
  {
    id: "u1",
    username: "tierqueen",
    displayName: "Sophia Chen",
    avatar: "https://images.unsplash.com/photo-1643816831186-b2427a8f9f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    bio: "Ranking everything, one tier at a time 🏆 | Film buff | Foodie",
    followers: 12400,
    following: 832,
    totalRankings: 147,
    verified: true,
  },
  {
    id: "u2",
    username: "rankmaster99",
    displayName: "Jordan Miles",
    avatar: "https://images.unsplash.com/photo-1724118135606-b4ff6b631cd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    bio: "Sports & Gaming tier lists | Hot takes only 🔥",
    followers: 8930,
    following: 421,
    totalRankings: 89,
    verified: false,
  },
  {
    id: "u3",
    username: "animequeen",
    displayName: "Yuki Tanaka",
    avatar: "https://images.unsplash.com/photo-1718113460570-45a11d4226db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    bio: "Anime & manga enthusiast 🌸 | Seasonal watcher | Music lover",
    followers: 21050,
    following: 1203,
    totalRankings: 214,
    verified: true,
  },
  {
    id: "u4",
    username: "drip_scholar",
    displayName: "Marcus Thompson",
    avatar: "https://images.unsplash.com/photo-1732154478254-f94aebec9501?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    bio: "Fashion & culture critic | Every fit is a tier list 👔",
    followers: 5670,
    following: 309,
    totalRankings: 62,
    verified: false,
  },
  {
    id: "u5",
    username: "me",
    displayName: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    bio: "Just vibing and ranking | Music & Movies | LA based 🌴",
    followers: 3210,
    following: 891,
    totalRankings: 38,
    verified: false,
  },
];

export const MOCK_POSTS: RankPost[] = [
  {
    id: "p1",
    user: USERS[2],
    title: "Best Anime of Winter 2025",
    category: "anime",
    coverImage: "https://images.unsplash.com/photo-1576924423220-49915f67a9e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    tiers: {
      S: [{ id: "i1", name: "Frieren", emoji: "⚔️" }, { id: "i2", name: "Dandadan", emoji: "👻" }],
      A: [{ id: "i3", name: "Blue Box", emoji: "🏸" }, { id: "i4", name: "Solo Leveling S2", emoji: "🗡️" }],
      B: [{ id: "i5", name: "Apothecary Diaries", emoji: "🌿" }],
      C: [{ id: "i6", name: "Wind Breaker", emoji: "💨" }],
      D: [{ id: "i7", name: "Sakamoto Days", emoji: "🕶️" }],
    },
    allItems: [
      { id: "i1", name: "Frieren" }, { id: "i2", name: "Dandadan" }, { id: "i3", name: "Blue Box" },
      { id: "i4", name: "Solo Leveling S2" }, { id: "i5", name: "Apothecary Diaries" },
      { id: "i6", name: "Wind Breaker" }, { id: "i7", name: "Sakamoto Days" },
    ],
    description: "My honest tier list for this season. Frieren is a masterpiece, change my mind.",
    tags: ["anime", "winter2025", "seasonal"],
    likes: 2847,
    isLiked: true,
    comments: [
      { id: "c1", user: USERS[0], text: "Sakamoto Days in D is criminal 😤", createdAt: "2h ago", likes: 142 },
      { id: "c2", user: USERS[1], text: "Finally someone who appreciates Blue Box!", createdAt: "3h ago", likes: 87 },
    ],
    shares: 341,
    createdAt: "4h ago",
    isPublic: true,
    participantCount: 1247,
  },
  {
    id: "p2",
    user: USERS[0],
    title: "Pizza Toppings Definitive Ranking",
    category: "food",
    coverImage: "https://images.unsplash.com/photo-1763478279302-fb574409a302?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    tiers: {
      S: [{ id: "j1", name: "Pepperoni", emoji: "🍕" }, { id: "j2", name: "Mushrooms", emoji: "🍄" }],
      A: [{ id: "j3", name: "Olives", emoji: "🫒" }, { id: "j4", name: "BBQ Chicken", emoji: "🍗" }],
      B: [{ id: "j5", name: "Bell Peppers", emoji: "🫑" }, { id: "j6", name: "Sausage", emoji: "🌭" }],
      C: [{ id: "j7", name: "Anchovies", emoji: "🐟" }],
      D: [{ id: "j8", name: "Pineapple", emoji: "🍍" }],
    },
    allItems: [
      { id: "j1", name: "Pepperoni" }, { id: "j2", name: "Mushrooms" }, { id: "j3", name: "Olives" },
      { id: "j4", name: "BBQ Chicken" }, { id: "j5", name: "Bell Peppers" },
      { id: "j6", name: "Sausage" }, { id: "j7", name: "Anchovies" }, { id: "j8", name: "Pineapple" },
    ],
    description: "The definitive pizza topping tier list. Pineapple deserves D and I will not be taking questions.",
    tags: ["food", "pizza", "hotTake"],
    likes: 5102,
    isLiked: false,
    comments: [
      { id: "c3", user: USERS[3], text: "Pineapple supremacy!! D tier is wrong 🍍🔥", createdAt: "1h ago", likes: 312 },
      { id: "c4", user: USERS[1], text: "Finally! A correct pizza tier list.", createdAt: "2h ago", likes: 201 },
    ],
    shares: 892,
    createdAt: "6h ago",
    isPublic: true,
    participantCount: 4321,
  },
  {
    id: "p3",
    user: USERS[1],
    title: "NBA Players 2024-25 Season",
    category: "sports",
    coverImage: "https://images.unsplash.com/photo-1677031058176-000425075d04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    tiers: {
      S: [{ id: "k1", name: "Nikola Jokić", emoji: "🐐" }, { id: "k2", name: "Shai Gilgeous-Alexander", emoji: "🌟" }],
      A: [{ id: "k3", name: "LeBron James", emoji: "👑" }, { id: "k4", name: "Luka Dončić", emoji: "🔥" }],
      B: [{ id: "k5", name: "Giannis Antetokounmpo", emoji: "💪" }, { id: "k6", name: "Kevin Durant", emoji: "🐍" }],
      C: [{ id: "k7", name: "Stephen Curry", emoji: "🏹" }],
      D: [{ id: "k8", name: "Kyrie Irving", emoji: "💫" }],
    },
    allItems: [
      { id: "k1", name: "Nikola Jokić" }, { id: "k2", name: "Shai Gilgeous-Alexander" },
      { id: "k3", name: "LeBron James" }, { id: "k4", name: "Luka Dončić" },
      { id: "k5", name: "Giannis Antetokounmpo" }, { id: "k6", name: "Kevin Durant" },
      { id: "k7", name: "Stephen Curry" }, { id: "k8", name: "Kyrie Irving" },
    ],
    description: "Controversial? Maybe. Accurate? Absolutely. Let the arguments begin.",
    tags: ["nba", "basketball", "sports"],
    likes: 8912,
    isLiked: false,
    comments: [
      { id: "c5", user: USERS[2], text: "Curry in C is absolutely disrespectful 💀", createdAt: "30m ago", likes: 876 },
    ],
    shares: 1204,
    createdAt: "8h ago",
    isPublic: true,
    participantCount: 6789,
  },
  {
    id: "p4",
    user: USERS[3],
    title: "2024 Hip-Hop Albums",
    category: "music",
    coverImage: "https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    tiers: {
      S: [{ id: "l1", name: "GNX - Kendrick", emoji: "🎤" }, { id: "l2", name: "Chromakopia - Tyler", emoji: "👁️" }],
      A: [{ id: "l3", name: "Bright Future - Adrianne", emoji: "☀️" }],
      B: [{ id: "l4", name: "Short n' Sweet - Sabrina", emoji: "🩷" }, { id: "l5", name: "HIT ME HARD - Billie", emoji: "🖤" }],
      C: [{ id: "l6", name: "Radical Optimism - Dua", emoji: "✨" }],
      D: [],
    },
    allItems: [
      { id: "l1", name: "GNX - Kendrick" }, { id: "l2", name: "Chromakopia - Tyler" },
      { id: "l3", name: "Bright Future - Adrianne" }, { id: "l4", name: "Short n' Sweet - Sabrina" },
      { id: "l5", name: "HIT ME HARD - Billie" }, { id: "l6", name: "Radical Optimism - Dua" },
    ],
    description: "2024 was a legendary year for music. GNX and Chromakopia are instant classics.",
    tags: ["music", "hiphop", "2024", "albums"],
    likes: 3401,
    isLiked: true,
    comments: [],
    shares: 567,
    createdAt: "1d ago",
    isPublic: true,
    participantCount: 2109,
  },
  {
    id: "p5",
    user: USERS[0],
    title: "Best Video Games of 2024",
    category: "gaming",
    coverImage: "https://images.unsplash.com/photo-1610561212775-b191f21b6998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    tiers: {
      S: [{ id: "m1", name: "Elden Ring DLC", emoji: "⚔️" }, { id: "m2", name: "Balatro", emoji: "🃏" }],
      A: [{ id: "m3", name: "Black Myth: Wukong", emoji: "🐒" }, { id: "m4", name: "Astro Bot", emoji: "🤖" }],
      B: [{ id: "m5", name: "Tekken 8", emoji: "👊" }, { id: "m6", name: "Palworld", emoji: "🦄" }],
      C: [{ id: "m7", name: "Senua's Saga", emoji: "🌑" }],
      D: [],
    },
    allItems: [
      { id: "m1", name: "Elden Ring DLC" }, { id: "m2", name: "Balatro" },
      { id: "m3", name: "Black Myth: Wukong" }, { id: "m4", name: "Astro Bot" },
      { id: "m5", name: "Tekken 8" }, { id: "m6", name: "Palworld" }, { id: "m7", name: "Senua's Saga" },
    ],
    description: "2024 was packed with bangers. Balatro being S tier is the most correct take I've ever had.",
    tags: ["gaming", "2024", "videogames"],
    likes: 4231,
    isLiked: false,
    comments: [
      { id: "c6", user: USERS[1], text: "Balatro S tier is absolutely based 🃏", createdAt: "5h ago", likes: 234 },
    ],
    shares: 712,
    createdAt: "2d ago",
    isPublic: true,
    participantCount: 3456,
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg1",
    user: USERS[2],
    lastMessage: "Your NBA tier list is so wrong lmaoo 😭",
    timestamp: "2m ago",
    unread: 3,
  },
  {
    id: "msg2",
    user: USERS[0],
    lastMessage: "omg same taste in anime!! ✨",
    timestamp: "15m ago",
    unread: 1,
  },
  {
    id: "msg3",
    user: USERS[1],
    lastMessage: "Can you rank coffee shops next?",
    timestamp: "1h ago",
    unread: 0,
  },
  {
    id: "msg4",
    user: USERS[3],
    lastMessage: "The collab tier list is live!",
    timestamp: "3h ago",
    unread: 0,
  },
];

export const TRENDING_TOPICS: TrendingTopic[] = [
  {
    id: "t1",
    title: "Best Anime of Winter 2025",
    category: "anime",
    coverImage: "https://images.unsplash.com/photo-1576924423220-49915f67a9e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    participantCount: 12847,
    tags: ["anime", "winter2025"],
  },
  {
    id: "t2",
    title: "Pizza Toppings Ranking",
    category: "food",
    coverImage: "https://images.unsplash.com/photo-1763478279302-fb574409a302?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    participantCount: 48231,
    tags: ["food", "pizza"],
  },
  {
    id: "t3",
    title: "NBA All-Stars 2025",
    category: "sports",
    coverImage: "https://images.unsplash.com/photo-1677031058176-000425075d04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    participantCount: 89012,
    tags: ["nba", "basketball"],
  },
  {
    id: "t4",
    title: "Best Albums of 2024",
    category: "music",
    coverImage: "https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    participantCount: 31456,
    tags: ["music", "2024"],
  },
  {
    id: "t5",
    title: "Video Games GOTY 2024",
    category: "gaming",
    coverImage: "https://images.unsplash.com/photo-1610561212775-b191f21b6998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    participantCount: 67890,
    tags: ["gaming", "goty"],
  },
  {
    id: "t6",
    title: "Best Coffee Shops NYC",
    category: "food",
    coverImage: "https://images.unsplash.com/photo-1629991848910-2ab88d9cc52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    participantCount: 5432,
    tags: ["coffee", "nyc"],
  },
];

export const LEADERBOARD_USERS = [
  { rank: 1, user: USERS[2], score: 98240, change: "+2" },
  { rank: 2, user: USERS[0], score: 87103, change: "-1" },
  { rank: 3, user: USERS[1], score: 65892, change: "+5" },
  { rank: 4, user: USERS[3], score: 43210, change: "+1" },
  { rank: 5, user: USERS[4], score: 28901, change: "-2" },
];

export const MY_RANKINGS: RankPost[] = [MOCK_POSTS[3], MOCK_POSTS[4]];
