const Footer = () => {
  const items = [
    { label: "Built by", value: "@Alnitak34", primary: true },
    { label: "", value: "10k Squad holder since testnet" },
    { label: "", value: "Every death = signal" },
    { label: "", value: "Top signals leave a trace on Monad", monad: true },
  ];

  return (
    <footer className="relative z-10 panel-void mt-8" id="about">
      {/* subtle divider */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.25) 20%, hsl(0 0% 100% / 0.15) 50%, hsl(var(--secondary) / 0.25) 80%, transparent 100%)",
        }}
      />
      <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center gap-4 md:gap-6 flex-wrap justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-secondary/30 border border-secondary/50 grid place-items-center">
            <div className="h-5 w-5 rotate-45 bg-secondary-glow" />
          </div>
          <div className="leading-tight">
            <p className="font-mono-x text-[10px] text-muted-foreground/70 tracking-widest">POWERED BY</p>
            <p className="font-graffiti text-lg text-foreground tracking-wide">MONAD</p>
          </div>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-x text-xs md:text-sm text-foreground/55">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-primary/60">•</span>}
              {it.label && <span className="text-foreground/45">{it.label}</span>}
              {it.primary ? (
                <span
                  className="text-primary font-bold tracking-wide px-1.5 py-0.5 rounded-md"
                  style={{
                    textShadow: "0 0 12px hsl(var(--primary) / 0.6)",
                    background: "hsl(var(--primary) / 0.08)",
                  }}
                >
                  {it.value}
                </span>
              ) : (
                <span>
                  {it.value.includes("Monad") ? (
                    <>
                      Top signals leave a trace on{" "}
                      <span className="text-secondary-glow font-bold">Monad</span>
                    </>
                  ) : (
                    it.value
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="font-handwritten text-2xl text-primary -rotate-6 flex items-center gap-1">
          <span>WAGMI</span>
          <span className="text-foreground/60 text-base">(maybe)</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
