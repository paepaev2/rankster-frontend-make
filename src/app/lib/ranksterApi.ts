import type {
  AuthSession,
  Category,
  CreateRankInput,
  LeaderboardEntry,
  Message,
  ProfileResponse,
  RankPost,
  SearchOverviewResponse,
  TrendingTopic,
  User,
} from "./feedUi";

export interface FeedResponse {
  items: RankPost[];
  nextCursor: string | null;
}

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const ACCESS_TOKEN_KEY = "rankster.mock.accessToken";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_RANKSTER_API_URL ?? DEFAULT_API_BASE_URL);
}

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

function setStoredAccessToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

async function apiFetch<T>(path: string, init: RequestInit = {}, requireAuth = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const token = getStoredAccessToken();
  if (requireAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(bodyText || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function ensureMockSession(username = "me") {
  const token = getStoredAccessToken();
  if (token) {
    try {
      const response = await apiFetch<{ user: User }>("/auth/me");
      return {
        accessToken: token,
        tokenType: "Bearer",
        user: response.user,
      } satisfies AuthSession;
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    }
  }

  const session = await apiFetch<AuthSession>(
    "/auth/mock-login",
    {
      method: "POST",
      body: JSON.stringify({ username }),
    },
    false,
  );
  setStoredAccessToken(session.accessToken);
  return session;
}

export async function fetchCurrentUserProfile() {
  return apiFetch<ProfileResponse>("/profile/me");
}

export async function fetchUserProfile(username: string) {
  return apiFetch<ProfileResponse>(`/profile/${encodeURIComponent(username)}`, {}, false);
}

export async function fetchMainFeed(cursor?: string | null) {
  const params = new URLSearchParams();
  params.set("limit", "20");
  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiFetch<FeedResponse>(`/feed/main?${params.toString()}`);
}

export async function fetchTrendingTopics() {
  const response = await apiFetch<{ items: TrendingTopic[] }>("/search/trending", {}, false);
  return response.items;
}

export async function fetchSearchOverview(query: string) {
  const params = new URLSearchParams();
  params.set("q", query);
  return apiFetch<SearchOverviewResponse>(`/search/overview?${params.toString()}`, {}, false);
}

export async function fetchCategories() {
  const response = await apiFetch<{ items: Category[] }>("/search/categories", {}, false);
  return response.items;
}

export async function createRankPost(input: CreateRankInput) {
  return apiFetch<RankPost>("/rank/create", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchMessageThreads() {
  const response = await apiFetch<{ items: Message[] }>("/messages/threads");
  return response.items;
}

export async function fetchLeaderboard() {
  const response = await apiFetch<{ items: LeaderboardEntry[] }>("/leaderboard", {}, false);
  return response.items;
}

export async function fetchPost(postId: string) {
  return apiFetch<RankPost>(`/feed/post/${encodeURIComponent(postId)}`, {}, false);
}
