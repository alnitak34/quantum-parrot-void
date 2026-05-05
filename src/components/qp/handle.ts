// Shared helpers for the player name used to deep-link into the real game.
export const PLAYER_KEY = "qp_player_name";
export const HANDLE_KEY = "qp_x_handle"; // legacy
export const GAME_BASE_URL = "https://alnitak34.github.io/quantum-parrot-void/game.html";

export function normalizePlayer(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim();
}

function migrateLegacy() {
  if (typeof window === "undefined") return;
  const current = localStorage.getItem(PLAYER_KEY);
  if (current) return;
  const legacy = localStorage.getItem(HANDLE_KEY);
  if (legacy) {
    const normalized = normalizePlayer(legacy);
    if (normalized) localStorage.setItem(PLAYER_KEY, normalized);
    localStorage.removeItem(HANDLE_KEY);
  }
}

export function savePlayer(raw: string): string {
  if (typeof window === "undefined") return "";
  const normalized = normalizePlayer(raw);
  if (normalized) localStorage.setItem(PLAYER_KEY, normalized);
  else localStorage.removeItem(PLAYER_KEY);
  return normalized;
}

export function getPlayer(): string {
  if (typeof window === "undefined") return "";
  migrateLegacy();
  return normalizePlayer(localStorage.getItem(PLAYER_KEY));
}

export function gameUrlWithHandle(): string {
  const p = getPlayer();
  if (!p) return GAME_BASE_URL;
  return `${GAME_BASE_URL}?player=${encodeURIComponent(p)}`;
}

// Backwards-compat aliases (still used by other components)
export const saveHandle = savePlayer;
export const getHandle = getPlayer;
export const normalizeHandle = normalizePlayer;
