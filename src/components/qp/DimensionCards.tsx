import { motion } from "framer-motion";
import clock from "@/assets/icon-clock.png";
import darkmatter from "@/assets/icon-darkmatter.png";
import spaghetti from "@/assets/icon-spaghetti.png";

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
    quoteColor: "text-muted-foreground",
    img: darkmatter,
    alt: "Dark matter shadow",
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
  },
];

const DimensionCards = () => {
  return (
    <section className="container mx-auto px-4 py-8 md:py-12" id="game">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {dims.map((d, i) => (
          <motion.article
            key={d.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            className={`panel-void ${d.border} relative overflow-hidden group flex flex-col h-[340px]`}
            style={{ padding: "24px", gap: "14px" }}
          >
            {/* Top row: badge + title */}
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-graffiti text-lg ${d.numColor}`}>
                {d.n}
              </div>
              <h3 className="font-graffiti text-xl md:text-2xl text-foreground leading-tight">
                {d.title}
              </h3>
            </div>

            {/* Middle: description + image right */}
            <div className="flex gap-3 flex-1 min-h-0">
              <div className="flex-1 font-mono-x text-sm text-foreground/85 leading-relaxed">
                {d.body.map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>
              <motion.img
                src={d.img}
                alt={d.alt}
                loading="lazy"
                className="w-20 h-20 md:w-24 md:h-24 object-contain shrink-0 self-center"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Bottom: sarcasm */}
            <pre className={`font-mono-x text-xs md:text-sm whitespace-pre-wrap mt-auto ${d.quoteColor}`}>
              {d.quote}
            </pre>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default DimensionCards;
