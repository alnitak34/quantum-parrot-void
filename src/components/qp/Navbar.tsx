import { useEffect, useState } from "react";
import logo from "@/assets/10k-squad-logo.jpeg";
import { isVoidAudioMuted, setVoidAudioMuted, subscribeVoidAudio } from "./voidAudio";
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

function useSound() {
  const [muted, setMuted] = useState(isVoidAudioMuted());
  useEffect(() => {
    const unsub = subscribeVoidAudio((m) => setMuted(m));
    return () => { unsub(); };
  }, []);
  return {
    enabled: !muted,
    toggle: () => setVoidAudioMuted(!isVoidAudioMuted()),
    click: () => {},
  };
}

const Navbar = () => {
  const [modal, setModal] = useState<ModalKind>(null);
  const sound = useSound();

  return (
    <>
      <header className="relative z-40 w-full">
        <nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-5 md:py-6">
          <a href="#" className="flex items-center" aria-label="10K Squad home">
            <img src={logo} alt="10K Squad" className="h-10 w-auto" style={{ mixBlendMode: "screen" }} />
          </a>

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
          </div>
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
