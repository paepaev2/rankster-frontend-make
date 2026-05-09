export function messagePathForUsername(username: string) {
  return `/dm?username=${encodeURIComponent(username)}`;
}

export function loginPathForReturnTo(path: string) {
  return `/login?next=${encodeURIComponent(path)}`;
}

export function getSafeLoginNextPath() {
  if (typeof window === "undefined") {
    return "/";
  }

  const nextPath = new URLSearchParams(window.location.search).get("next");
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}
