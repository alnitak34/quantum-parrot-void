import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skull, Zap, X, ArrowRight, Copy, Check, Share2 } from "lucide-react";

const PROJECT_URL = "https://quantum-parrot-void.lovable.app";
import owlBase from "@/assets/parrot-base.png";
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
      "radial-gradient(ellipse at center, hsl(38 100% 55% / 0.85) 0%, hsl(30 100% 35% / 0.95) 40%, hsl(25 95% 12%) 85%)",
    pulseDuration: 4.5,
    deathLine: "Your bags are gone.",
    accentText: "text-time",
  },
  "DARK MATTER": {
    glow: "0 0% 95%",
    bgGradient:
      "radial-gradient(ellipse at center, hsl(0 0% 6%) 0%, hsl(0 0% 0%) 70%)",
    pulseDuration: 2.4,
    deathLine: "Like your exit liquidity.",
    accentText: "text-foreground",
  },
  "SPAGHETTIFICATION": {
    glow: "var(--spaghetti)",
    bgGradient:
      "radial-gradient(ellipse at center, hsl(0 100% 55% / 0.9) 0%, hsl(10 100% 35% / 0.95) 40%, hsl(0 90% 10%) 85%)",
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
  const [spike, setSpike] = useState(0); // increments to trigger threat spikes
  const nickRef = useRef<string>("");
  const lastEventRef = useRef<EventDef | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; hum: GainNode; humOsc: OscillatorNode } | null>(null);

  // Audio engine: ambient hum + sfx
  useEffect(() => {
    if (!open || phase !== "playing" || result) return;
    let ctx: AudioContext | null = null;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 55;
      gain.gain.value = 0.04;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      audioRef.current = { ctx, hum: gain, humOsc: osc };
    } catch { /* ignore */ }
    return () => {
      try { audioRef.current?.humOsc.stop(); } catch { /* ignore */ }
      try { ctx?.close(); } catch { /* ignore */ }
      audioRef.current = null;
    };
  }, [open, phase, result]);

  // ramp hum with chaos
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.hum.gain.setTargetAtTime(0.03 + (chaos / 10) * 0.09, a.ctx.currentTime, 0.4);
      a.humOsc.frequency.setTargetAtTime(50 + chaos * 6, a.ctx.currentTime, 0.4);
    } catch { /* ignore */ }
  }, [chaos]);

  const playBlip = (kind: "glitch" | "distort") => {
    const a = audioRef.current;
    if (!a) return;
    try {
      const o = a.ctx.createOscillator();
      const g = a.ctx.createGain();
      o.type = kind === "distort" ? "square" : "triangle";
      const now = a.ctx.currentTime;
      if (kind === "glitch") {
        o.frequency.setValueAtTime(900 + Math.random() * 600, now);
        o.frequency.exponentialRampToValueAtTime(120, now + 0.18);
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o.connect(g).connect(a.ctx.destination);
        o.start(now); o.stop(now + 0.22);
      } else {
        o.frequency.setValueAtTime(180, now);
        o.frequency.linearRampToValueAtTime(40, now + 0.5);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        o.connect(g).connect(a.ctx.destination);
        o.start(now); o.stop(now + 0.6);
      }
    } catch { /* ignore */ }
  };

  // open game on signal
  useEffect(() => {
    const init = (preDim?: string) => {
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
      if (preDim) {
        setDimension(preDim);
        try { localStorage.setItem("selectedDimension", preDim); } catch { /* ignore */ }
        setPhase("playing");
      } else {
        setPhase("select");
        setDimension("");
      }
      setOpen(true);
    };
    const off1 = on("game:start", () => init());
    const off2 = on("game:startDimension", (d) => init(d));
    return () => { off1(); off2(); };
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
    const isTimeDim = dimension === "TIME DILATION";
    const mult = isTimeDim ? 12 : 10;
    const tick = setInterval(() => {
      setTime((t) => {
        const next = +(t + 0.1).toFixed(1);
        setPoints(Math.floor(next * mult));
        return next;
      });
      // chaos rises slowly with time, capped 10
      setChaos((c) => Math.min(10, +(c + 0.04).toFixed(2)));
    }, 100);

    return () => clearInterval(tick);
  }, [open, result, phase, dimension]);

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
          transition: "background 400ms ease",
        }}
      >
        {/* Full-screen color wash for instant dimension feel */}
        {themed && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: isDark ? 0.55 : 0.45 }}
            transition={{ duration: 0.4 }}
            style={{
              background: isDark
                ? "#000"
                : `radial-gradient(ellipse at center, hsl(${theme.glow} / 0.55), hsl(${theme.glow} / 0.15) 60%, transparent 90%)`,
              mixBlendMode: isDark ? "normal" : "screen",
            }}
          />
        )}
        {/* Big top tagline - immediately visible */}
        {themed && phase === "playing" && !result && (
          <motion.div
            key={`tag-${dimension}`}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
            className={`absolute top-8 left-1/2 -translate-x-1/2 z-20 font-graffiti tracking-[0.4em] text-2xl md:text-3xl ${theme.accentText}`}
            style={{ textShadow: `0 0 22px hsl(${theme.glow} / 0.95), 0 0 50px hsl(${theme.glow} / 0.6)` }}
          >
            {isTime && "TIME IS UNSTABLE"}
            {isDark && "YOU ARE NOT ALONE"}
            {isSpag && "STRUCTURE BREAKING"}
          </motion.div>
        )}
        {themed && phase === "playing" && !result && (
          <motion.img
            src={owlBase}
            alt=""
            aria-hidden
            width={96}
            height={96}
            loading="lazy"
            className="pointer-events-none absolute left-1/2 bottom-24 z-10 h-20 w-20 md:h-24 md:w-24 -translate-x-1/2 select-none"
            style={{ background: "transparent", filter: `drop-shadow(0 0 18px hsl(${theme.glow} / 0.55))` }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {isDark && themed && (
          <>
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {[
                { top: "18%", left: "12%", d: 3.2 },
                { top: "70%", left: "82%", d: 2.6 },
                { top: "40%", left: "88%", d: 4.1 },
                { top: "82%", left: "20%", d: 3.5 },
                { top: "14%", left: "72%", d: 2.9 },
                { top: "55%", left: "8%", d: 3.7 },
                { top: "30%", left: "45%", d: 4.4 },
                { top: "88%", left: "58%", d: 3.0 },
              ].map((e, i) => (
                <motion.div
                  key={i}
                  className="absolute flex gap-2"
                  style={{ top: e.top, left: e.left }}
                  animate={{ opacity: [0.05, 0.95, 0.05] }}
                  transition={{ duration: e.d, repeat: Infinity, delay: i * 0.3 }}
                >
                  <span className="block h-2 w-3 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.85)]" />
                  <span className="block h-2 w-3 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.85)]" />
                </motion.div>
              ))}
            </div>
            {/* occasional flash */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-white"
              animate={{ opacity: [0, 0, 0, 0, 0.18, 0, 0, 0, 0.06, 0] }}
              transition={{ duration: 6, repeat: Infinity, times: [0, 0.2, 0.4, 0.49, 0.5, 0.52, 0.7, 0.79, 0.8, 1] }}
            />
          </>
        )}
        {isTime && themed && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* warped clock ring */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 520,
                height: 520,
                border: "2px dashed hsl(var(--time) / 0.45)",
                boxShadow: "0 0 80px hsl(var(--time) / 0.35), inset 0 0 80px hsl(var(--time) / 0.2)",
              }}
              animate={{ rotate: 360, scale: [1, 1.08, 0.96, 1] }}
              transition={{ rotate: { duration: 24, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ width: 320, height: 320, border: "1px solid hsl(var(--time) / 0.5)" }}
              animate={{ rotate: -360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className="absolute left-1/2 top-1/2 font-graffiti text-time/70"
                style={{
                  transform: `rotate(${deg}deg) translateY(-240px) rotate(-${deg}deg)`,
                  textShadow: "0 0 10px hsl(var(--time) / 0.8)",
                }}
              >
                {Math.round(deg / 30) || 12}
              </div>
            ))}
          </div>
        )}
        {isSpag && themed && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent 0 6px, hsl(var(--spaghetti) / 0.06) 6px 7px), repeating-linear-gradient(0deg, transparent 0 4px, hsl(0 90% 50% / 0.04) 4px 5px)",
              mixBlendMode: "screen",
            }}
          />
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

              {/* Dimension tagline */}
              <motion.div
                key={dimension}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: theme.pulseDuration, repeat: Infinity, ease: "easeInOut" }}
                className={`mt-3 text-center font-graffiti tracking-[0.3em] text-sm ${theme.accentText}`}
                style={{ textShadow: `0 0 14px hsl(${theme.glow} / 0.8)` }}
              >
                {isTime && "TIME IS UNSTABLE"}
                {isDark && "YOU ARE NOT ALONE"}
                {isSpag && "STRUCTURE BREAKING"}
              </motion.div>

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
              <p className="mt-2 text-center font-mono-x text-[11px] text-muted-foreground tracking-wider">
                tap the anomalies to stabilize · ignore them and chaos consumes you
              </p>

              <p className="mt-4 text-center font-mono-x text-xs text-muted-foreground">
                survive. accumulate signal. the void scales.
              </p>
            </>
          ) : (
            <ResultCard result={result} theme={theme} onClose={close} />
          )}
        </motion.div>
        {themed && phase === "playing" && !result && (
          <AnomalyField
            glow={theme.glow}
            onStabilize={() => setChaos((c) => Math.max(1, +(c - 0.4).toFixed(2)))}
            onIgnored={() => setChaos((c) => Math.min(10, +(c + 0.35).toFixed(2)))}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface Anomaly {
  id: number;
  x: number; // 0..1
  y: number; // 0..1
  born: number;
  ttl: number; // ms
  stabilized?: boolean;
}

function AnomalyField({
  glow,
  onStabilize,
  onIgnored,
}: {
  glow: string;
  onStabilize: () => void;
  onIgnored: () => void;
}) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const idRef = useRef(1);

  // spawn loop
  useEffect(() => {
    let cancelled = false;
    const spawn = () => {
      if (cancelled) return;
      const ttl = 2200 + Math.random() * 1600;
      const a: Anomaly = {
        id: idRef.current++,
        x: 0.15 + Math.random() * 0.7,
        y: 0.18 + Math.random() * 0.64,
        born: performance.now(),
        ttl,
      };
      setAnomalies((prev) => [...prev, a]);
      const delay = 1400 + Math.random() * 1800;
      setTimeout(spawn, delay);
    };
    const t = setTimeout(spawn, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  // expire loop
  useEffect(() => {
    const i = setInterval(() => {
      const now = performance.now();
      setAnomalies((prev) => {
        const expired: Anomaly[] = [];
        const kept = prev.filter((a) => {
          if (a.stabilized) return now - a.born < 600;
          if (now - a.born > a.ttl) {
            expired.push(a);
            return false;
          }
          return true;
        });
        if (expired.length) {
          for (let k = 0; k < expired.length; k++) onIgnored();
        }
        return kept;
      });
    }, 200);
    return () => clearInterval(i);
  }, [onIgnored]);

  const tap = (id: number) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id && !a.stabilized ? { ...a, stabilized: true, born: performance.now() } : a))
    );
    onStabilize();
  };

  return (
    <div aria-hidden className="absolute inset-0 z-[5] pointer-events-none">
      {anomalies.map((a) => (
        <button
          key={a.id}
          onClick={() => tap(a.id)}
          className="absolute pointer-events-auto rounded-full focus:outline-none"
          style={{
            left: `${a.x * 100}%`,
            top: `${a.y * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 64,
            height: 64,
            background: a.stabilized
              ? `radial-gradient(circle, hsl(${glow} / 0.0) 0%, transparent 70%)`
              : `radial-gradient(circle, hsl(${glow} / 0.85) 0%, hsl(${glow} / 0.25) 45%, transparent 75%)`,
            boxShadow: a.stabilized
              ? "none"
              : `0 0 28px hsl(${glow} / 0.85), 0 0 60px hsl(${glow} / 0.45)`,
            border: a.stabilized ? "none" : `1px solid hsl(${glow} / 0.55)`,
            animation: a.stabilized ? undefined : "pulse 1.1s ease-in-out infinite",
            backdropFilter: "blur(2px)",
            cursor: a.stabilized ? "default" : "pointer",
            transition: "opacity 400ms ease",
            opacity: a.stabilized ? 0 : 1,
          }}
          aria-label="stabilize anomaly"
        />
      ))}
    </div>
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
