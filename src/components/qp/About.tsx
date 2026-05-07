const About = () => {
  return (
    <section id="about" className="container mx-auto px-4 py-10">
      <div className="text-center mb-4">
        <h2 className="font-graffiti text-3xl md:text-4xl text-foreground tracking-wide">
          ABOUT
        </h2>
      </div>
      <p className="font-handwritten text-xl md:text-2xl text-foreground/85 max-w-3xl mx-auto text-center leading-relaxed">
        10K Quantum Parrots is a browser survival game built by a 10k Squad OG holder.
        No wallet needed. Top runs are recorded on{" "}
        <span className="text-primary font-bold">Monad mainnet</span> — permanently
        verifiable on-chain.
      </p>
    </section>
  );
};

export default About;
