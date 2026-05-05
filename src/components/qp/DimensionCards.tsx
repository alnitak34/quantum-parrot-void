import { motion } from "framer-motion";
import { toast } from "sonner";
import clock from "@/assets/icon-clock.png";
import darkmatter from "@/assets/icon-darkmatter.png";
import spaghetti from "@/assets/icon-spaghetti.png";

const GAME_URL = "https://alnitak34.github.io/quantum-parrot-void/game.html";

const handleCardClick = () => {
  toast("This is a preview. Enter the Void to play the real game.");
  window.open(GAME_URL, "_blank", "noopener,noreferrer");
};

interface Dim {
  n: number;
  title: string;
  border: string;
  numColor: string;
  body: string[];
  quote: string;
  quoteColor: string;
  img: string;
  alt: string;
  glow: string; // hsl token name for glow color
}

const dims: Dim[] = [
  {
    n: 1,
    title: "TIME DILATION",
    border: "sketchy-border-time",
    numColor: "bg-time text-void-deep",
    body: [
      "Time breaks. Clocks melt.",
      "You blink, centuries pass.",
      "The market doesn't care.",
      "Neither does the void.",
    ],
    quote: "> 1 second survived.\n  7 years outside.\n  Your bags are gone.",
    quoteColor: "text-time",
    img: clock,
    alt: "Melting clock",
    glow: "var(--time)",
  },
  {
    n: 2,
    title: "DARK MATTER",
    border: "sketchy-border-dark",
    numColor: "bg-foreground text-void-deep",
    body: [
      "You're not alone.",
      "Something else is",
      "watching from the",
      "dark. It's hungry.",
      "It's patient.",
    ],
    quote: "> You can't see it.\n  It's still there.\n  Like your exit liquidity.",
    quoteColor: "text-foreground/80",
    img: darkmatter,
    alt: "Dark matter shadow",
    glow: "0 0% 95%",
  },
  {
    n: 3,
    title: "SPAGHETTIFICATION",
    border: "sketchy-border-spag",
    numColor: "bg-spaghetti text-void-deep",
    body: [
      "Gravity screams.",
      "You stretch. You twist.",
      "Your atoms go long.",
      "Welcome to dinner.",
    ],
    quote: "> This is fine.\n  The void disagrees.",
    quoteColor: "text-spaghetti",
    img: spaghetti,
    alt: "Spaghettified parrot",
    glow: "var(--spaghetti)",
  },
];

const DimensionCards = () => {
  return (
    <section className="container mx-auto px-4 py-6" id="game">
      <div className="text-center mb-8">
        <h2 className="font-graffiti text-4xl md:text-5xl text-foreground tracking-wide">
          CHOOSE YOUR DIMENSION
        </h2>
        <p className="font-handwritten mt-2 text-xl text-foreground/70">
          Each card is a different survival mode.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {dims.map((d, i) => (
          <motion.article
            key={d.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            whileHover={{ scale: 1.03, y: -6 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            aria-label={`${d.title} preview — opens the real game in a new tab`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            }}
            className={`panel-void ${d.border} relative overflow-hidden group flex flex-col h-[360px] transition-shadow duration-300 cursor-pointer focus:outline-none`}
            style={{
              padding: "24px",
              gap: "14px",
              ["--card-glow" as any]: d.glow,
              boxShadow:
                "0 0 0 1px hsl(var(--void-deep)), 0 20px 60px -20px hsl(var(--void-deep)), 0 0 35px hsl(var(--card-glow) / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -40px 60px -20px hsl(var(--void-deep) / 0.6)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 0 1px hsl(var(--void-deep)), 0 30px 70px -20px hsl(var(--void-deep)), 0 0 60px hsl(var(--card-glow) / 0.7), 0 0 100px hsl(var(--card-glow) / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.08), inset 0 -40px 60px -20px hsl(var(--void-deep) / 0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 0 1px hsl(var(--void-deep)), 0 20px 60px -20px hsl(var(--void-deep)), 0 0 35px hsl(var(--card-glow) / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -40px 60px -20px hsl(var(--void-deep) / 0.6)";
            }}
          >
            {/* Depth gradient overlay */}
            <div
              className="pointer-events-none absolute inset-0 -z-0"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(ellipse at top left, hsl(var(--card-glow) / 0.12) 0%, transparent 55%), linear-gradient(180deg, transparent 40%, hsl(var(--void-deep) / 0.55) 100%)",
              }}
            />

            {/* Top row: badge + title */}
            <div className="relative flex items-center gap-2 md:gap-3 min-w-0">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-graffiti text-lg ${d.numColor}`}>
                {d.n}
              </div>
              <h3 className="font-graffiti text-lg md:text-2xl text-foreground leading-tight flex-1 min-w-0 truncate">
                {d.title}
              </h3>
              <span className="shrink-0 font-mono-x text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase border border-current/40 rounded px-1 md:px-1.5 py-0.5 text-foreground/70 whitespace-nowrap">
                Preview
              </span>
            </div>

            {/* Middle: description + image right */}
            <div className="relative flex gap-3 flex-1 min-h-0">
              <div className="flex-1 font-mono-x text-sm text-foreground/85 leading-relaxed">
                {d.body.map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>
              <motion.img
                src={d.img}
                alt={d.alt}
                loading="lazy"
                className="w-20 h-20 md:w-24 md:h-24 object-contain shrink-0 self-center transition-transform duration-300 group-hover:scale-110"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 6px 12px hsl(var(--void-deep) / 0.7)) drop-shadow(0 0 18px hsl(var(--card-glow) / 0.4))" }}
              />
            </div>

            {/* Bottom: sarcasm */}
            <pre className={`relative font-mono-x text-xs md:text-sm whitespace-pre-wrap mt-auto ${d.quoteColor}`}>
              {d.quote}
            </pre>

            {/* Click to enter label */}
            <div
              className={`relative mt-2 flex items-center justify-center gap-2 font-graffiti text-sm tracking-[0.25em] ${d.quoteColor} opacity-80 group-hover:opacity-100 transition-opacity`}
            >
              <span className="h-px flex-1 bg-current opacity-40" />
              ENTER THE VOID
              <span className="h-px flex-1 bg-current opacity-40" />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default DimensionCards;
