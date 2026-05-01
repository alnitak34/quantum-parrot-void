import Stars from "@/components/qp/Stars";
import Navbar from "@/components/qp/Navbar";
import Hero from "@/components/qp/Hero";
import DimensionCards from "@/components/qp/DimensionCards";
import SignalFeed from "@/components/qp/SignalFeed";
import StickyNote from "@/components/qp/StickyNote";
import Footer from "@/components/qp/Footer";

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
      <DimensionCards />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
          <SignalFeedWrap />
          <StickyNote />
        </div>
      </div>

      <Footer />
    </main>
  );
};

// Wrapper so SignalFeed (which has its own container) sits inside the grid cleanly
const SignalFeedWrap = () => (
  <div className="-mx-4 lg:mx-0 [&>section]:py-0 [&>section]:px-0 lg:[&>section]:px-0">
    <SignalFeed />
  </div>
);

export default Index;
