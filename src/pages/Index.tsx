import Stars from "@/components/qp/Stars";
import Navbar from "@/components/qp/Navbar";
import Hero from "@/components/qp/Hero";
import ValueProps from "@/components/qp/ValueProps";
import DimensionCards from "@/components/qp/DimensionCards";
import NftCta from "@/components/qp/NftCta";
import SignalFeed from "@/components/qp/SignalFeed";
import StickyNote from "@/components/qp/StickyNote";
import Footer from "@/components/qp/Footer";
import GameOverlay from "@/components/qp/GameOverlay";

const Index = () => {
  return (
    <main className="relative min-h-screen">
      {/* Global cosmic stars */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Stars count={80} />
        <div className="stars-bg absolute inset-0 opacity-50" />
      </div>

      <Navbar />
      <Hero />
      <ValueProps />
      <DimensionCards />

      <div className="container mx-auto px-4 py-10" id="signals">
        <div className="text-center mb-6">
          <h2 className="font-graffiti text-3xl md:text-4xl text-foreground tracking-wide">
            VIEW <span className="text-primary">SIGNALS</span>
          </h2>
          <p className="font-mono-x text-xs text-foreground/60 tracking-wider uppercase mt-1">
            Top runs · Live feed · Recorded on Monad
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="w-full">
            <SignalFeed />
          </div>
          <div className="self-start">
            <StickyNote />
          </div>
        </div>
      </div>

      <NftCta />
      <Footer />
      <GameOverlay />
    </main>
  );
};

export default Index;
