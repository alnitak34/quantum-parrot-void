import { Zap } from "lucide-react";

const links = ["GAME", "NFTS", "LEADERBOARD", "ABOUT"];

const Navbar = () => {
  return (
    <header className="relative z-30 w-full">
      <nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-5 md:py-6">
        <a href="#" className="flex items-baseline gap-2" aria-label="10K Squad home">
          <span className="font-graffiti text-3xl md:text-4xl text-primary" style={{ textShadow: "2px 2px 0 hsl(var(--void-deep))" }}>
            10K
          </span>
          <span className="font-graffiti text-2xl md:text-3xl text-foreground" style={{ textShadow: "2px 2px 0 hsl(var(--void-deep))" }}>
            SQUAD
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8 lg:gap-12">
          {links.map((l) => (
            <li key={l}>
              <a
                href={`#${l.toLowerCase()}`}
                className="font-graffiti text-lg lg:text-xl text-foreground/90 hover:text-primary transition-colors"
              >
                {l}
              </a>
            </li>
          ))}
        </ul>

        <button className="btn-wallet flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base">
          <span className="hidden sm:inline">CONNECT WALLET</span>
          <span className="sm:hidden">WALLET</span>
          <Zap className="h-4 w-4 fill-current" />
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
