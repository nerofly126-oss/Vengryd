import { motion } from "framer-motion";
import bannerImg from "@/assets/landing/showcase.jpeg";

const ShowcaseBanner = () => {
  return (
    <section className="relative flex min-h-[58vh] items-center justify-center overflow-hidden">
      <img src={bannerImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* Scrim so the type stays legible and the section blends with the page */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />

      <motion.div
        className="container relative z-10 text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="mx-auto max-w-3xl font-editorial text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl [text-shadow:0_4px_30px_rgba(0,0,0,0.5)]">
          Everything your neighbourhood makes, <span className="italic text-primary">in one place.</span>
        </h2>
      </motion.div>
    </section>
  );
};

export default ShowcaseBanner;
