import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroImage from "@/assets/welcome-bg.webp";

const Hero = () => {
  return (
    <section className="relative flex min-h-[90vh] items-end overflow-hidden">
      {/* Full-bleed image with a bottom bleed into the page (keeps the image visible up top) */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Local marketplace" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-background via-background/65 to-transparent" />
      </div>

      <div className="container relative z-10 pb-20 pt-32 sm:pb-28">
        <motion.span
          className="eyebrow-kicker eyebrow-kicker-light mb-5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          The community marketplace
        </motion.span>

        <motion.h1
          className="max-w-3xl font-display text-5xl font-black uppercase leading-[0.88] tracking-tighter sm:text-7xl lg:text-8xl [text-shadow:0_4px_30px_rgba(0,0,0,0.6)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        >
          Trade. Grow. <span className="text-primary">Thrive.</span>
        </motion.h1>

        <motion.p
          className="mt-5 max-w-xl text-base text-foreground/90 sm:text-lg [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          Buy from and sell to vendors right in your neighbourhood — barbers, stylists, gadgets, food and more.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Link
            to="/dashboard"
            className="liquid-button liquid-button-primary px-8 py-4 text-base font-display font-semibold sm:text-lg"
          >
            Shop the marketplace
          </Link>
          <Link
            to="/seller"
            className="liquid-button liquid-button-soft px-8 py-4 text-base font-display font-medium sm:text-lg"
          >
            Start selling
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
