import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skull, Zap, Crown, BarChart3, ArrowRight } from "lucide-react";

interface Signal {
  time: string;
  user: string;
  action: string;
  points: number;
}

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

  useEffect(() => {
    const id = setInterval(() => {
      setFeed((prev) => {
        const next = POOL[Math.floor(Math.random() * POOL.length)];
        return [{ ...next, time: stamp() }, ...prev].slice(0, 4);
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="container mx-auto px-4 py-4" id="leaderboard">
      <div className="panel-void sketchy-border-white p-5 md:p-6 relative overflow-hidden">
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
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <span className="signal-line">[{s.time}]</span>
                    <span className="signal-line">{s.user}</span>
                    <span className="text-foreground/80">{s.action}</span>
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
            <ol className="font-mono-x text-sm space-y-1.5">
              {TOP.map((t) => (
                <li key={t.rank} className="flex items-center gap-2">
                  <span className="text-foreground/70 w-5">{t.rank}.</span>
                  <span className="text-primary">{t.user}</span>
                  <span className="ml-auto text-foreground/90">{t.score.toLocaleString()}</span>
                  <BarChart3 className="h-3.5 w-3.5 text-signal" />
                </li>
              ))}
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
