import { motion } from "framer-motion";
import { Gamepad2, Radio, Database } from "lucide-react";

const items = [
  {
    icon: Gamepad2,
    title: "PLAY",
    desc: "Survive impossible dimensions.",
    glow: "var(--primary)",
  },
  {
    icon: Radio,
    title: "SIGNAL",
    desc: "Each run is saved as a signal.",
    glow: "var(--secondary)",
  },
  {
    icon: Database,
    title: "MONAD",
    desc: "Top signals are batched and recorded on Monad.",
    glow: "var(--primary)",
  },
];

const ValueProps = () => {
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="panel-void rounded-lg p-5 flex items-center gap-4"
              style={{
                ["--glow" as any]: it.glow,
                boxShadow:
                  "0 0 0 1px hsl(var(--void-deep)), 0 12px 32px -12px hsl(var(--void-deep)), 0 0 24px hsl(var(--glow) / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.05)",
              }}
            >
              <div
                className="h-12 w-12 shrink-0 rounded-md grid place-items-center"
                style={{
                  background: "hsl(var(--glow) / 0.15)",
                  border: "1px solid hsl(var(--glow) / 0.4)",
                  boxShadow: "0 0 18px hsl(var(--glow) / 0.5)",
                }}
              >
                <Icon className="h-6 w-6 text-primary" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h3 className="font-graffiti text-xl text-foreground tracking-wide">{it.title}</h3>
                <p className="font-mono-x text-sm text-foreground/70 leading-snug">{it.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default ValueProps;
