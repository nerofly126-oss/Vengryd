import { motion } from "framer-motion";
import heroImage from "@/assets/welcome-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image — fully visible, only a slim fade into the section below */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Local marketplace"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container relative z-10 py-32">
        <div className="max-w-4xl">
          <motion.span
            className="eyebrow-kicker eyebrow-kicker-light mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            The community marketplace
          </motion.span>

          <motion.h1
            className="font-display font-black uppercase leading-[0.82] tracking-tighter [text-shadow:0_4px_30px_rgba(0,0,0,0.65)]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[9.5rem]">Trade.</span>
            <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[9.5rem] md:pl-16 lg:pl-28">
              Grow.
            </span>
            <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[9.5rem] text-primary md:pl-32 lg:pl-56">
              Thrive.
            </span>
          </motion.h1>

          <motion.div
            className="mt-10 md:mt-12 flex flex-row flex-wrap items-start gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <a
              href="#join"
              className="liquid-button liquid-button-primary group px-5 py-2.5 text-sm md:px-8 md:py-4 md:text-lg font-display font-semibold"
            >
              Join the Waitlist
            </a>
            <a
              href="#how"
              className="liquid-button liquid-button-soft px-5 py-2.5 text-sm md:px-8 md:py-4 md:text-lg font-display font-medium"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
