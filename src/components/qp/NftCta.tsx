const OPENSEA_URL = "https://opensea.io/collection/the-10k-squad-350905768";

const NftCta = () => {
  return (
    <section id="nfts" className="container mx-auto px-4 py-10">
      <div
        className="panel-void rounded-lg p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left"
        style={{
          boxShadow:
            "0 0 0 1px hsl(var(--void-deep)), 0 20px 60px -20px hsl(var(--void-deep)), 0 0 40px hsl(var(--primary) / 0.35)",
        }}
      >
        <div className="max-w-xl">
          <h2 className="font-graffiti text-3xl md:text-4xl text-foreground">
            JOIN THE <span className="text-primary">10K SQUAD</span>
          </h2>
          <p className="font-handwritten text-xl md:text-2xl text-foreground/85 mt-2">
            Own one of the 10K Squad parrots and enter the quantum void.
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-3">
          <a
            href={OPENSEA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-void inline-flex items-center gap-2 px-6 py-4 text-xl md:text-2xl whitespace-nowrap"
          >
            VIEW COLLECTION
          </a>
          <div className="flex items-center gap-3 font-mono-x text-xs text-foreground/70">
            <a
              href="https://x.com/the10kSquad"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition"
            >
              @the10kSquad on X
            </a>
            <span className="text-foreground/30">·</span>
            <a
              href="https://discord.gg/the10ksquad"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition"
            >
              Discord
            </a>
            <span className="text-foreground/30">·</span>
            <a
              href={OPENSEA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition"
            >
              Collection on OpenSea
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NftCta;
