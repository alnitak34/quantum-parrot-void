import { motion } from "framer-motion";

const steps = [
  {
    n: "①",
    title: "ENTER",
    desc: "Choose your dimension. No wallet needed.",
  },
  {
    n: "②",
    title: "SURVIVE",
    desc: "Dodge, resist, escape. Die trying.",
  },
  {
    n: "③",
    title: "LEAVE A TRACE",
    desc: "Top runs are batched and recorded on Monad mainnet.",
  },
];

const HowItWorks = () => {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <h2 className="font-graffiti text-3xl md:text-4xl text-foreground tracking-wide">
          HOW IT <span className="text-primary">WORKS</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.45 }}
            className="panel-void rounded-lg p-5 flex items-start gap-4"
            style={{
              boxShadow:
                "0 0 0 1px hsl(var(--void-deep)), 0 12px 32px -12px hsl(var(--void-deep)), 0 0 24px hsl(var(--primary) / 0.25)",
            }}
          >
            <span
              className="font-graffiti text-4xl md:text-5xl text-primary leading-none shrink-0"
              style={{ textShadow: "0 0 18px hsl(var(--primary) / 0.6)" }}
            >
              {s.n}
            </span>
            <div className="min-w-0">
              <h3 className="font-graffiti text-xl text-foreground tracking-wide">{s.title}</h3>
              <p className="font-mono-x text-sm text-foreground/70 leading-snug mt-1">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
