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
  const [timeScale, setTimeScale] = useState(1); // global speed 0.3x..2x
  const [parrotHit, setParrotHit] = useState(0); // increments on hit -> distortion pulse
  const [parrotShake, setParrotShake] = useState(0); // increments on chaos rise
  const nickRef = useRef<string>("");
  const lastEventRef = useRef<EventDef | null>(null);
  const tsRef = useRef(1);
  const timeRef = useRef(0);
  const prevChaosRef = useRef(1);
  const audioRef = useRef<{ ctx: AudioContext; hum: GainNode; humOsc: OscillatorNode } | null>(null);
  useEffect(() => { tsRef.current = timeScale; }, [timeScale]);
  useEffect(() => { timeRef.current = time; }, [time]);
  useEffect(() => {
    if (chaos > prevChaosRef.current + 0.18) setParrotShake((s) => s + 1);
    prevChaosRef.current = chaos;
  }, [chaos]);

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

  // ramp hum with chaos AND timeScale (sound pitch follows speed)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.hum.gain.setTargetAtTime(0.03 + (chaos / 10) * 0.09, a.ctx.currentTime, 0.4);
      a.humOsc.frequency.setTargetAtTime((50 + chaos * 6) * timeScale, a.ctx.currentTime, 0.2);
    } catch { /* ignore */ }
  }, [chaos, timeScale]);

  const playBlip = (kind: "glitch" | "distort" | "explode") => {
    const a = audioRef.current;
    if (!a) return;
    try {
      const ts = tsRef.current;
      const o = a.ctx.createOscillator();
      const g = a.ctx.createGain();
      o.type = kind === "distort" ? "square" : kind === "explode" ? "sawtooth" : "triangle";
      const now = a.ctx.currentTime;
      if (kind === "glitch") {
        o.frequency.setValueAtTime((900 + Math.random() * 600) * ts, now);
        o.frequency.exponentialRampToValueAtTime(120 * ts, now + 0.18);
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o.connect(g).connect(a.ctx.destination);
        o.start(now); o.stop(now + 0.22);
      } else if (kind === "explode") {
        o.frequency.setValueAtTime(320 * ts, now);
        o.frequency.exponentialRampToValueAtTime(60 * ts, now + 0.35);
        g.gain.setValueAtTime(0.32, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        o.connect(g).connect(a.ctx.destination);
        o.start(now); o.stop(now + 0.42);
      } else {
        o.frequency.setValueAtTime(180 * ts, now);
        o.frequency.linearRampToValueAtTime(40 * ts, now + 0.5);
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
      const ts = tsRef.current;
      setTime((t) => {
        const next = +(t + 0.1 * ts).toFixed(1);
        setPoints(Math.floor(next * mult));
        // 3-phase chaos growth: phase1 none, phase2 slow, phase3 full
        const phaseMult = next < 3 ? 0 : next < 8 ? 0.35 : 1;
        setChaos((c) => Math.min(10, +(c + (0.06 + next * 0.0015) * ts * phaseMult).toFixed(2)));
        return next;
      });
    }, 100);

    return () => clearInterval(tick);
  }, [open, result, phase, dimension]);

  // time dilation scheduler — random global speed shifts (0.3x..2x)
  useEffect(() => {
    if (!open || result || phase !== "playing") return;
    let cancelled = false;
    const next = () => {
      if (cancelled) return;
      const delay = 2000 + Math.random() * 1000;
      setTimeout(() => {
        if (cancelled) return;
        const choices = [0.4, 1, 2];
        const ts = choices[Math.floor(Math.random() * choices.length)];
        setTimeScale(ts);
        next();
      }, delay);
    };
    next();
    return () => { cancelled = true; setTimeScale(1); };
  }, [open, result, phase]);

  // threat spike scheduler — random screen shocks
  useEffect(() => {
    if (!open || result || phase !== "playing") return;
    let cancelled = false;
    const next = () => {
      if (cancelled) return;
      const delay = 3500 + Math.random() * 5500;
      setTimeout(() => {
        if (cancelled) return;
        // no spikes during phase 1
        if (timeRef.current < 3) { next(); return; }
        setSpike((s) => s + 1);
        playBlip("glitch");
        const kick = timeRef.current < 8 ? 0.15 : 0.4;
        setChaos((c) => Math.min(10, +(c + kick).toFixed(2)));
        next();
      }, delay);
    };
    next();
    return () => { cancelled = true; };
  }, [open, result, phase]);

  // event scheduler - interval depends on chaos
  useEffect(() => {
    if (!open || result || phase !== "playing") return;

    let cancelled = false;
    const schedule = () => {
      const t0 = timeRef.current;
      // slow first 6s, then ramp
      const phaseSlow = t0 < 6 ? 1800 : 0;
      const base = Math.max(700, 2400 - chaos * 180) + phaseSlow;
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
    // minimum session time: cannot die before 5s
    if (timeRef.current < 5) return;
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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
        style={{
          background: themed ? theme.bgGradient : "radial-gradient(ellipse at center, hsl(var(--void-deep) / 0.85) 0%, hsl(var(--void-deep) / 0.97) 70%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "background 400ms ease",
        }}
      >
        {/* Threat-spike layer: zoom + shake + glitch flash */}
        {themed && phase === "playing" && !result && (
          <SpikeFX spike={spike} chaos={chaos} />
        )}
        {/* Time-scale visual feedback: blur/trails when slow, streaks/shake/flash when fast */}
        {themed && phase === "playing" && !result && (
          <TimeScaleFX timeScale={timeScale} />
        )}
        {/* Red edge danger vignette (intensifies with chaos) */}
        {themed && phase === "playing" && !result && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: `inset 0 0 ${80 + chaos * 30}px ${10 + chaos * 6}px hsl(0 90% 50% / ${Math.max(0, (chaos - 4) * 0.07).toFixed(2)})`,
              transition: "box-shadow 600ms ease",
            }}
          />
        )}
        {/* Heartbeat pulse synced with chaos */}
        {themed && phase === "playing" && !result && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: [0, 0.25, 0, 0.18, 0] }}
            transition={{ duration: Math.max(0.5, 1.6 - chaos * 0.12), repeat: Infinity, ease: "easeOut" }}
            style={{
              background: `radial-gradient(ellipse at center, transparent 55%, hsl(0 90% 45% / ${Math.min(0.55, 0.1 + chaos * 0.05)}) 100%)`,
              mixBlendMode: "screen",
            }}
          />
        )}
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
        {/* parrot removed from gameplay for clarity */}
        {themed && phase === "playing" && !result && (
          <IntroHint key={`hint-${dimension}`} />
        )}
        {/* subtle 10k squad branding */}
        {themed && phase === "playing" && !result && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-3 left-4 z-20 font-mono-x text-[10px] tracking-[0.3em] text-foreground/50"
            style={{ textShadow: `0 0 8px hsl(${theme.glow} / 0.6)` }}
          >
            10K SQUAD <span style={{ color: `hsl(${theme.glow})` }}>·</span> SIGNAL
          </div>
        )}
        {isDark && themed && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-white"
            animate={{ opacity: [0, 0, 0, 0, 0.12, 0, 0, 0, 0.05, 0] }}
            transition={{ duration: 6, repeat: Infinity, times: [0, 0.2, 0.4, 0.49, 0.5, 0.52, 0.7, 0.79, 0.8, 1] }}
          />
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
                <Stat label="TIME" value={`${jitterNum(time, chaos, 0).toFixed(1)}s`} accent={theme.glow} />
                <Stat
                  label="SIGNAL"
                  value={Math.max(0, Math.floor(jitterNum(points, chaos, 1))).toLocaleString()}
                  highlight
                  accent={theme.glow}
                />
                <Stat label="CHAOS" value={jitterNum(chaos, chaos, 0).toFixed(1)} accent={theme.glow} />
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
        {themed && phase === "playing" && !result && isDark && (
          <DarkMatterField
            glow={theme.glow}
            chaos={chaos}
            onSignalTick={(gain) => { setPoints((p) => p + gain); setChaos((c) => Math.min(10, +(c + gain * 0.004).toFixed(2))); }}
            onCollapse={() => die({ key: "collapse", label: "GRAVITATIONAL COLLAPSE", action: "fell into the dark", points: 0, deathy: true })}
            onProximity={(p) => { if (p > 0.7) playBlip("distort"); }}
          />
        )}
        {themed && phase === "playing" && !result && !isDark && (
          <CentralSphere
            glow={theme.glow}
            chaos={chaos}
            timeScale={timeScale}
            onTap={() => { playBlip("glitch"); setChaos((c) => Math.max(1, +(c - 0.25).toFixed(2))); setParrotHit((h) => h + 1); }}
            onExplode={() => { playBlip("explode"); setChaos((c) => Math.min(10, +(c + 1.2).toFixed(2))); setSpike((s) => s + 1); setParrotHit((h) => h + 1); }}
          />
        )}
        {themed && phase === "playing" && !result && !isDark && (
          <AnomalyField
            glow={theme.glow}
            chaos={chaos}
            timeScale={timeScale}
            onStabilize={(fake) => { playBlip("glitch"); if (!fake) setChaos((c) => Math.max(1, +(c - 0.22).toFixed(2))); setParrotHit((h) => h + 1); }}
            onIgnored={() => { playBlip("explode"); setChaos((c) => Math.min(10, +(c + 0.8).toFixed(2))); setParrotHit((h) => h + 1); }}
            onZoneHit={() => { setChaos((c) => Math.min(10, +(c + 1.0).toFixed(2))); setParrotHit((h) => h + 1); playBlip("distort"); }}
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
  speed?: number;
  stabilized?: boolean;
  exploding?: boolean;
  fake?: boolean;
}

function AnomalyField({
  glow,
  chaos,
  timeScale,
  onStabilize,
  onIgnored,
  onZoneHit,
}: {
  glow: string;
  chaos: number;
  timeScale: number;
  onStabilize: (fake: boolean) => void;
  onIgnored: () => void;
  onZoneHit: () => void;
}) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [, force] = useState(0);
  const idRef = useRef(1);
  const chaosRef = useRef(chaos);
  const tsRef = useRef(timeScale);
  const zoneHitRef = useRef<Set<number>>(new Set());
  useEffect(() => { chaosRef.current = chaos; }, [chaos]);
  useEffect(() => { tsRef.current = timeScale; }, [timeScale]);

  const zoneRadius = Math.min(0.22, 0.08 + chaos * 0.014);

  // spawn loop — speed tied to timeScale
  useEffect(() => {
    let cancelled = false;
    const spawn = () => {
      if (cancelled) return;
      const c = chaosRef.current;
      const ts = tsRef.current;
      const closeBias = Math.random() < 0.7;
      const radius = closeBias ? 0.04 + Math.random() * 0.08 : 0.12 + Math.random() * 0.22;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.min(0.92, Math.max(0.08, 0.5 + Math.cos(angle) * radius));
      const y = Math.min(0.88, Math.max(0.18, 0.62 + Math.sin(angle) * radius));
      const ttl = Math.max(550, (1800 + Math.random() * 1200 - c * 160) / ts);
      const speed = 0.7 + Math.random() * 0.9;
      const a: Anomaly = {
        id: idRef.current++,
        x, y,
        born: performance.now(),
        ttl,
        speed,
        fake: Math.random() < 0.25,
      };
      setAnomalies((prev) => [...prev, a]);
      const delay = Math.max(180, (1100 + Math.random() * 1300 - c * 140) / ts);
      setTimeout(spawn, delay);
    };
    const t = setTimeout(spawn, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  // expansion / explode / proximity loop — drive re-render for growing visuals
  useEffect(() => {
    const i = setInterval(() => {
      const now = performance.now();
      const zr = Math.min(0.22, 0.08 + chaosRef.current * 0.014);
      const px = 0.5, py = 0.62;
      setAnomalies((prev) => {
        const next: Anomaly[] = [];
        for (const a of prev) {
          if (a.stabilized) {
            if (now - a.born < 500) next.push(a);
            continue;
          }
          if (a.exploding) {
            if (now - a.born < 450) next.push(a);
            continue;
          }
          const age = (now - a.born) * (a.speed || 1) * tsRef.current;
          if (age > a.ttl) {
            // explode: fail
            onIgnored();
            next.push({ ...a, exploding: true, born: now });
            continue;
          }
          const dx = a.x - px;
          const dy = (a.y - py) * 0.7;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < zr && !zoneHitRef.current.has(a.id)) {
            zoneHitRef.current.add(a.id);
            onZoneHit();
          }
          next.push(a);
        }
        return next;
      });
      force((n) => (n + 1) % 1000);
    }, 60);
    return () => clearInterval(i);
  }, [onIgnored, onZoneHit]);

  const tap = (id: number) => {
    let wasFake = false;
    setAnomalies((prev) =>
      prev.map((a) => {
        if (a.id === id && !a.stabilized && !a.exploding) {
          wasFake = !!a.fake;
          return { ...a, stabilized: true, born: performance.now() };
        }
        return a;
      })
    );
    onStabilize(wasFake);
  };

  const now = performance.now();

  return (
    <div aria-hidden className="absolute inset-0 z-[5] pointer-events-none">
      {/* danger zone visualization around parrot */}
      <motion.div
        aria-hidden
        className="absolute rounded-full"
        animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.05, 1] }}
        transition={{ duration: Math.max(0.6, 1.4 - chaos * 0.1) / Math.max(0.4, timeScale), repeat: Infinity, ease: "easeInOut" }}
        style={{
          left: "50%",
          top: "62%",
          width: `${zoneRadius * 200}vmin`,
          height: `${zoneRadius * 140}vmin`,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, transparent 55%, hsl(0 90% 55% / ${Math.min(0.35, 0.08 + chaos * 0.025)}) 100%)`,
          border: `1px dashed hsl(0 90% 55% / ${Math.min(0.6, 0.15 + chaos * 0.04)})`,
          mixBlendMode: "screen",
        }}
      />
      {anomalies.map((a) => {
        const ageRatio = a.exploding
          ? Math.min(1, (now - a.born) / 450)
          : a.stabilized
            ? 0
            : Math.min(1, ((now - a.born) * (a.speed || 1) * timeScale) / a.ttl);
        const baseSize = 28;
        const grow = a.exploding ? 240 * ageRatio : baseSize + ageRatio * 70; // expand toward explosion
        const opacity = a.exploding ? 1 - ageRatio : a.stabilized ? 0 : 0.35 + ageRatio * 0.65;
        const ring = a.exploding ? 6 : 1 + ageRatio * 4;
        const dangerHue = ageRatio > 0.7 && !a.exploding;
        return (
          <button
            key={a.id}
            onClick={() => tap(a.id)}
            className="absolute pointer-events-auto rounded-full focus:outline-none"
            style={{
              left: `${a.x * 100}%`,
              top: `${a.y * 100}%`,
              transform: "translate(-50%, -50%)",
              width: grow,
              height: grow,
              background: a.exploding
                ? `radial-gradient(circle, hsl(0 95% 60% / ${0.6 * (1 - ageRatio)}) 0%, hsl(${glow} / ${0.3 * (1 - ageRatio)}) 50%, transparent 75%)`
                : `radial-gradient(circle, hsl(${dangerHue ? "0 95% 60%" : glow} / ${0.7 + ageRatio * 0.25}) 0%, hsl(${dangerHue ? "0 95% 60%" : glow} / 0.18) 50%, transparent 78%)`,
              boxShadow: a.stabilized
                ? "none"
                : `0 0 ${20 + ageRatio * 60}px hsl(${dangerHue || a.exploding ? "0 95% 60%" : glow} / ${0.6 + ageRatio * 0.3})`,
              border: a.stabilized || a.exploding ? "none" : `${ring}px solid hsl(${dangerHue ? "0 95% 60%" : glow} / ${0.4 + ageRatio * 0.5})`,
              cursor: a.stabilized || a.exploding ? "default" : "pointer",
              transition: a.stabilized ? "opacity 400ms ease" : undefined,
              opacity,
            }}
            aria-label="stabilize anomaly"
          />
        );
      })}
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
  const SARCASM_LINES = [
    "you reacted too slow",
    "time moved, you didn't",
    "skill issue across timelines",
    "the 10k squad noticed",
    "blink and you delete yourself",
  ];
  const sarcasm = DIM_LINES[dim] || "The void doesn't care.";
  const burn = SARCASM_LINES[Math.floor(Math.random() * SARCASM_LINES.length)];

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
        <p className="mt-1 font-mono-x text-[11px] text-muted-foreground">— {burn}</p>
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

function SpikeFX({ spike, chaos }: { spike: number; chaos: number }) {
  const [active, setActive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (spike === 0) return;
    setActive(true);
    setShake(true);
    setFlash(true);
    // sudden zoom in or out
    const dir = Math.random() < 0.5 ? 1.08 + Math.random() * 0.06 : 0.92 - Math.random() * 0.05;
    setZoom(dir);
    const t1 = setTimeout(() => setFlash(false), 120);
    const t2 = setTimeout(() => setZoom(1), 280);
    const t3 = setTimeout(() => setShake(false), 500);
    const t4 = setTimeout(() => setActive(false), 600);
    return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
  }, [spike]);

  return (
    <>
      {/* zoom + subtle shake on the whole layer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={shake
          ? { x: [0, -8, 9, -6, 5, 0], y: [0, 6, -5, 4, -3, 0], scale: zoom }
          : { x: 0, y: 0, scale: zoom }}
        transition={{ duration: shake ? 0.45 : 0.3, ease: "easeOut" }}
        style={{ transformOrigin: "center" }}
      />
      {/* glitch flash */}
      {flash && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `repeating-linear-gradient(${Math.random() * 360}deg, hsl(0 0% 100% / 0.18) 0 3px, transparent 3px 7px), hsl(0 90% 50% / 0.12)`,
            mixBlendMode: "screen",
          }}
        />
      )}
      {/* white flash blip */}
      {active && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0] }}
          transition={{ duration: 0.18 }}
        />
      )}
      {/* persistent low-amp shake when chaos > 7 */}
      {chaos > 7 && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          animate={{ x: [0, -2, 2, -1, 1, 0], y: [0, 1, -1, 2, -2, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </>
  );
}

function IntroHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: [0.85, 1, 0.7, 1, 0.9], x: [0, -1, 1, 0, -1, 0], y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center font-mono-x text-base md:text-xl leading-7 text-white"
          style={{ textShadow: "0 0 14px rgba(0,0,0,0.8)" }}
        >
          <div>
            do nothing → you{" "}
            <span style={{ color: "hsl(var(--primary))", textShadow: "0 0 12px hsl(var(--primary) / 0.9)" }}>
              die
            </span>
          </div>
          <div className="mt-1">
            tap →{" "}
            <span style={{ color: "hsl(var(--secondary))", textShadow: "0 0 12px hsl(var(--secondary) / 0.9)" }}>
              maybe
            </span>{" "}
            survive
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function jitterNum(value: number, chaos: number, scale: number): number {
  // small random offset that grows with chaos; scale 0 = subtle, 1 = bigger for SIGNAL
  const amp = (chaos / 10) * (scale > 0 ? 6 : 0.25);
  // brief unstable jitter; uses Math.random so it ticks each render of parent
  return value + (Math.random() - 0.5) * amp;
}

function ParrotAvatar({
  src,
  glow,
  chaos,
  hitKey,
  shakeKey,
}: {
  src: string;
  glow: string;
  chaos: number;
  hitKey: number;
  shakeKey: number;
}) {
  const [hit, setHit] = useState(0);
  const [shake, setShake] = useState(0);
  useEffect(() => { if (hitKey > 0) { setHit((n) => n + 1); const t = setTimeout(() => setHit((n) => Math.max(0, n - 1)), 360); return () => clearTimeout(t); } }, [hitKey]);
  useEffect(() => { if (shakeKey > 0) { setShake((n) => n + 1); const t = setTimeout(() => setShake((n) => Math.max(0, n - 1)), 280); return () => clearTimeout(t); } }, [shakeKey]);

  const nearDeath = chaos > 7.5;
  const hitActive = hit > 0;
  const shakeActive = shake > 0;

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 bottom-24 z-10 -translate-x-1/2"
      animate={shakeActive
        ? { x: [0, -4, 5, -3, 2, 0], y: [0, 2, -3, 1, 0] }
        : nearDeath
          ? { x: [0, -1.5, 1.5, -1, 1, 0], y: [0, 1, -1, 0] }
          : { x: 0, y: 0 }}
      transition={shakeActive
        ? { duration: 0.28, ease: "easeOut" }
        : nearDeath
          ? { duration: 0.35, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 }}
    >
      <motion.img
        src={src}
        alt=""
        aria-hidden
        width={96}
        height={96}
        loading="lazy"
        className="h-20 w-20 md:h-24 md:w-24 select-none"
        style={{
          background: "transparent",
          filter: `drop-shadow(0 0 18px hsl(${glow} / 0.55))${hitActive ? ` hue-rotate(${Math.random() * 80 - 40}deg) saturate(1.6) contrast(1.3)` : ""}${nearDeath ? " contrast(1.2) saturate(1.3)" : ""}`,
          mixBlendMode: hitActive ? "screen" : "normal",
        }}
        animate={hitActive
          ? { scale: [1, 1.08, 0.94, 1.04, 1], skewX: [0, 6, -5, 3, 0], opacity: [1, 0.7, 1, 0.85, 1] }
          : { y: [0, -8, 0] }}
        transition={hitActive
          ? { duration: 0.36, ease: "easeOut" }
          : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* near-death glitch slices */}
      {nearDeath && (
        <>
          <motion.img
            src={src}
            aria-hidden
            alt=""
            className="absolute inset-0 h-20 w-20 md:h-24 md:w-24 pointer-events-none"
            style={{ mixBlendMode: "screen", filter: "hue-rotate(120deg) saturate(2)", opacity: 0.45, clipPath: "inset(20% 0 55% 0)" }}
            animate={{ x: [0, -4, 5, -3, 0] }}
            transition={{ duration: 0.18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.img
            src={src}
            aria-hidden
            alt=""
            className="absolute inset-0 h-20 w-20 md:h-24 md:w-24 pointer-events-none"
            style={{ mixBlendMode: "screen", filter: "hue-rotate(-120deg) saturate(2)", opacity: 0.45, clipPath: "inset(60% 0 15% 0)" }}
            animate={{ x: [0, 5, -4, 3, 0] }}
            transition={{ duration: 0.22, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
    </motion.div>
  );
}

function TimeScaleFX({ timeScale }: { timeScale: number }) {
  const slow = timeScale < 0.7;
  const fast = timeScale > 1.4;
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    if (fast) setFlashKey((k) => k + 1);
  }, [fast, timeScale]);

  return (
    <>
      {/* SLOW: heavy motion blur + long trails */}
      {slow && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              backdropFilter: "blur(6px) saturate(1.4)",
              WebkitBackdropFilter: "blur(6px) saturate(1.4)",
              background: "radial-gradient(ellipse at center, hsl(220 60% 30% / 0.18), transparent 70%)",
              mixBlendMode: "screen",
            }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "repeating-linear-gradient(180deg, transparent 0 14px, hsl(200 80% 70% / 0.12) 14px 16px)",
              filter: "blur(3px)",
              mixBlendMode: "screen",
            }}
          />
        </>
      )}
      {/* FAST: streak lights + screen shake + flash */}
      {fast && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          animate={{ x: [0, -3, 4, -2, 2, 0], y: [0, 2, -3, 1, 0] }}
          transition={{ duration: 0.18, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent 0 6px, hsl(0 0% 100% / 0.18) 6px 7px), repeating-linear-gradient(90deg, transparent 0 22px, hsl(50 100% 70% / 0.14) 22px 24px)",
              filter: "blur(1px)",
              mixBlendMode: "screen",
            }}
          />
          <motion.div
            key={flashKey}
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />
        </motion.div>
      )}
    </>
  );
}

function CentralSphere({
  glow,
  chaos,
  timeScale,
  onTap,
  onExplode,
}: {
  glow: string;
  chaos: number;
  timeScale: number;
  onTap: () => void;
  onExplode: () => void;
}) {
  const [size, setSize] = useState(120);
  const [exploding, setExploding] = useState(false);
  const bornRef = useRef(performance.now());

  useEffect(() => {
    const i = setInterval(() => {
      if (exploding) return;
      const elapsed = (performance.now() - bornRef.current) / 1000;
      const grow = 120 + elapsed * 8 * tsClamp(timeScale);
      setSize(Math.min(420, grow));
      if (grow >= 420) {
        setExploding(true);
        onExplode();
        setTimeout(() => {
          bornRef.current = performance.now();
          setSize(120);
          setExploding(false);
        }, 500);
      }
    }, 100);
    return () => clearInterval(i);
  }, [timeScale, exploding, onExplode]);

  const heartbeat = Math.max(0.35, 1.1 - chaos * 0.07) / Math.max(0.4, timeScale);

  const handleTap = () => {
    if (exploding) return;
    bornRef.current = performance.now();
    setSize((s) => Math.max(120, s - 80));
    onTap();
  };

  return (
    <motion.button
      onClick={handleTap}
      aria-label="stabilize core"
      className="absolute z-[6] rounded-full focus:outline-none"
      style={{
        left: "50%",
        top: "62%",
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
        background: exploding
          ? `radial-gradient(circle, hsl(0 95% 60% / 0.9) 0%, hsl(${glow} / 0.4) 50%, transparent 80%)`
          : `radial-gradient(circle, hsl(${glow} / 0.85) 0%, hsl(${glow} / 0.25) 55%, transparent 80%)`,
        boxShadow: `0 0 ${40 + size * 0.4}px hsl(${exploding ? "0 95% 60%" : glow} / 0.8)`,
        border: `2px solid hsl(${exploding ? "0 95% 60%" : glow} / 0.55)`,
        cursor: exploding ? "default" : "pointer",
      }}
      animate={{ scale: exploding ? [1, 1.6, 0.4] : [1, 1.08, 0.96, 1.05, 1] }}
      transition={exploding
        ? { duration: 0.5, ease: "easeOut" }
        : { duration: heartbeat, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function tsClamp(t: number) { return Math.max(0.3, Math.min(2.5, t)); }

function DarkMatterField({
  glow,
  chaos,
  onSignalTick,
  onCollapse,
  onProximity,
}: {
  glow: string;
  chaos: number;
  onSignalTick: (gain: number) => void;
  onCollapse: () => void;
  onProximity: (p: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0.18, y: 0.22 });
  const startedAtRef = useRef(performance.now());
  const posRef = useRef(pos);
  const dragRef = useRef(false);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const [proximity, setProximity] = useState(0); // 0..1, 1 = at center
  const audioRef = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => { posRef.current = pos; }, [pos]);

  // low-frequency rumble that intensifies near center
  useEffect(() => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 38;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      audioRef.current = { ctx, osc, gain };
    } catch { /* ignore */ }
    return () => {
      try { audioRef.current?.osc.stop(); } catch { /* ignore */ }
      try { audioRef.current?.ctx.close(); } catch { /* ignore */ }
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.gain.gain.setTargetAtTime(proximity * 0.18, a.ctx.currentTime, 0.15);
      a.osc.frequency.setTargetAtTime(28 + proximity * 28, a.ctx.currentTime, 0.2);
    } catch { /* ignore */ }
  }, [proximity]);

  // physics + signal loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let signalAccum = 0;
    const step = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const p = { ...posRef.current };
      const cx = 0.5, cy = 0.5;
      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const elapsed = (performance.now() - startedAtRef.current) / 1000;
      // 3-phase pull: phase1 none, phase2 low, phase3 full
      const pullMult = elapsed < 3 ? 0 : elapsed < 8 ? 0.35 : 1;
      const pullStrength = (0.4 + chaos * 0.08) * pullMult * dt / Math.max(0.04, dist);
      const ax = dx * pullStrength;
      const ay = dy * pullStrength;

      // drag toward pointer target
      if (dragRef.current && targetRef.current) {
        const t = targetRef.current;
        p.x += (t.x - p.x) * Math.min(1, dt * 9);
        p.y += (t.y - p.y) * Math.min(1, dt * 9);
      }

      p.x += ax;
      p.y += ay;
      p.x = Math.max(0.02, Math.min(0.98, p.x));
      p.y = Math.max(0.02, Math.min(0.98, p.y));

      const newDist = Math.sqrt((cx - p.x) ** 2 + (cy - p.y) ** 2);
      const prox = Math.max(0, Math.min(1, 1 - newDist / 0.5));
      setProximity(prox);
      onProximity(prox);

      // signal gain ~ proximity (reduced in early phases)
      const signalMult = elapsed < 3 ? 0.3 : elapsed < 8 ? 0.7 : 1;
      signalAccum += prox * prox * 30 * signalMult * dt;
      if (signalAccum >= 1) {
        const gain = Math.floor(signalAccum);
        signalAccum -= gain;
        onSignalTick(gain);
      }

      // collapse only after 5s minimum, and full danger after 8s
      if (newDist < 0.04 && elapsed > 5) {
        onCollapse();
        return;
      }

      posRef.current = p;
      setPos(p);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [chaos, onSignalTick, onCollapse, onProximity]);

  const toLocal = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = true;
    const t = toLocal(e.clientX, e.clientY);
    if (t) targetRef.current = t;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const t = toLocal(e.clientX, e.clientY);
    if (t) targetRef.current = t;
  };
  const onPointerUp = () => { dragRef.current = false; targetRef.current = null; };

  // streak particles curving toward zones
  const particles = Array.from({ length: 36 }, (_, i) => i);

  // secondary irregular gravity zones
  const zones = [
    { x: 0.28, y: 0.34, s: 0.55, br: "62% 38% 55% 45% / 48% 52% 40% 60%" },
    { x: 0.74, y: 0.7, s: 0.45, br: "40% 60% 35% 65% / 55% 45% 60% 40%" },
    { x: 0.7, y: 0.28, s: 0.35, br: "55% 45% 70% 30% / 35% 65% 45% 55%" },
  ];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[5]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "none", cursor: dragRef.current ? "grabbing" : "grab" }}
    >
      {/* SVG goo filter for organic blob edges */}
      <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="dm-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
          </filter>
        </defs>
      </svg>

      {/* Central irregular gravity mass */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute"
        animate={{
          borderRadius: [
            "58% 42% 60% 40% / 45% 55% 45% 55%",
            "42% 58% 45% 55% / 60% 40% 55% 45%",
            "55% 45% 50% 50% / 50% 50% 60% 40%",
            "58% 42% 60% 40% / 45% 55% 45% 55%",
          ],
          rotate: [0, 8, -6, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          left: "50%", top: "50%",
          width: `${28 + proximity * 60}vmin`,
          height: `${24 + proximity * 50}vmin`,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(ellipse at 45% 55%, hsl(0 0% 0%) 0%, hsl(0 0% 0% / 0.92) 22%, hsl(${glow} / ${0.18 + proximity * 0.35}) 55%, transparent 78%)`,
          boxShadow: `inset 0 0 ${80 + proximity * 160}px hsl(${glow} / ${0.25 + proximity * 0.5}), 0 0 ${60 + proximity * 120}px hsl(${glow} / ${0.2 + proximity * 0.45})`,
          filter: `blur(${4 + proximity * 6}px)`,
          mixBlendMode: "multiply",
        }}
      />

      {/* Secondary irregular gravity zones */}
      {zones.map((z, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none absolute"
          animate={{
            x: [0, 8, -6, 0],
            y: [0, -5, 7, 0],
            borderRadius: [z.br, "50% 50% 40% 60% / 60% 40% 55% 45%", z.br],
          }}
          transition={{ duration: 9 + i * 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            left: `${z.x * 100}%`,
            top: `${z.y * 100}%`,
            width: `${z.s * 30}vmin`,
            height: `${z.s * 24}vmin`,
            transform: "translate(-50%, -50%)",
            borderRadius: z.br,
            background: `radial-gradient(ellipse at 50% 50%, hsl(0 0% 0% / 0.85) 0%, hsl(0 0% 0% / 0.55) 35%, hsl(${glow} / 0.12) 65%, transparent 85%)`,
            boxShadow: `inset 0 0 60px hsl(${glow} / 0.3)`,
            filter: "blur(10px)",
            mixBlendMode: "multiply",
          }}
        />
      ))}

      {/* screen stretch when pulled */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ scaleX: 1 + proximity * 0.08, scaleY: 1 - proximity * 0.05 }}
        transition={{ duration: 0.25 }}
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 30%, hsl(0 0% 0% / ${proximity * 0.45}) 75%)`,
          mixBlendMode: "multiply",
        }}
      />

      {/* streak particles curving toward zones */}
      {particles.map((i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const r = 0.2 + ((i * 37) % 100) / 360;
        const px = 0.5 + Math.cos(angle) * r;
        const py = 0.5 + Math.sin(angle) * r;
        const dx = 0.5 - px;
        const dy = 0.5 - py;
        const len = 6 + (i % 4) * 3;
        const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute block"
            style={{
              left: `${px * 100}%`,
              top: `${py * 100}%`,
              width: len,
              height: 1.5,
              transformOrigin: "left center",
              transform: `rotate(${rot}deg)`,
              background: `linear-gradient(90deg, transparent, hsl(${glow} / 0.95))`,
              boxShadow: `0 0 5px hsl(${glow} / 0.7)`,
            }}
            animate={{ x: [0, dx * 240, 0], y: [0, dy * 240, 0], opacity: [0.15, 0.95, 0.15] }}
            transition={{ duration: 3 + (i % 5) * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.07 }}
          />
        );
      })}

      {/* player marker — small diamond, not a ball */}
      <motion.div
        aria-hidden
        className="absolute"
        animate={{ scale: dragRef.current ? 1.15 : 1, rotate: 45 }}
        style={{
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          width: 16,
          height: 16,
          transform: "translate(-50%, -50%) rotate(45deg)",
          background: `linear-gradient(135deg, hsl(${glow}) 0%, hsl(${glow} / 0.4) 100%)`,
          boxShadow: `0 0 14px hsl(${glow} / 0.95), 0 0 32px hsl(${glow} / 0.5)`,
          border: `1px solid hsl(${glow} / 0.85)`,
        }}
      />

      {/* danger flash near collapse */}
      {proximity > 0.78 && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-red-600"
          animate={{ opacity: [0, 0.18, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          style={{ mixBlendMode: "screen" }}
        />
      )}
    </div>
  );
}


