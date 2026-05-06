import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = ["INITIALIZING VOID...", "LOCKING SIGNAL...", "ENTERING DIMENSION..."];

const LoadingOverlay = ({ onDone }: { onDone: () => void }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const stepMs = 500;
    const t1 = setTimeout(() => setIdx(1), stepMs);
    const t2 = setTimeout(() => setIdx(2), stepMs * 2);
    const t3 = setTimeout(() => onDone(), stepMs * 3);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at center, hsl(var(--void-deep) / 0.95) 0%, hsl(var(--void-deep)) 70%)",
      }}
    >
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.3) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />
      <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-8" />
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="font-graffiti text-2xl md:text-3xl text-primary tracking-widest"
          style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.7)" }}
        >
          {STEPS[idx]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
};

export default LoadingOverlay;
