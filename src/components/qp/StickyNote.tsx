import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const StickyNote = () => {
  return (
    <motion.aside
      initial={{ opacity: 0, rotate: -10, y: 20 }}
      whileInView={{ opacity: 1, rotate: 4, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 90 }}
      className="relative mx-auto md:mx-0 w-[200px] bg-sticky text-sticky-foreground p-5 shadow-2xl"
      style={{
        boxShadow: "8px 12px 30px hsl(var(--void-deep) / 0.6), inset 0 -8px 20px hsl(45 60% 60% / 0.3)",
      }}
    >
      <span className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-3" />
      <p className="font-graffiti text-lg leading-tight text-center">
        NO PLAN.<br />
        NO MERCY.<br />
        JUST<br />
        PARROTS.
      </p>
      <Heart className="absolute bottom-2 right-3 h-5 w-5 text-primary fill-primary/40" />
    </motion.aside>
  );
};

export default StickyNote;
