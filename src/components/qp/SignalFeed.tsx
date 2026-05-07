import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skull, Zap, Crown, BarChart3, ArrowRight, ArrowUpRight, Share2 } from "lucide-react";
import { on } from "./gameStore";
import { getPlayer } from "./handle";

interface Signal {
  time: string;
  user: string;
  action: string;
  points: number;
  pinned?: boolean;
  pinnedUntil?: number;
  txHash?: string | null;
}

interface TopRow {
  rank: number;
  user: string;
  score: number;
  txHash?: string | null;
}

const PIN_MS = 20000;

const SUPABASE_URL = "https://fdjdwfdmqqyzkvqwkelk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cwmeuLKWxTcDon9vofJ0xQ_hu67qQvc";

const stamp = (d: Date = new Date()) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

const actionFor = (game: string | null | undefined) => {
  const g = (game || "").toLowerCase();
  if (g.includes("time")) return "warped through time";
  if (g.includes("dark")) return "entered dark matter";
  if (g.includes("spaghet")) return "got spaghettified";
  if (g.includes("void")) return "vanished into void";
  return "survived the void";
};

const hasTx = (h?: string | null): h is string => {
  if (typeof h !== "string") return false;
  const v = h.trim();
  return v.length > 0 && v !== "debug_tx_hash" && v.toLowerCase().startsWith("0x");
};

const MonadBadge = ({ txHash, size = "md" }: { txHash?: string | null; size?: "sm" | "md" }) => {
  if (!hasTx(txHash)) {
    return (
      <span className="text-[9px] font-mono-x tracking-wider uppercase text-muted-foreground/60">
        pending
      </span>
    );
  }
  const sizeCls =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-1 text-[11px] gap-1.5";
  return (
    <a
      href={`https://monadscan.com/tx/${txHash.trim()}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center ${sizeCls} rounded font-graffiti tracking-wider bg-primary/25 text-primary-foreground border border-primary/70 shadow-[0_0_14px_hsl(var(--primary)/0.55)] hover:bg-primary/40 hover:shadow-[0_0_22px_hsl(var(--primary)/0.85)] transition-all`}
    >
      RECORDED ✓
      <ArrowUpRight className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} strokeWidth={3} />
    </a>
  );
};

