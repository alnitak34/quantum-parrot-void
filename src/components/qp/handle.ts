// Shared helpers for the X handle used to deep-link into the real game.
export const HANDLE_KEY = "qp_x_handle";
export const GAME_BASE_URL = "https://alnitak34.github.io/quantum-parrot-void/game.html";

export function normalizeHandle(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const stripped = trimmed.replace(/^@+/, "");
  if (!stripped) return "";
  return "@" + stripped;
}

export function saveHandle(raw: string): string {
  if (typeof window === "undefined") return "";
  const normalized = normalizeHandle(raw);
  if (normalized) localStorage.setItem(HANDLE_KEY, normalized);
  else localStorage.removeItem(HANDLE_KEY);
  return normalized;
}

export function getHandle(): string {
  if (typeof window === "undefined") return "";
  return normalizeHandle(localStorage.getItem(HANDLE_KEY));
}

export function gameUrlWithHandle(): string {
  const h = getHandle();
  if (!h) return GAME_BASE_URL;
  return `${GAME_BASE_URL}?handle=${encodeURIComponent(h)}`;
}
