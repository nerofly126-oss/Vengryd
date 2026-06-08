import { motion } from "framer-motion";
import { ShoppingBag, Utensils, Wrench, Shirt, Leaf, Gem } from "lucide-react";

const categories = [
  {
    icon: Utensils,
    label: "Food & Dining",
    desc: "Home kitchens, restaurants, caterers, and fresh produce stalls around you.",
    tags: ["Grills & jollof", "Catering", "Fresh produce"],
  },
  {
    icon: ShoppingBag,
    label: "Retail & Goods",
    desc: "Everyday essentials and wholesale stock from shops in your area.",
    tags: ["Wholesale", "Electronics", "Household"],
  },
  {
    icon: Wrench,
    label: "Home Services",
    desc: "Trusted hands for repairs, cleaning, and installations on demand.",
    tags: ["Repairs", "Cleaning", "Plumbing"],
  },
  {
    icon: Shirt,
    label: "Fashion & Style",
    desc: "Tailors, boutiques, and ready-to-wear from local creators.",
    tags: ["Ankara", "Tailoring", "Footwear"],
  },
  {
    icon: Leaf,
    label: "Organic & Farm",
    desc: "Farm-fresh harvests and natural wellness products, straight from the source.",
    tags: ["Produce", "Shea & oils", "Herbs"],
  },
  {
    icon: Gem,
    label: "Artisan & Crafts",
    desc: "Handmade pieces from makers keeping local traditions alive.",
    tags: ["Beadwork", "Carvings", "Textiles"],
  },
];

const Categories = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-transparent via-card/60 to-transparent">
      <div className="container">
        <motion.div
          className="max-w-3xl mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="eyebrow-kicker mb-6">Explore</span>
          <h2 className="font-display font-black uppercase leading-[0.85] tracking-tighter text-5xl md:text-7xl mb-6">
            Every <span className="text-stroke-primary">Category</span>,
            <br />
            One Place
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            From wholesale sourcing to everyday shopping — vengryd gathers your whole
            neighborhood's economy under one roof, organised so you find exactly what you need nearby.
          </p>
        </motion.div>

        {/* Category list — abstract, no cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              className={`group ${i % 3 === 1 ? "lg:translate-y-10" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <cat.icon className="w-10 h-10 text-primary mb-5" />
              <h3 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-foreground">
                {cat.label}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-xs">{cat.desc}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground/70 mt-4">
                {cat.tags.join("  ·  ")}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground font-body mt-10">
          New categories open up as more vendors join your area.
        </p>
      </div>
    </section>
  );
};

export default Categories;
