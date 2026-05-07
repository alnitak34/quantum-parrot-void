import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

const MESSAGES = [
  ["NO PLAN.", "NO MERCY.", "JUST", "PARROTS."],
  ["EVERY RUN", "LEAVES", "A TRACE."],
  ["YOUR", "DEATH.", "YOUR", "DATA.", "FOREVER."],
];

const StickyNote = () => {
  const [idx, setIdx] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const rot = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 5000);
    const g = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 220);
    }, 12000);
    return () => {
      clearInterval(rot);
      clearInterval(g);
    };
  }, []);

  return (
    <motion.aside
      initial={{ opacity: 0, rotate: -10, y: 20 }}
      whileInView={{ opacity: 0.7, rotate: -3, y: 0 }}
      whileHover={{ opacity: 1, rotate: -1, scale: 1.04 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 90 }}
      className="relative mx-auto md:mx-0 w-[200px] bg-sticky text-sticky-foreground p-5"
      style={{
        boxShadow:
          "0 18px 30px -8px hsl(var(--void-deep) / 0.85), 0 8px 14px -4px hsl(var(--void-deep) / 0.6), inset 0 -10px 24px hsl(45 60% 55% / 0.35)",
        backgroundImage:
          "repeating-linear-gradient(45deg, hsl(45 60% 70% / 0.18) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, hsl(40 50% 50% / 0.10) 0 1px, transparent 1px 4px), radial-gradient(ellipse at 30% 20%, hsl(50 80% 90% / 0.5), transparent 60%)",
        filter: glitch ? "hue-rotate(20deg) contrast(1.3)" : undefined,
        transform: glitch ? "translate(1px, -1px) skewX(-2deg)" : undefined,
      }}
    >
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-3 w-[70px] h-[20px]"
        style={{
          background:
            "linear-gradient(180deg, hsl(0 0% 100% / 0.75) 0%, hsl(0 0% 95% / 0.55) 40%, hsl(0 0% 85% / 0.45) 100%)",
          borderLeft: "1px solid hsl(0 0% 100% / 0.4)",
          borderRight: "1px solid hsl(0 0% 0% / 0.1)",
          boxShadow: "0 2px 4px hsl(var(--void-deep) / 0.4)",
        }}
      >
        <span
          className="absolute top-[2px] left-2 right-4 h-[3px] rounded-full"
          style={{ background: "hsl(0 0% 100% / 0.7)" }}
        />
      </span>
      <div className="min-h-[110px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="font-graffiti text-lg leading-tight text-center"
          >
            {MESSAGES[idx].map((line, i) => (
              <span key={i}>
                {line}
                {i < MESSAGES[idx].length - 1 && <br />}
              </span>
            ))}
          </motion.p>
        </AnimatePresence>
      </div>
      <Heart className="absolute bottom-2 right-3 h-5 w-5 text-primary fill-primary/40" />
    </motion.aside>
  );
};

export default StickyNote;
