import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-marketplace.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Local marketplace"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      <div className="container relative z-10 py-32">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium font-display mb-6">
              🌿 Rooted in Community
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          >
            Trade.{" "}Grow.
            <br />
            <span className="text-primary">Thrive.</span>
          </motion.h1>

          <motion.p
            className="text-muted-foreground text-lg md:text-xl max-w-xl leading-relaxed mb-10 font-body"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            The Afrocentric marketplace connecting local businesses and consumers.
            Whether you're sourcing wholesale or finding unique local goods —
            vengryd brings your community online.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <button className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-lg transition-all hover:shadow-[var(--shadow-glow)] hover:scale-[1.02]">
              Join the Waitlist
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-border text-foreground font-display font-medium text-lg transition-all hover:bg-secondary hover:border-muted-foreground/30">
              Learn More
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
