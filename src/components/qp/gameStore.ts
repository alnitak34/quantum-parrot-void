// Tiny client-side pub/sub for the "Enter the Void" mini-game.
// Lets Hero start the game, the GameOverlay run the loop, and SignalFeed/TOP react.

export interface FeedSignal {
  time: string;
  user: string;
  action: string;
  points: number;
}

export interface TopEntry {
  user: string;
  score: number;
}

export interface GameResult {
  survived: number;
  signal: number;
  cause: string;
  user: string;
}

type Events = {
  "game:start": void;
  "game:end": GameResult;
  "feed:push": FeedSignal;
  "top:push": TopEntry;
};

type Handler<K extends keyof Events> = (payload: Events[K]) => void;

const listeners: { [K in keyof Events]?: Set<Handler<K>> } = {};

export function on<K extends keyof Events>(event: K, fn: Handler<K>) {
  (listeners[event] ??= new Set() as Set<Handler<K>>).add(fn as Handler<K>);
  return () => listeners[event]?.delete(fn as Handler<K>);
}

export function emit<K extends keyof Events>(event: K, payload: Events[K]) {
  listeners[event]?.forEach((fn) => (fn as Handler<K>)(payload));
}

export const stamp = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

// Random username for the player session
const NICKS = ["voidwalker", "parrotghost", "quantumloss", "hodlmancer", "darkbeak", "bagged_bird", "void_runner", "eventhorizon", "warpbeak", "nullparrot"];
export const randomNick = () =>
  `@${NICKS[Math.floor(Math.random() * NICKS.length)]}${Math.floor(Math.random() * 99)}`;
