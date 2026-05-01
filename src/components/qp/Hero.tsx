import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import wizard from "@/assets/parrot-wizard.png";
import hearts from "@/assets/parrot-hearts.png";
import redeye from "@/assets/parrot-control.png";
import bat from "@/assets/parrot-bat.png";
import bad from "@/assets/parrot-bad.png";
import cosmic from "@/assets/cosmic-bg.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pb-12 pt-4 md:pt-8">
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

      {/* Vignette around edges */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, hsl(var(--void-deep) / 0.7) 100%)",
          boxShadow: "inset 0 0 180px 40px hsl(var(--void-deep) / 0.9)",
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

      <div className="container relative mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-8 px-4">
        {/* LEFT: Text */}
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="graffiti-title text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9]"
          >
            <span className="text-primary">10K</span>{" "}
            <span className="text-secondary-glow">QUANTUM</span>
            <br />
            <span className="text-foreground">PARROTS</span>
            <sup className="font-mono-x text-lg ml-2 text-foreground/60">™</sup>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-handwritten mt-6 text-2xl md:text-3xl text-foreground/90 max-w-xl"
          >
            A chaotic <span className="text-primary font-bold">survival</span> experiment
            <br />
            across impossible dimensions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex items-center gap-6 flex-wrap"
          >
            <button className="btn-void flex items-center gap-3 px-8 py-4 text-2xl md:text-3xl">
              ENTER THE VOID
              <ArrowRight className="h-7 w-7" strokeWidth={3} />
            </button>

            {/* Chaos Awaits stamp */}
            <motion.div
              animate={{ rotate: [-8, -12, -8] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="chaos-stamp flex h-28 w-28 md:h-32 md:w-32 items-center justify-center text-center relative"
            >
              <span className="font-graffiti text-primary text-base md:text-lg leading-tight">
                CHAOS
                <br />
                AWAITS
              </span>
              <X className="absolute -bottom-2 -right-2 h-5 w-5 text-primary" strokeWidth={3} />
            </motion.div>
          </motion.div>
        </div>

        {/* RIGHT: Parrot squad */}
        <div className="relative h-[420px] sm:h-[500px] lg:h-[600px]">
          {/* Ambient scene glow tying characters to background */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
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
              className="w-[280px] sm:w-[340px] lg:w-[420px]"
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

          {/* Hearts parrot - left */}
          <motion.div
            className="absolute left-0 top-[35%] z-10"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          >
            <div
              className="pointer-events-none absolute inset-0 -z-10 rounded-full"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 65%)",
                filter: "blur(25px)",
                transform: "scale(1.2)",
              }}
            />
            <img
              src={hearts}
              alt=""
              loading="lazy"
              className="w-[110px] sm:w-[130px] lg:w-[160px]"
              style={{
                filter:
                  "drop-shadow(0 8px 16px hsl(var(--void-deep) / 0.8)) drop-shadow(0 0 18px hsl(var(--primary) / 0.45))",
              }}
            />
          </motion.div>

          {/* Red-eye on branch - top right (dark sticker) */}
          <motion.div
            className="absolute right-0 top-0 z-10"
            animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          >
            {/* Outer pink/purple aura behind sticker */}
            <div
              className="pointer-events-none absolute inset-0 -z-10 rounded-full"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--secondary) / 0.6) 0%, hsl(var(--primary) / 0.4) 40%, transparent 72%)",
                filter: "blur(38px)",
                transform: "scale(1.45)",
              }}
            />

            {/* Sticker — borderless, floating */}
            <div
              className="relative overflow-hidden rounded-full w-[112px] h-[112px] sm:w-[136px] sm:h-[136px] lg:w-[160px] lg:h-[160px]"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, hsl(280 60% 22%) 0%, hsl(270 70% 12%) 45%, hsl(260 80% 5%) 100%)",
                boxShadow:
                  "0 0 28px hsl(var(--secondary) / 0.55), 0 0 60px hsl(var(--secondary) / 0.3), 0 8px 22px hsl(var(--void-deep) / 0.7), inset 0 0 28px hsl(var(--void-deep) / 0.7)",
                filter: "blur(0.6px)",
              }}
            >
              {/* Inner glow behind parrot */}
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(circle at 50% 55%, hsl(var(--secondary) / 0.55) 0%, hsl(var(--primary) / 0.3) 35%, transparent 70%)",
                  filter: "blur(14px)",
                }}
              />

              {/* Parrot — tightly cropped, scaled to hide edges */}
              <img
                src={redeye}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: "scale(1.35)",
                  mixBlendMode: "screen",
                  filter:
                    "drop-shadow(0 6px 14px hsl(var(--void-deep) / 0.8)) drop-shadow(0 0 18px hsl(var(--secondary) / 0.6))",
                }}
              />

              {/* Grain / noise overlay to blend edges */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-overlay"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                  backgroundSize: "160px 160px",
                }}
              />

              {/* Soft inner vignette — feathered edge */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                aria-hidden="true"
                style={{
                  boxShadow:
                    "inset 0 0 30px 12px hsl(260 80% 5% / 0.85), inset 0 0 14px 4px hsl(270 70% 10% / 0.7)",
                }}
              />
            </div>
          </motion.div>

          {/* Bat parrot - right bottom */}
          <motion.div
            className="absolute right-2 bottom-4 z-10"
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
              className="w-[120px] sm:w-[150px] lg:w-[180px]"
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
