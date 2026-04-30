const Footer = () => {
  const items = [
    { label: "Built by", value: "@Alnitak34", primary: true },
    { label: "", value: "10k Squad holder since testnet" },
    { label: "", value: "Every death = signal" },
    { label: "", value: "Top signals leave a trace on Monad", monad: true },
  ];

  return (
    <footer className="relative z-10 border-t border-border/40 panel-void mt-8" id="about">
      <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center gap-4 md:gap-6 flex-wrap justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-secondary/30 border border-secondary/50 grid place-items-center">
            <div className="h-5 w-5 rotate-45 bg-secondary-glow" />
          </div>
          <div className="leading-tight">
            <p className="font-mono-x text-[10px] text-muted-foreground tracking-widest">POWERED BY</p>
            <p className="font-graffiti text-lg text-foreground tracking-wide">MONAD</p>
          </div>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-x text-xs md:text-sm text-foreground/80">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-primary">•</span>}
              {it.label && <span className="text-foreground/60">{it.label}</span>}
              <span className={it.primary ? "text-primary font-bold" : it.monad ? "" : ""}>
                {it.value.includes("Monad") ? (
                  <>
                    Top signals leave a trace on{" "}
                    <span className="text-secondary-glow font-bold">Monad</span>
                  </>
                ) : (
                  it.value
                )}
              </span>
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
