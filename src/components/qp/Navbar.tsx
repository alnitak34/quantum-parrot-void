import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { gameUrlWithHandle } from "./handle";

const GAME_URL = "https://alnitak34.github.io/quantum-parrot-void/game.html";
const OPENSEA_URL = "https://opensea.io/collection/the-10k-squad-350905768";

type ModalKind = null | "about" | "leaderboard";

// Lightweight sound manager using WebAudio (no assets)
function useSound() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<{ stop: () => void } | null>(null);

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      ctxRef.current = new AC();
    }
    return ctxRef.current!;
  };

  const startAmbient = () => {
    const ctx = ensureCtx();
    if (ambientRef.current) return;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    // gentle fade-in to target volume (audible but low)
    master.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 4);
    // gentle low-pass to keep it dark and muffled
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    lp.Q.value = 0.3;
    master.connect(lp).connect(ctx.destination);

    // Two very deep sine drones, slightly detuned for slow beating
    const freqs = [38, 41.2];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      // very slow fade-in
      g.gain.exponentialRampToValueAtTime(0.5 / (i + 1), ctx.currentTime + 6);
      // ultra-slow LFO for subtle drift
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.02 + i * 0.013;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain).connect(o.frequency);
      o.connect(g).connect(master);
      o.start();
      lfo.start();
      return { o, lfo };
    });

    ambientRef.current = {
      stop: () => {
        oscs.forEach(({ o, lfo }) => {
          try { o.stop(); } catch {}
          try { lfo.stop(); } catch {}
        });
        try { master.disconnect(); } catch {}
      },
    };
  };

  const stopAmbient = () => {
    ambientRef.current?.stop();
    ambientRef.current = null;
  };

  const click = () => {
    // Intentionally silent — no button click / glitch / shimmer sounds.
  };

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) {
        const ctx = ensureCtx();
        if (ctx.state === "suspended") ctx.resume();
        startAmbient();
      } else {
        stopAmbient();
      }
      return next;
    });
  };

  useEffect(() => () => stopAmbient(), []);

  return { enabled, toggle, click };
}

const Navbar = () => {
  const [modal, setModal] = useState<ModalKind>(null);
  const sound = useSound();

  const handleNav = (action: () => void) => {
    sound.click();
    action();
  };

  const links: { label: string; onClick: () => void }[] = [
    {
      label: "PLAY",
      onClick: () => handleNav(() => window.open(gameUrlWithHandle(), "_blank", "noopener,noreferrer")),
    },
    {
      label: "SIGNALS",
      onClick: () => handleNav(() => {
        const el = document.getElementById("leaderboard");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    },
  ];

  return (
    <>
      <header className="relative z-40 w-full">
        <nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-5 md:py-6">
          <a href="#" className="flex items-baseline gap-2" aria-label="10K Squad home">
            <span
              className="font-graffiti text-3xl md:text-4xl text-primary"
              style={{ textShadow: "2px 2px 0 hsl(var(--void-deep))" }}
            >
              10K
            </span>
            <span
              className="font-graffiti text-2xl md:text-3xl text-foreground"
              style={{ textShadow: "2px 2px 0 hsl(var(--void-deep))" }}
            >
              SQUAD
            </span>
          </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8 lg:gap-12">
            {links.map((l) => (
              <li key={l.label}>
                <button
                  onClick={l.onClick}
                  className="font-graffiti text-lg lg:text-xl text-foreground/90 hover:text-primary transition-colors"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <button
              onClick={sound.toggle}
              aria-label={sound.enabled ? "Turn sound off" : "Turn sound on"}
              className="font-graffiti text-xs md:text-sm text-foreground/80 hover:text-primary transition-colors flex items-center gap-1.5 border border-primary/40 rounded-md px-2.5 py-1.5"
            >
              {sound.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden sm:inline">{sound.enabled ? "SOUND ON" : "SOUND OFF"}</span>
            </button>

        </nav>
      </header>

      {/* About modal */}
      <Dialog open={modal === "about"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background/95 border-primary/40">
          <DialogHeader>
            <DialogTitle className="font-graffiti text-3xl md:text-4xl text-primary">
              ABOUT THE QUANTUM VOID
            </DialogTitle>
            <DialogDescription className="sr-only">About the project</DialogDescription>
          </DialogHeader>
          <div className="font-mono-x text-sm md:text-base text-foreground/85 space-y-4 leading-relaxed">
            <p>
              10K Quantum Parrots is a chaotic cosmic game inspired by Interstellar, black holes, time
              dilation, dark matter, gravity, and the strange physics of impossible dimensions.
            </p>
            <p>
              The 3,333 parrots are not just collectibles. They are fragments of a quantum fracture:
              unstable entities scattered across collapsing timelines, distorted gravity fields, and
              unknown regions of space.
            </p>
            <p className="text-foreground/70">Each minigame represents a different cosmic anomaly:</p>
            <div>
              <p className="font-graffiti text-time text-lg">Time Dilation</p>
              <p>Time breaks, stretches, and collapses. Survival becomes prediction.</p>
            </div>
            <div>
              <p className="font-graffiti text-foreground text-lg">Dark Matter</p>
              <p>Invisible forces distort movement. You react to what you cannot see.</p>
            </div>
            <div>
              <p className="font-graffiti text-spaghetti text-lg">Spaghettification</p>
              <p>Near a black hole, gravity stretches everything. Reality itself becomes unstable.</p>
            </div>
            <div className="pt-2 border-t border-primary/20">
              <p className="font-handwritten text-xl text-primary">The objective is not to win.</p>
              <p>The objective is to survive the void.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leaderboard modal */}
      <Dialog open={modal === "leaderboard"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-md bg-background/95 border-primary/40">
          <DialogHeader>
            <DialogTitle className="font-graffiti text-3xl text-primary">
              LEADERBOARD COMING SOON
            </DialogTitle>
            <DialogDescription className="sr-only">Leaderboard coming soon</DialogDescription>
          </DialogHeader>
          <p className="font-mono-x text-sm text-foreground/80 leading-relaxed">
            Soon, survivors of the Quantum Void will be ranked by score, survival time, and chaos
            resistance.
          </p>
          <a
            href={GAME_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { sound.click(); e.currentTarget.href = gameUrlWithHandle(); }}
            className="btn-void inline-flex items-center justify-center px-6 py-3 text-lg mt-2"
          >
            PLAY NOW
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
