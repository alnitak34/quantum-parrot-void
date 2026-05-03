import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skull, Zap, X, ArrowRight } from "lucide-react";
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

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--void-deep) / 0.85) 0%, hsl(var(--void-deep) / 0.97) 70%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {/* glitch chaos overlay - intensifies */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent 0 2px, hsl(var(--secondary) / 0.05) 2px 3px)",
            opacity: 0.2 + chaos * 0.04,
            mixBlendMode: "screen",
          }}
        />

        {/* close */}
        {result && (
          <button
            onClick={close}
            className="absolute right-5 top-5 z-10 rounded-full p-2 text-foreground/70 hover:bg-white/10 hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* HUD / Result */}
        <div
          className="relative w-full max-w-2xl p-6 md:p-8"
          style={{
            background: "rgba(10, 0, 20, 0.65)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
            boxShadow:
              "0 0 50px hsl(var(--secondary) / 0.35), inset 0 0 60px hsl(var(--primary) / 0.12)",
          }}
        >
          {!result ? (
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
                <Stat label="TIME" value={`${time.toFixed(1)}s`} />
                <Stat
                  label="SIGNAL"
                  value={points.toLocaleString()}
                  highlight
                />
                <Stat label="CHAOS" value={chaos.toFixed(1)} />
              </div>

              {/* chaos bar */}
              <div className="mt-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    animate={{ width: `${chaosPct}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                    style={{
                      background:
                        "linear-gradient(90deg, hsl(var(--secondary)) 0%, hsl(var(--primary)) 100%)",
                      boxShadow: "0 0 14px hsl(var(--primary) / 0.7)",
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

              <p className="mt-4 text-center font-mono-x text-xs text-muted-foreground">
                survive. accumulate signal. the void scales.
              </p>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <Skull className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-3 font-graffiti text-3xl md:text-4xl text-foreground">
                YOU <span className="text-primary">DIED</span>
              </h2>
              <p className="mt-2 font-mono-x text-sm text-muted-foreground">
                cause of death:{" "}
                <span className="text-secondary-glow">{result.cause}</span>
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 font-mono-x">
                <Stat label="SURVIVED" value={`${result.survived.toFixed(1)}s`} />
                <Stat
                  label="SIGNAL GENERATED"
                  value={result.signal.toLocaleString()}
                  highlight
                />
              </div>

              <p className="mt-3 font-mono-x text-xs text-muted-foreground">
                Handle: <span className="text-foreground">{result.user}</span>
              </p>

              <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => emit("game:start", undefined)}
                  className="btn-void flex items-center gap-2 px-6 py-3 text-lg"
                >
                  RE-ENTER
                  <ArrowRight className="h-5 w-5" strokeWidth={3} />
                </button>
                <button
                  onClick={close}
                  className="font-graffiti text-foreground/70 hover:text-foreground transition px-4 py-2"
                >
                  EXIT
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold tabular-nums ${
          highlight ? "text-primary" : "text-foreground"
        }`}
        style={
          highlight
            ? { textShadow: "0 0 14px hsl(var(--primary) / 0.7)" }
            : undefined
        }
      >
        {value}
      </div>
    </div>
  );
}