const SignalFeed = () => {
  const [feed, setFeed] = useState<Signal[]>([]);
  const [top, setTop] = useState<TopRow[]>([]);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [me, setMe] = useState<string>("");

  useEffect(() => {
    const p = getPlayer();
    if (p) setMe(p.startsWith("@") ? p.slice(1).toLowerCase() : p.toLowerCase());
  }, []);

  const isMe = (user: string) => {
    if (!me) return false;
    const u = user.startsWith("@") ? user.slice(1).toLowerCase() : user.toLowerCase();
    return u === me;
  };

  // Fetch leaderboard from Supabase
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const url = `${SUPABASE_URL}/rest/v1/game_runs?select=id,game,x_handle,score,created_at,tx_hash&order=score.desc&limit=10`;
        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows: Array<{
          id: string;
          score: number;
          game: string | null;
          created_at: string;
          x_handle: string | null;
          tx_hash: string | null;
        }> = await res.json();
        if (cancelled) return;

        // Prioritize runs with tx_hash, but keep score-desc ordering within each group
        const withTx = rows.filter((r) => hasTx(r.tx_hash));
        const withoutTx = rows.filter((r) => !hasTx(r.tx_hash));
        const orderedTop = [...withTx, ...withoutTx];

        const topRows: TopRow[] = orderedTop.slice(0, 5).map((r, i) => ({
          rank: i + 1,
          user: r.x_handle ? (r.x_handle.startsWith("@") ? r.x_handle : `@${r.x_handle}`) : "anonymous_parrot",
          score: Number(r.score) || 0,
          txHash: r.tx_hash,
        }));
        setTop(topRows);

        const feedRows: Signal[] = rows.slice(0, 5).map((r) => ({
          time: stamp(new Date(r.created_at)),
          user: r.x_handle ? (r.x_handle.startsWith("@") ? r.x_handle : `@${r.x_handle}`) : "anonymous_parrot",
          action: actionFor(r.game),
          points: Number(r.score) || 0,
          txHash: r.tx_hash,
        }));
        setFeed(feedRows);
        setError(false);
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Live game events still pin "YOUR RUN" entries on top of the feed
  useEffect(() => {
    const offFeed = on("feed:push", (s) => {
      const isDeath = s.action.startsWith("died");
      const item: Signal = {
        time: s.time,
        user: s.user,
        action: s.action,
        points: s.points,
        pinned: isDeath,
        pinnedUntil: isDeath ? Date.now() + PIN_MS : undefined,
      };
      setFeed((prev) => {
        const others = prev.filter((p) => !p.pinned);
        return [item, ...others].slice(0, 5);
      });
    });
    const expireTick = setInterval(() => {
      setFeed((prev) => {
        const now = Date.now();
        if (!prev.some((s) => s.pinned && s.pinnedUntil && s.pinnedUntil <= now)) return prev;
        return prev.map((s) =>
          s.pinned && s.pinnedUntil && s.pinnedUntil <= now ? { ...s, pinned: false } : s
        );
      });
    }, 1000);
    return () => {
      offFeed();
      clearInterval(expireTick);
    };
  }, []);

  const rankStyles: Record<number, { row: string; rank: string; user: string; score: string; bar: string }> = {
    1: {
      row: "text-lg py-2",
      rank: "text-2xl text-primary font-bold drop-shadow-[0_0_8px_hsl(var(--primary)/0.7)]",
      user: "text-primary font-bold drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]",
      score: "text-primary font-bold tabular-nums",
      bar: "h-4 w-4 text-primary",
    },
    2: {
      row: "text-base py-2",
      rank: "text-xl text-foreground/90 font-bold",
      user: "text-foreground font-semibold",
      score: "text-foreground/90 tabular-nums",
      bar: "h-3.5 w-3.5 text-signal",
    },
    3: {
      row: "text-sm py-2",
      rank: "text-lg text-foreground/80 font-bold",
      user: "text-foreground/90",
      score: "text-foreground/80 tabular-nums",
      bar: "h-3.5 w-3.5 text-signal",
    },
    4: {
      row: "text-sm py-2 opacity-70",
      rank: "text-base text-foreground/60 font-bold",
      user: "text-foreground/70",
      score: "text-foreground/60 tabular-nums",
      bar: "h-3 w-3 text-signal/70",
    },
    5: {
      row: "text-sm py-2 opacity-60",
      rank: "text-base text-foreground/50 font-bold",
      user: "text-foreground/60",
      score: "text-foreground/50 tabular-nums",
      bar: "h-3 w-3 text-signal/60",
    },
  };

  return (
    <section className="w-full" id="leaderboard">
      <div
        className="p-4 md:p-6 relative overflow-hidden"
        style={{
          background: "rgba(10, 0, 20, 0.6)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          boxShadow: "0 0 40px rgba(255, 0, 150, 0.15)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Live feed */}
          <div className="lg:pr-5 lg:border-r border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary fill-primary animate-flicker" />
              <span className="font-graffiti text-lg text-foreground tracking-wide">LIVE SIGNAL FEED</span>
            </div>
            {error ? (
              <p className="font-mono-x text-sm text-muted-foreground min-h-[120px]">
                Signal feed temporarily unavailable.
              </p>
            ) : (
              <ul className="font-mono-x text-sm space-y-1.5 min-h-[120px] opacity-80">
                <AnimatePresence initial={false}>
                  {feed.map((s, i) => {
                    const mine = isMe(s.user);
                    return (
                    <motion.li
                      key={`${s.time}-${s.user}-${i}`}
                      initial={{ opacity: 0, x: -10, height: 0 }}
                      animate={{ opacity: mine ? 1 : 0.85 - i * 0.1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.4 }}
                      className={`flex items-center gap-2 flex-wrap px-2 py-1 -mx-2 rounded-md transition-all duration-200 hover:bg-secondary/10 hover:shadow-[0_0_18px_hsl(var(--secondary)/0.35)] ${i === 0 && s.pinned ? "animate-pulse-soft" : ""} ${mine ? "bg-primary/10 ring-1 ring-primary/40 shadow-[0_0_18px_hsl(var(--primary)/0.35)]" : ""}`}
                    >
                      <span className="text-muted-foreground/60">[{s.time}]</span>
                      <span className={mine ? "text-primary font-bold" : "signal-line/80 text-signal/80"}>{s.user}</span>
                      {(s.pinned || mine) && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-graffiti tracking-wider bg-primary/20 text-primary border border-primary/40">
                          YOUR RUN
                        </span>
                      )}
                      <span className="text-foreground/60">{s.action}</span>
                      <MonadBadge txHash={s.txHash} size="sm" />
                      <span className="ml-auto flex items-center gap-1 text-foreground/60">
                        <Skull className="h-3.5 w-3.5" /> +{s.points}
                        <BarChart3 className="h-3.5 w-3.5 text-signal/70" />
                      </span>
                    </motion.li>
                    );
                  })}
                </AnimatePresence>
                {loaded && feed.length === 0 && (
                  <li className="text-muted-foreground/70">Awaiting signals from the void…</li>
                )}
              </ul>
            )}
          </div>

          {/* RIGHT: Top signals */}
          <div className="lg:col-span-4 lg:pl-5 lg:border-l border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-graffiti text-lg text-foreground tracking-wide">TOP SIGNALS</span>
              <Crown className="h-5 w-5 text-primary fill-primary/40" />
            </div>
            {error ? (
              <p className="font-mono-x text-sm text-muted-foreground">
                Signal feed temporarily unavailable.
              </p>
            ) : (
              <ol className="font-mono-x space-y-3">
                {top.map((t) => {
                  const s = rankStyles[Math.min(t.rank, 5)];
                  const tx = hasTx(t.txHash) ? t.txHash!.trim() : null;
                  const mode = "the void";
                  const shareUrl = tx
                    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `Signal recorded on Monad.\nScore: ${t.score}\nMode: ${mode}\nhttps://monadscan.com/tx/${tx}`
                      )}`
                    : null;
                  return (
                    <li key={`${t.rank}-${t.user}`} className={`flex items-center gap-3 px-2 -mx-2 rounded-md ${s.row} ${isMe(t.user) ? "bg-primary/10 ring-1 ring-primary/40 shadow-[0_0_18px_hsl(var(--primary)/0.35)]" : ""}`}>
                      <span className={`w-8 text-right tabular-nums ${s.rank}`}>#{t.rank}</span>
                      <span className={`flex-1 truncate ${s.user}`}>{t.user}</span>
                      <MonadBadge txHash={t.txHash} />
                      {shareUrl && (
                        <a
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Share on X"
                          title="Share on X"
                          className="text-secondary-glow/80 hover:text-secondary-glow transition"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <span className={`ml-auto w-20 text-right ${s.score}`}>{t.score.toLocaleString()}</span>
                      <BarChart3 className={s.bar} />
                    </li>
                  );
                })}
                {loaded && top.length === 0 && (
                  <li className="text-muted-foreground/70 text-sm">No signals yet.</li>
                )}
              </ol>
            )}
            <button className="mt-4 flex items-center gap-1 font-graffiti text-primary hover:text-primary-glow transition-colors text-sm">
              VIEW FULL FEED <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* scanline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-b from-primary/20 to-transparent animate-scanline" />
      </div>
    </section>
  );
};

export default SignalFeed;
