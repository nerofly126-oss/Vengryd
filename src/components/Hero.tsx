// Landing-page hero: full-bleed background image with a staggered animated headline,
// subcopy, and shop/sell call-to-action buttons.
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
          className="max-w-3xl font-editorial text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.5rem] [text-shadow:0_4px_30px_rgba(0,0,0,0.6)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        >
          Trade. Grow. <span className="italic text-primary">Thrive.</span>
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
            to="/marketplace"
            className="btn btn-cream px-5 py-2.5 text-sm font-display font-semibold"
          >
            Shop the marketplace
          </Link>
          <Link
            to="/seller"
            className="btn btn-soft px-5 py-2.5 text-sm font-display font-medium"
          >
            Start selling
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
