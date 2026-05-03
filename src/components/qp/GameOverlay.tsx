import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skull, Zap, X, ArrowRight, Copy, Check, Share2 } from "lucide-react";

const PROJECT_URL = "https://quantum-parrot-void.lovable.app";
import { emit, on, stamp, randomNick, type GameResult } from "./gameStore";

type EventDef = {
  key: string;
  label: string;
  action: string;
  points: number; // can be negative
  deathy?: boolean; // higher death weight
};

const EVENTS: EventDef[] = [
  { key: "time-dilation", label: "TIME DILATION", action: "warped through time", points: 80 },
  { key: "dark-matter", label: "DARK MATTER", action: "fed the dark", points: 120 },
  { key: "spaghetti", label: "SPAGHETTIFICATION", action: "stretched too far", points: 140, deathy: true },
  { key: "wormhole", label: "WORMHOLE", action: "slipped a dimension", points: 95 },
  { key: "gravity-well", label: "GRAVITY WELL", action: "bent gravity", points: 110, deathy: true },
  { key: "quantum-flux", label: "QUANTUM FLUX", action: "looped reality", points: 75 },
  { key: "void-static", label: "VOID STATIC", action: "absorbed signal", points: 60 },
  { key: "entropy", label: "ENTROPY SPIKE", action: "decayed beautifully", points: 130, deathy: true },
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

interface FlashMsg {
  id: number;
  label: string;
  delta: number;
}

type Phase = "select" | "playing";

interface DimOpt {
  key: string;
  label: string;
  glow: string; // hsl token
  badge: string; // tailwind classes for badge bg/text
}

const DIMENSIONS: DimOpt[] = [
  { key: "time", label: "TIME DILATION", glow: "var(--time)", badge: "bg-time text-void-deep" },
  { key: "dark", label: "DARK MATTER", glow: "0 0% 95%", badge: "bg-foreground text-void-deep" },
  { key: "spag", label: "SPAGHETTIFICATION", glow: "var(--spaghetti)", badge: "bg-spaghetti text-void-deep" },
];

type Theme = {
  glow: string; // hsl token
  bgGradient: string;
  pulseDuration: number; // seconds
  deathLine: string;
  accentText: string; // tailwind class for accent color
};

const THEMES: Record<string, Theme> = {
  "TIME DILATION": {
    glow: "var(--time)",
    bgGradient:
      "radial-gradient(ellipse at center, hsl(var(--time) / 0.45) 0%, hsl(38 95% 25% / 0.7) 35%, hsl(var(--void-deep) / 0.98) 80%)",
    pulseDuration: 4.5,
    deathLine: "Your bags are gone.",
    accentText: "text-time",
  },
  "DARK MATTER": {
    glow: "0 0% 95%",
    bgGradient:
      "radial-gradient(ellipse at center, hsl(0 0% 12% / 0.6) 0%, hsl(0 0% 0% / 0.99) 70%)",
    pulseDuration: 2.4,
    deathLine: "Like your exit liquidity.",
    accentText: "text-foreground",
  },
  "SPAGHETTIFICATION": {
    glow: "var(--spaghetti)",
    bgGradient:
      "radial-gradient(ellipse at center, hsl(var(--spaghetti) / 0.55) 0%, hsl(15 95% 35% / 0.65) 35%, hsl(var(--void-deep) / 0.98) 80%)",
    pulseDuration: 1.2,
    deathLine: "This is fine.",
    accentText: "text-spaghetti",
  },
};

const DEFAULT_THEME: Theme = {
  glow: "var(--primary)",
  bgGradient:
    "radial-gradient(ellipse at center, hsl(var(--void-deep) / 0.85) 0%, hsl(var(--void-deep) / 0.97) 70%)",
  pulseDuration: 2.4,
  deathLine: "",
  accentText: "text-primary",
};

export default function GameOverlay() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("select");
  const [dimension, setDimension] = useState<string>("");
  const [time, setTime] = useState(0); // seconds
  const [points, setPoints] = useState(0);
  const [chaos, setChaos] = useState(1);
  const [flashes, setFlashes] = useState<FlashMsg[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const nickRef = useRef<string>("");
  const lastEventRef = useRef<EventDef | null>(null);

  // open game on signal
  useEffect(() => {
    const off = on("game:start", () => {
      const saved = typeof window !== "undefined" ? localStorage.getItem("playerHandle") : null;
      const trimmed = saved?.trim();
      nickRef.current = trimmed
        ? (trimmed.startsWith("@") ? trimmed : `@${trimmed}`)
        : randomNick();
      setTime(0);
      setPoints(0);
      setChaos(1);
      setFlashes([]);
      setResult(null);
      lastEventRef.current = null;
      setPhase("select");
      setDimension("");
      setOpen(true);
    });
    return off;
  }, []);

  const selectDimension = (label: string) => {
    setDimension(label);
    try { localStorage.setItem("selectedDimension", label); } catch { /* ignore */ }
    setPhase("playing");
  };

  // main game loop
  useEffect(() => {
    if (!open || result || phase !== "playing") return;

    // tick survival timer (10/s for smoother progression)
    const tick = setInterval(() => {
      setTime((t) => {
        const next = +(t + 0.1).toFixed(1);
        setPoints(Math.floor(next * 10));
        return next;
      });
      // chaos rises slowly with time, capped 10
      setChaos((c) => Math.min(10, +(c + 0.04).toFixed(2)));
    }, 100);

    return () => clearInterval(tick);
  }, [open, result, phase]);

  // event scheduler - interval depends on chaos
  useEffect(() => {
    if (!open || result || phase !== "playing") return;

    let cancelled = false;
    const schedule = () => {
      // 2.4s at chaos 1 → ~0.7s at chaos 10
      const base = Math.max(700, 2400 - chaos * 180);
      const jitter = Math.random() * 600;
      const delay = base + jitter;
      const t = setTimeout(() => {
        if (cancelled) return;
        runEvent();
        schedule();
      }, delay);
      return t;
    };
    const handle = schedule();
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, result, chaos, phase]);

  const runEvent = () => {
    const ev = pick(EVENTS);
    lastEventRef.current = ev;

    // signal is now driven purely by survival time; events only escalate chaos
    const delta = 0;
    setChaos((c) => Math.min(10, +(c + 0.25).toFixed(2)));

    // push to live feed
    emit("feed:push", {
      time: stamp(),
      user: nickRef.current,
      action: ev.action,
      points: delta,
    });

    // local flash
    const id = Date.now() + Math.random();
    setFlashes((f) => [{ id, label: ev.label, delta }, ...f].slice(0, 4));
    setTimeout(() => {
      setFlashes((f) => f.filter((x) => x.id !== id));
    }, 1800);

    // death roll: increases sharply with chaos; deathy events boost it
    const deathBoost = ev.deathy ? 0.04 : 0;
    const chance = Math.max(0, (chaos - 2) * 0.018) + deathBoost;
    if (Math.random() < chance) {
      die(ev);
    }
  };

  const die = (ev: EventDef) => {
    const finalSignal = Math.floor(time * 10);

    // resolve handle from localStorage at death time; fallback to random
    const saved = typeof window !== "undefined" ? localStorage.getItem("playerHandle") : null;
    const trimmed = saved?.trim();
    const handle = trimmed
      ? (trimmed.startsWith("@") ? trimmed : `@${trimmed}`)
      : (nickRef.current || randomNick());
    nickRef.current = handle;

    const finalResult: GameResult = {
      survived: time,
      signal: finalSignal,
      cause: ev.label,
      user: handle,
      dimension: dimension || undefined,
    };
    setPoints(finalSignal);
    setResult(finalResult);

    // push death into feed + top signals
    emit("feed:push", {
      time: stamp(),
      user: handle,
      action: `died to ${ev.label} after ${time.toFixed(1)}s`,
      points: finalSignal,
    });
    emit("top:push", { user: handle, score: finalSignal });
    emit("game:end", finalResult);
  };

  const close = () => {
    setOpen(false);
    setResult(null);
  };

  if (!open) return null;

  const chaosPct = Math.min(100, (chaos / 10) * 100);
  const theme = THEMES[dimension] ?? DEFAULT_THEME;
  const isSpag = dimension === "SPAGHETTIFICATION";
  const isDark = dimension === "DARK MATTER";
  const isTime = dimension === "TIME DILATION";
  const themed = phase === "playing" || !!result;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={
          isSpag && themed
            ? { opacity: 1, x: [0, -10, 12, -8, 9, -6, 0], y: [0, 7, -9, 5, -6, 4, 0], rotate: [0, -0.6, 0.7, -0.4, 0.5, 0] }
            : { opacity: 1 }
        }
        exit={{ opacity: 0 }}
        transition={
          isSpag && themed
            ? { x: { duration: 0.18, repeat: Infinity }, y: { duration: 0.22, repeat: Infinity }, rotate: { duration: 0.3, repeat: Infinity }, opacity: { duration: 0.25 } }
            : { duration: 0.25 }
        }
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{
          background: themed ? theme.bgGradient : "radial-gradient(ellipse at center, hsl(var(--void-deep) / 0.85) 0%, hsl(var(--void-deep) / 0.97) 70%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {isDark && themed && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {[
              { top: "18%", left: "12%", d: 3.2 },
              { top: "70%", left: "82%", d: 2.6 },
              { top: "40%", left: "88%", d: 4.1 },
              { top: "82%", left: "20%", d: 3.5 },
              { top: "14%", left: "72%", d: 2.9 },
            ].map((e, i) => (
              <motion.div
                key={i}
                className="absolute flex gap-2"
                style={{ top: e.top, left: e.left }}
                animate={{ opacity: [0.1, 0.85, 0.1] }}
                transition={{ duration: e.d, repeat: Infinity, delay: i * 0.3 }}
              >
                <span className="block h-2 w-3 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
                <span className="block h-2 w-3 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
              </motion.div>
            ))}
          </div>
        )}
        {/* glitch chaos overlay - intensifies, themed */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: themed
              ? `repeating-linear-gradient(0deg, transparent 0 2px, hsl(${theme.glow} / 0.08) 2px 3px)`
              : "repeating-linear-gradient(0deg, transparent 0 2px, hsl(var(--secondary) / 0.05) 2px 3px)",
            opacity: 0.2 + chaos * 0.04,
            mixBlendMode: "screen",
          }}
        />

        {/* close */}
        {(result || phase === "select") && (
          <button
            onClick={close}
            className="absolute right-5 top-5 z-10 rounded-full p-2 text-foreground/70 hover:bg-white/10 hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* HUD / Result */}
        <motion.div
          className="relative w-full max-w-2xl p-6 md:p-8"
          animate={
            themed
              ? { boxShadow: [
                  `0 0 30px hsl(${theme.glow} / 0.25), inset 0 0 60px hsl(${theme.glow} / 0.08)`,
                  `0 0 70px hsl(${theme.glow} / 0.6), inset 0 0 80px hsl(${theme.glow} / 0.18)`,
                  `0 0 30px hsl(${theme.glow} / 0.25), inset 0 0 60px hsl(${theme.glow} / 0.08)`,
                ] }
              : {}
          }
          transition={themed ? { duration: theme.pulseDuration, repeat: Infinity, ease: "easeInOut" } : undefined}
          style={{
            background: isDark ? "rgba(0,0,0,0.78)" : "rgba(10, 0, 20, 0.65)",
            border: `1px solid hsl(${theme.glow} / 0.25)`,
            borderRadius: "20px",
          }}
        >
          {phase === "select" && !result ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-primary fill-primary animate-flicker" />
                <span className="font-graffiti text-xl text-foreground tracking-wide">
                  CHOOSE YOUR DIMENSION
                </span>
              </div>
              <p className="mt-2 font-mono-x text-xs text-muted-foreground">
                pick a path. the void doesn't care which.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {DIMENSIONS.map((d, i) => (
                  <button
                    key={d.key}
                    onClick={() => selectDimension(d.label)}
                    className="group relative rounded-xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:scale-[1.03] hover:bg-white/[0.06]"
                    style={{
                      ["--card-glow" as never]: d.glow,
                      boxShadow:
                        "0 0 22px hsl(var(--card-glow) / 0.25), inset 0 0 30px hsl(var(--void-deep) / 0.5)",
                    }}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-graffiti text-base ${d.badge}`}>
                      {i + 1}
                    </div>
                    <div className="mt-3 font-graffiti text-base md:text-lg text-foreground leading-tight">
                      {d.label}
                    </div>
                    <div
                      className="mt-3 h-1 w-full rounded-full"
                      style={{ background: "hsl(var(--card-glow) / 0.7)", boxShadow: "0 0 12px hsl(var(--card-glow) / 0.7)" }}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : !result ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary fill-primary animate-flicker" />
                  <span className="font-graffiti text-xl text-foreground tracking-wide">
                    INSIDE THE VOID
                  </span>
                </div>
                <span className="font-mono-x text-xs text-muted-foreground">
                  {nickRef.current}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 font-mono-x text-center">
                <Stat label="TIME" value={`${time.toFixed(1)}s`} accent={theme.glow} />
                <Stat
                  label="SIGNAL"
                  value={points.toLocaleString()}
                  highlight
                  accent={theme.glow}
                />
                <Stat label="CHAOS" value={chaos.toFixed(1)} accent={theme.glow} />
              </div>

              {/* themed center pulse */}
              <div className="relative mt-5 flex items-center justify-center">
                <motion.div
                  aria-hidden
                  className="rounded-full"
                  animate={
                    isSpag
                      ? { scaleX: [1, 2.4, 0.6, 2.0, 1], scaleY: [1, 0.4, 1.6, 0.5, 1], opacity: [0.7, 1, 0.8, 1, 0.7] }
                      : isTime
                        ? { scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }
                        : { scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }
                  }
                  transition={{ duration: theme.pulseDuration, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: 64,
                    height: 64,
                    background: `radial-gradient(circle, hsl(${theme.glow} / 0.9) 0%, hsl(${theme.glow} / 0.2) 60%, transparent 80%)`,
                    boxShadow: `0 0 50px hsl(${theme.glow} / 0.85), 0 0 120px hsl(${theme.glow} / 0.45)`,
                  }}
                />
              </div>

              {/* chaos bar */}
              <div className="mt-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    animate={{ width: `${chaosPct}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                    style={{
                      background: `linear-gradient(90deg, hsl(${theme.glow} / 0.6) 0%, hsl(${theme.glow}) 100%)`,
                      boxShadow: `0 0 14px hsl(${theme.glow} / 0.85)`,
                    }}
                  />
                </div>
              </div>

              {/* flashes */}
              <div className="mt-6 min-h-[160px] space-y-2">
                <AnimatePresence>
                  {flashes.map((f) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -16, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.03] px-3 py-2"
                    >
                      <span className="font-graffiti text-base text-secondary-glow">
                        {f.label}
                      </span>
                      <span className="font-mono-x text-sm text-primary">
                        +{f.delta}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {isTime && (
                <p className={`mt-4 text-center font-mono-x text-sm ${theme.accentText}`}>
                  OUTSIDE TIME: +{Math.floor(time * 7)} YEARS
                </p>
              )}

              <p className="mt-4 text-center font-mono-x text-xs text-muted-foreground">
                survive. accumulate signal. the void scales.
              </p>
            </>
          ) : (
            <ResultCard result={result} theme={theme} onClose={close} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  accent?: string;
}) {
  const color = accent ? `hsl(${accent})` : undefined;
  return (
    <div
      className="rounded-lg border bg-white/[0.03] px-3 py-3"
      style={accent ? { borderColor: `hsl(${accent} / 0.35)` } : undefined}
    >
      <div
        className="text-[10px] uppercase tracking-widest"
        style={accent ? { color: `hsl(${accent} / 0.85)` } : undefined}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold tabular-nums ${
          highlight && !accent ? "text-primary" : !accent ? "text-foreground" : ""
        }`}
        style={
          highlight
            ? { color, textShadow: accent ? `0 0 14px hsl(${accent} / 0.85)` : "0 0 14px hsl(var(--primary) / 0.7)" }
            : accent
              ? { color: "hsl(var(--foreground))" }
              : undefined
        }
      >
        {value}
      </div>
    </div>
  );
}

function classify(signal: number): string {
  if (signal >= 500) return "TITAN SURVIVOR";
  if (signal >= 250) return "CHAOS SIGNAL";
  if (signal >= 100) return "CONTROLLED DEGEN";
  return "EVENT HORIZON NPC";
}

const DIM_LINES: Record<string, string> = {
  "TIME DILATION": "You survived seconds. The outside world aged badly.",
  "DARK MATTER": "You trusted what you couldn't see. Very crypto.",
  "SPAGHETTIFICATION": "Leverage detected. Dignity removed.",
};

function ResultCard({
  result,
  theme,
  onClose,
}: {
  result: GameResult;
  theme: { glow: string; deathLine: string; accentText: string };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const classification = classify(result.signal);
  const dim = result.dimension || "UNKNOWN";
  const sarcasm = DIM_LINES[dim] || "The void doesn't care.";

  const shareText = `I survived ${result.survived.toFixed(1)}s in QUANTUM PARROTS.
Dimension: ${dim}
Signal: ${result.signal}
Classified as: ${classification}

Top signals leave a trace on Monad.

${PROJECT_URL}`;

  const handleShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="text-center"
    >
      <Skull
        className="mx-auto h-10 w-10"
        style={{ color: `hsl(${theme.glow})`, filter: `drop-shadow(0 0 12px hsl(${theme.glow} / 0.8))` }}
      />
      <h2 className="mt-3 font-graffiti text-3xl md:text-4xl text-foreground">
        YOU{" "}
        <span style={{ color: `hsl(${theme.glow})`, textShadow: `0 0 18px hsl(${theme.glow} / 0.7)` }}>
          DIED
        </span>
      </h2>
      {theme.deathLine && (
        <p className={`mt-2 font-graffiti text-lg ${theme.accentText}`}>"{theme.deathLine}"</p>
      )}

      <div
        className="mt-5 rounded-xl p-5 text-left"
        style={{
          background: "rgba(0,0,0,0.45)",
          border: `1px solid hsl(${theme.glow} / 0.45)`,
          boxShadow: `0 0 30px hsl(${theme.glow} / 0.35), inset 0 0 40px hsl(${theme.glow} / 0.08)`,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="font-graffiti text-sm tracking-wider text-muted-foreground">
            VOID RESULT
          </span>
          <span
            className="font-graffiti text-sm tracking-wider px-2 py-0.5 rounded"
            style={{
              color: `hsl(${theme.glow})`,
              background: `hsl(${theme.glow} / 0.12)`,
              border: `1px solid hsl(${theme.glow} / 0.4)`,
            }}
          >
            {classification}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 font-mono-x text-sm">
          <ResultRow label="HANDLE" value={result.user} accent={theme.glow} />
          <ResultRow label="DIMENSION" value={dim} accent={theme.glow} />
          <ResultRow label="SURVIVED" value={`${result.survived.toFixed(1)}s`} accent={theme.glow} />
          <ResultRow label="SIGNAL" value={result.signal.toLocaleString()} accent={theme.glow} bold />
          <div className="col-span-2">
            <ResultRow label="CAUSE" value={result.cause} accent={theme.glow} />
          </div>
        </div>

        <p className={`mt-4 font-mono-x text-xs italic ${theme.accentText}`}>{sarcasm}</p>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-3 rounded-md font-graffiti tracking-wider transition"
          style={{
            color: `hsl(${theme.glow})`,
            border: `1px solid hsl(${theme.glow} / 0.6)`,
            background: `hsl(${theme.glow} / 0.08)`,
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "COPIED" : "COPY RESULT"}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-5 py-3 rounded-md font-graffiti tracking-wider transition"
          style={{
            color: `hsl(${theme.glow})`,
            border: `1px solid hsl(${theme.glow} / 0.6)`,
            background: `hsl(${theme.glow} / 0.08)`,
          }}
        >
          <Share2 className="h-4 w-4" />
          SHARE
        </button>
        <button
          onClick={() => emit("game:start", undefined)}
          className="btn-void flex items-center gap-2 px-6 py-3 text-lg"
        >
          RE-ENTER
          <ArrowRight className="h-5 w-5" strokeWidth={3} />
        </button>
        <button
          onClick={onClose}
          className="font-graffiti text-foreground/70 hover:text-foreground transition px-4 py-2"
        >
          EXIT
        </button>
      </div>
    </motion.div>
  );
}

function ResultRow({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent: string;
  bold?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest" style={{ color: `hsl(${accent} / 0.8)` }}>
        {label}
      </div>
      <div
        className={`mt-0.5 ${bold ? "text-lg font-bold tabular-nums" : "text-sm"} text-foreground break-words`}
        style={bold ? { color: `hsl(${accent})`, textShadow: `0 0 12px hsl(${accent} / 0.7)` } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
