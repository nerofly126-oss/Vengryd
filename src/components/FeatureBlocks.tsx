import { motion } from "framer-motion";
import buyersImg from "@/assets/landing/buyers.jpeg";
import sellersImg from "@/assets/landing/sellers.jpeg";

type Block = {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  image: string;
  reversed?: boolean;
};

const blocks: Block[] = [
  {
    eyebrow: "For buyers",
    title: (
      <>
        Source locally, <span className="italic text-primary">shop with confidence.</span>
      </>
    ),
    body: "Discover vendors and products a few streets away — barbers, stylists, gadgets, fashion, food and more. Area-aware search finds exactly what you need in seconds.",
    image: buyersImg,
  },
  {
    eyebrow: "For sellers",
    title: (
      <>
        Your storefront, <span className="italic text-primary">your neighbourhood.</span>
      </>
    ),
    body: "List your products and services, set your area, and get discovered by buyers right around you. One simple dashboard for everything you sell.",
    image: sellersImg,
    reversed: true,
  },
];

const FeatureBlocks = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container space-y-8 md:space-y-12">
        {blocks.map((block, i) => (
          <motion.div
            key={i}
            className="grid overflow-hidden border border-border bg-card md:grid-cols-2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Text */}
            <div className={`flex flex-col justify-center p-9 sm:p-12 lg:p-14 ${block.reversed ? "md:order-2" : ""}`}>
              <span className="eyebrow-kicker mb-6">{block.eyebrow}</span>
              <h3 className="font-editorial text-3xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {block.title}
              </h3>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{block.body}</p>
            </div>

            {/* Image */}
            <div className={`relative min-h-[18rem] ${block.reversed ? "md:order-1" : ""}`}>
              <img src={block.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeatureBlocks;
