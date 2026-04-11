import type {
  AuthSession,
  ChatMessage,
  Category,
  CreateRankInput,
  LeaderboardEntry,
  Message,
  MessageThreadDetail,
  NotificationsResponse,
  ProfileResponse,
  RanksterNotification,
  RankPost,
  SearchOverviewResponse,
  TrendingTopic,
  User,
} from "./feedUi";

export interface FeedResponse {
  items: RankPost[];
  nextCursor: string | null;
}

export type FeedScope = "for-you" | "following";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const ACCESS_TOKEN_KEY = "rankster.accessToken";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_RANKSTER_API_URL ?? DEFAULT_API_BASE_URL);
}

function getWebSocketBaseUrl() {
  const apiBaseUrl = getApiBaseUrl();
  if (apiBaseUrl.startsWith("https://")) {
    return `wss://${apiBaseUrl.slice("https://".length)}`;
  }
  if (apiBaseUrl.startsWith("http://")) {
    return `ws://${apiBaseUrl.slice("http://".length)}`;
  }
  return apiBaseUrl;
}

export function getStoredAccessToken() {
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

export function clearStoredAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isMockAuthEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true";
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

async function createMockSession(username = "me") {
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

export async function resolveSession(username = "me") {
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
      clearStoredAccessToken();
    }
  }

  if (isMockAuthEnabled()) {
    return createMockSession(username);
  }

  return null;
}

export async function loginWithGoogleCredential(credential: string) {
  const session = await apiFetch<AuthSession>(
    "/auth/google",
    {
      method: "POST",
      body: JSON.stringify({ credential }),
    },
    false,
  );
  setStoredAccessToken(session.accessToken);
  return session;
}

export async function loginWithMockUser(username: string) {
  if (!isMockAuthEnabled()) {
    throw new Error("Mock auth is not enabled.");
  }
  return createMockSession(username);
}

export function logout() {
  clearStoredAccessToken();
}

export async function ensureMockSession(username = "me") {
  const session = await resolveSession(username);
  if (!session) {
    throw new Error("You need to sign in to continue.");
  }
  return session;
}

export async function fetchCurrentUserProfile() {
  return apiFetch<ProfileResponse>("/profile/me");
}

export async function fetchUserProfile(username: string) {
  return apiFetch<ProfileResponse>(`/profile/${encodeURIComponent(username)}`);
}

export async function fetchMainFeed(scope: FeedScope = "for-you", cursor?: string | null) {
  const params = new URLSearchParams();
  params.set("limit", "20");
  params.set("scope", scope);
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

export async function fetchMessageThread(threadId: string) {
  return apiFetch<MessageThreadDetail>(`/messages/threads/${encodeURIComponent(threadId)}`);
}

export async function sendMessage(threadId: string, text: string) {
  return apiFetch<ChatMessage>(`/messages/threads/${encodeURIComponent(threadId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function getMessageThreadSocketUrl(threadId: string) {
  const token = getStoredAccessToken();
  if (!token) {
    throw new Error("You need to sign in to open realtime messages.");
  }

  const params = new URLSearchParams({ token });
  return `${getWebSocketBaseUrl()}/messages/threads/${encodeURIComponent(threadId)}/ws?${params.toString()}`;
}

export async function fetchNotifications() {
  return apiFetch<NotificationsResponse>("/notifications");
}

export async function markNotificationRead(notificationId: string) {
  return apiFetch<RanksterNotification>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsRead() {
  return apiFetch<NotificationsResponse>("/notifications/read-all", {
    method: "POST",
  });
}

export async function fetchLeaderboard() {
  const response = await apiFetch<{ items: LeaderboardEntry[] }>("/leaderboard", {}, false);
  return response.items;
}

export async function fetchLeaderboardFiltered(timeframe: string, category: string) {
  const params = new URLSearchParams();
  params.set("timeframe", timeframe);
  params.set("category", category);
  const response = await apiFetch<{ items: LeaderboardEntry[] }>(`/leaderboard?${params.toString()}`, {}, false);
  return response.items;
}

export async function followUser(username: string) {
  return apiFetch<{ isFollowing: boolean }>(`/profile/${encodeURIComponent(username)}/follow`, {
    method: "POST",
  });
}

export async function unfollowUser(username: string) {
  return apiFetch<{ isFollowing: boolean }>(`/profile/${encodeURIComponent(username)}/follow`, {
    method: "DELETE",
  });
}

export async function pinProfilePost(postId: string) {
  return apiFetch<{ pinnedPostId: string | null }>(`/profile/me/pinned/${encodeURIComponent(postId)}`, {
    method: "POST",
  });
}

export async function unpinProfilePost(postId: string) {
  return apiFetch<{ pinnedPostId: string | null }>(`/profile/me/pinned/${encodeURIComponent(postId)}`, {
    method: "DELETE",
  });
}

export async function fetchPost(postId: string) {
  return apiFetch<RankPost>(`/feed/post/${encodeURIComponent(postId)}`, {}, false);
}
