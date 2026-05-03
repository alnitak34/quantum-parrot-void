import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skull, Zap, Crown, BarChart3, ArrowRight } from "lucide-react";
import { on } from "./gameStore";

interface Signal {
  time: string;
  user: string;
  action: string;
  points: number;
  pinned?: boolean;
  pinnedUntil?: number;
}

const PIN_MS = 20000;

const POOL: Omit<Signal, "time">[] = [
  { user: "@voidbagger69", action: "got spaghettified", points: 420 },
  { user: "@rektparrot", action: "entered dark matter", points: 311 },
  { user: "@hodlorama", action: "warped through time", points: 277 },
  { user: "@baguettebird", action: "stretched too far", points: 233 },
  { user: "@im_bad_bro", action: "vanished into void", points: 199 },
  { user: "@quantum_qween", action: "got time dilated", points: 512 },
  { user: "@nft_necromancer", action: "fed the dark", points: 369 },
  { user: "@monad_mage", action: "bent gravity", points: 444 },
  { user: "@parrot_paradox", action: "looped reality", points: 256 },
];

const TOP = [
  { rank: 1, user: "@voidbagger69", score: 9420 },
  { rank: 2, user: "@rektparrot", score: 7777 },
  { rank: 3, user: "@hodlorama", score: 5555 },
  { rank: 4, user: "@baguettebird", score: 3333 },
  { rank: 5, user: "@im_bad_bro", score: 2222 },
];

const stamp = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

const SignalFeed = () => {
  const [feed, setFeed] = useState<Signal[]>(() =>
    POOL.slice(0, 4).map((s) => ({ ...s, time: stamp() }))
  );
  const [top, setTop] = useState(TOP);

  useEffect(() => {
    const id = setInterval(() => {
      setFeed((prev) => {
        const next = POOL[Math.floor(Math.random() * POOL.length)];
        return [{ ...next, time: stamp() }, ...prev].slice(0, 4);
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Listen to live game events
  useEffect(() => {
    const offFeed = on("feed:push", (s) => {
      setFeed((prev) => [{ time: s.time, user: s.user, action: s.action, points: s.points }, ...prev].slice(0, 4));
    });
    const offTop = on("top:push", (entry) => {
      setTop((prev) => {
        const merged = [...prev, { rank: 0, ...entry }]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((t, i) => ({ ...t, rank: i + 1 }));
        return merged;
      });
    });
    return () => {
      offFeed();
      offTop();
    };
  }, []);

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Tagline */}
          <div className="lg:col-span-3 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border/50 pb-5 lg:pb-0 lg:pr-5">
            <div className="flex items-center gap-3">
              <h3 className="font-graffiti text-2xl md:text-3xl text-foreground leading-tight">
                EVERY DEATH<br />
                BECOMES <span className="text-primary">A SIGNAL</span>
              </h3>
              <Skull className="h-7 w-7 text-foreground/80" />
            </div>
            <p className="mt-3 font-mono-x text-sm text-muted-foreground">
              Top <span className="text-primary">signals</span> leave a trace on{" "}
              <span className="text-secondary-glow font-bold">Monad</span>.
            </p>
          </div>

          {/* MIDDLE: Live feed */}
          <div className="lg:col-span-5 lg:px-2">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary fill-primary animate-flicker" />
              <span className="font-graffiti text-lg text-foreground tracking-wide">LIVE SIGNAL FEED</span>
            </div>
            <ul className="font-mono-x text-sm space-y-1.5 min-h-[120px]">
              <AnimatePresence initial={false}>
                {feed.map((s, i) => (
                  <motion.li
                    key={`${s.time}-${s.user}-${i}`}
                    initial={{ opacity: 0, x: -10, height: 0 }}
                    animate={{ opacity: 1 - i * 0.15, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.4 }}
                    className={`flex items-center gap-2 flex-wrap px-2 py-1 -mx-2 rounded-md transition-all duration-200 hover:bg-secondary/10 hover:shadow-[0_0_18px_hsl(var(--secondary)/0.35)] ${i === 0 ? "animate-pulse-soft" : ""}`}
                  >
                    <span className="text-muted-foreground/70">[{s.time}]</span>
                    <span className="signal-line font-bold">{s.user}</span>
                    <span className="text-foreground/70">{s.action}</span>
                    <span className="ml-auto flex items-center gap-1 text-foreground/70">
                      <Skull className="h-3.5 w-3.5" /> +{s.points}
                      <BarChart3 className="h-3.5 w-3.5 text-signal" />
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

          {/* RIGHT: Top signals */}
          <div className="lg:col-span-4 lg:pl-5 lg:border-l border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-graffiti text-lg text-foreground tracking-wide">TOP SIGNALS</span>
              <Crown className="h-5 w-5 text-primary fill-primary/40" />
            </div>
            <ol className="font-mono-x space-y-1.5">
              {top.map((t) => {
                const styles: Record<number, { row: string; user: string; score: string; bar: string }> = {
                  1: {
                    row: "text-lg py-1.5",
                    user: "text-primary font-bold drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]",
                    score: "text-primary font-bold tabular-nums",
                    bar: "h-4 w-4 text-primary",
                  },
                  2: {
                    row: "text-base",
                    user: "text-foreground font-semibold",
                    score: "text-foreground/90 tabular-nums",
                    bar: "h-3.5 w-3.5 text-signal",
                  },
                  3: {
                    row: "text-sm",
                    user: "text-foreground/90",
                    score: "text-foreground/80 tabular-nums",
                    bar: "h-3.5 w-3.5 text-signal",
                  },
                  4: {
                    row: "text-sm opacity-60",
                    user: "text-foreground/70",
                    score: "text-foreground/60 tabular-nums",
                    bar: "h-3 w-3 text-signal/70",
                  },
                  5: {
                    row: "text-sm opacity-50",
                    user: "text-foreground/60",
                    score: "text-foreground/50 tabular-nums",
                    bar: "h-3 w-3 text-signal/60",
                  },
                };
                const s = styles[t.rank];
                return (
                  <li key={t.rank} className={`flex items-center gap-3 ${s.row}`}>
                    <span className="text-muted-foreground/70 w-6 text-right tabular-nums">{t.rank}.</span>
                    <span className={`flex-1 truncate ${s.user}`}>{t.user}</span>
                    <span className={`ml-auto w-20 text-right ${s.score}`}>{t.score.toLocaleString()}</span>
                    <BarChart3 className={s.bar} />
                  </li>
                );
              })}
            </ol>
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
