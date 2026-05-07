import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { gameUrlWithHandle, getPlayer, savePlayer } from "./handle";
import LoadingOverlay from "./LoadingOverlay";
import wizard from "@/assets/parrot-10k-squad.png";
import bat from "@/assets/parrot-bat.png";
import bad from "@/assets/parrot-bad.png";
import cosmic from "@/assets/cosmic-bg.jpg";

const Hero = () => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setName(getPlayer());
  }, []);

  const handleEnter = () => {
    setLoading(true);
  };

  const onLoadingDone = () => {
    window.open(gameUrlWithHandle(), "_blank", "noopener,noreferrer");
    setLoading(false);
  };

  const onNameChange = (v: string) => {
    setName(v);
    savePlayer(v);
  };

  return (
    <section className="relative overflow-hidden py-4 md:py-8">
      <AnimatePresence>{loading && <LoadingOverlay onDone={onLoadingDone} />}</AnimatePresence>

      {/* Wormhole background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${cosmic})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "radial-gradient(ellipse at 70% 40%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 70% 40%, black 0%, transparent 75%)",
        }}
      />

      {/* Cinematic darkening behind title (left side) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 25% 45%, hsl(var(--void-deep) / 0.85) 0%, hsl(var(--void-deep) / 0.55) 40%, transparent 75%)",
        }}
      />

      {/* Soft purple/pink glow behind title text */}
      <div
        className="pointer-events-none absolute -z-10"
        aria-hidden="true"
        style={{
          left: "5%",
          top: "20%",
          width: "55%",
          height: "60%",
          background:
            "radial-gradient(ellipse at center, hsl(var(--secondary) / 0.35) 0%, hsl(var(--primary) / 0.22) 35%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Vignette around edges (stronger) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 42%, hsl(var(--void-deep) / 0.55) 75%, hsl(var(--void-deep) / 0.95) 100%)",
          boxShadow: "inset 0 0 220px 60px hsl(var(--void-deep) / 0.95)",
        }}
      />

      {/* Vortex center contrast boost */}
      <div
        className="pointer-events-none absolute -z-10 hidden md:block"
        aria-hidden="true"
        style={{
          right: "-5%",
          top: "0%",
          width: "55%",
          height: "70%",
          background:
            "radial-gradient(circle at center, hsl(var(--secondary) / 0.35) 0%, hsl(var(--primary) / 0.18) 25%, transparent 55%)",
          filter: "blur(20px)",
        }}
      />
      {/* Spinning wormhole accent */}
      <div className="pointer-events-none absolute right-[-10%] top-[5%] h-[600px] w-[600px] -z-10 hidden md:block" aria-hidden="true">
        <div
          className="absolute inset-0 animate-spin-slow opacity-60"
          style={{
            backgroundImage: `url(${cosmic})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "50%",
            maskImage: "radial-gradient(circle, black 30%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 70%)",
          }}
        />
      </div>

      <div className="container relative mx-auto grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_160px] lg:grid-cols-2 items-center gap-2 sm:gap-4 md:gap-8 px-4">
        {/* LEFT: Text */}
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="graffiti-title text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[1.1]"
          >
            <span className="text-primary text-[0.7em] align-middle">10K</span>{" "}
            <span
              className="text-secondary-glow"
              style={{
                textShadow:
                  "0 0 22px hsl(var(--secondary) / 0.7), 0 0 44px hsl(var(--secondary) / 0.45), 0 0 80px hsl(var(--primary) / 0.25)",
              }}
            >
              QUANTUM
            </span>
            <br />
            <span className="text-foreground/75">PARROTS</span>
            <sup className="font-mono-x text-lg ml-2 text-foreground/55">™</sup>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-handwritten mt-4 md:mt-6 text-xl sm:text-2xl md:text-3xl text-foreground/90 max-w-xl"
          >
            A chaotic <span className="text-primary font-bold">survival</span> experiment. Every death leaves a trace on Monad mainnet.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 md:mt-10 flex items-start gap-6 flex-wrap"
          >
            <div className="flex flex-col gap-3">
              <button
                onClick={handleEnter}
                className="btn-void flex items-center gap-3 px-8 py-4 text-2xl md:text-3xl"
                style={{
                  boxShadow:
                    "0 0 30px hsl(var(--primary) / 0.65), 0 0 60px hsl(var(--secondary) / 0.4), 0 8px 24px hsl(var(--void-deep) / 0.8)",
                }}
              >
                ENTER THE VOID
                <ArrowRight className="h-7 w-7" strokeWidth={3} />
              </button>

              <div className="flex flex-col gap-1 max-w-xs">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      savePlayer(name);
                      handleEnter();
                    }
                  }}
                  placeholder="@your_x_handle"
                  className="font-mono-x text-sm bg-background/50 border border-primary/30 rounded-md px-3 py-2 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/50 transition"
                />
                <p className="font-mono-x text-[11px] text-foreground/50 tracking-wide">
                  Optional. Used on leaderboard.
                </p>
                <p className="font-mono-x text-[11px] text-foreground/60 tracking-wide mt-2">
                  Built by <a href="https://x.com/Alnitak34" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@Alnitak34</a> · 10k Squad OG holder since testnet
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* RIGHT: Parrot squad */}
        <div className="relative h-[140px] sm:h-[220px] lg:h-[600px]">
          {/* Ambient scene glow tying characters to background */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[180px] w-[180px] sm:h-[300px] sm:w-[300px] lg:h-[520px] lg:w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--secondary) / 0.45) 0%, hsl(var(--primary) / 0.25) 35%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />

          {/* Wizard (main) */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            animate={{ y: [0, -16, 0], rotate: [-1, 1, -1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full -z-10"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.55) 0%, hsl(var(--secondary) / 0.3) 40%, transparent 70%)",
                filter: "blur(35px)",
              }}
            />
            <img
              src={wizard}
              alt="Quantum Parrot wizard"
              loading="eager"
              className="w-[80px] sm:w-[160px] lg:w-[400px]"
              style={{
                filter:
                  "drop-shadow(0 14px 26px hsl(var(--void-deep) / 0.85)) drop-shadow(0 0 30px hsl(var(--primary) / 0.55)) drop-shadow(0 0 60px hsl(var(--secondary) / 0.35))",
              }}
            />
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-10px] w-[70%] h-5 rounded-[50%]"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(var(--void-deep) / 0.8) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </motion.div>

          {/* Bat parrot - right bottom */}
          <motion.div
            className="absolute right-2 bottom-4 z-10 hidden sm:block"
            animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
          >
            <div
              className="pointer-events-none absolute inset-0 -z-10 rounded-full"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--secondary) / 0.45) 0%, transparent 65%)",
                filter: "blur(28px)",
                transform: "scale(1.25)",
              }}
            />
            <img
              src={bat}
              alt=""
              loading="lazy"
              className="w-[90px] sm:w-[140px] lg:w-[180px]"
              style={{
                filter:
                  "drop-shadow(0 10px 18px hsl(var(--void-deep) / 0.85)) drop-shadow(0 0 22px hsl(var(--secondary) / 0.5))",
              }}
            />
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-2 w-[70%] h-3 rounded-[50%]"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(var(--void-deep) / 0.7) 0%, transparent 70%)",
                filter: "blur(6px)",
              }}
            />
          </motion.div>

          {/* "im bad" parrot - bottom */}
          <div className="absolute bottom-0 left-[40%] z-10 hidden sm:block">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 0.8 }}
              className="relative"
            >
              <div
                className="pointer-events-none absolute inset-0 -z-10 rounded-full"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 65%)",
                  filter: "blur(22px)",
                  transform: "scale(1.2)",
                }}
              />
              <img
                src={bad}
                alt=""
                loading="lazy"
                className="w-[100px] sm:w-[120px] lg:w-[140px]"
                style={{
                  filter:
                    "drop-shadow(0 8px 14px hsl(var(--void-deep) / 0.8)) drop-shadow(0 0 18px hsl(var(--primary) / 0.45))",
                }}
              />
              <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-1 w-[75%] h-3 rounded-[50%]"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(ellipse at center, hsl(var(--void-deep) / 0.75) 0%, transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
            </motion.div>
            <span className="font-handwritten block text-center text-foreground/70 text-lg -mt-2">im bad.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
