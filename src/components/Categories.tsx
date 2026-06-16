import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import foodImg from "@/assets/categories/food.jpeg";
import barbersImg from "@/assets/categories/barbers.jpeg";
import gadgetsImg from "@/assets/categories/gadgets.jpeg";
import fashionImg from "@/assets/categories/fashion.jpeg";
import homeImg from "@/assets/categories/home.jpeg";
import artisansImg from "@/assets/categories/artisans.jpeg";
import farmImg from "@/assets/categories/farm.jpeg";
import stylistsImg from "@/assets/categories/stylists.jpeg";

type CategoryTile = { label: string; tint: string; image: string };

const categories: CategoryTile[] = [
  { label: "Food & Catering", tint: "from-emerald-600 to-green-800", image: foodImg },
  { label: "Barbers & Salons", tint: "from-teal-600 to-emerald-800", image: barbersImg },
  { label: "Gadgets & Electronics", tint: "from-green-700 to-emerald-900", image: gadgetsImg },
  { label: "Fashion & Style", tint: "from-emerald-700 to-teal-900", image: fashionImg },
  { label: "Home Services", tint: "from-teal-700 to-green-900", image: homeImg },
  { label: "Artisan & Crafts", tint: "from-green-600 to-teal-800", image: artisansImg },
  { label: "Organic & Farm", tint: "from-emerald-600 to-green-900", image: farmImg },
  { label: "Hair Stylists", tint: "from-teal-600 to-emerald-900", image: stylistsImg },
];

// Per-tile grid spans → asymmetrical mosaic (works at 2 cols mobile and 4 cols desktop).
const spans = [
  "col-span-2 row-span-2", // Food — big feature
  "row-span-2", // Barbers — tall
  "row-span-2", // Gadgets — tall
  "col-span-2", // Fashion — wide
  "col-span-2", // Home — wide
  "col-span-2", // Artisan — wide
  "", // Farm
  "", // Stylists
];

const Categories = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mb-12">
          <span className="eyebrow-kicker mb-4">Explore</span>
          <h2 className="font-editorial text-4xl font-semibold tracking-tight sm:text-6xl">
            Shop by <span className="italic text-primary">category</span>
          </h2>
        </div>

        <div className="grid grid-flow-dense grid-cols-2 auto-rows-[9rem] gap-4 sm:auto-rows-[11rem] lg:grid-cols-4 lg:auto-rows-[13rem]">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              className={spans[i % spans.length]}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to="/marketplace"
                className={`group relative flex h-full flex-col justify-end overflow-hidden bg-gradient-to-br ${cat.tint} p-5`}
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Scrim for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                <div className="relative z-10">
                  <h3 className="font-display text-lg font-bold uppercase leading-tight tracking-tight text-white">
                    {cat.label}
                  </h3>
                  <span className="mt-1 inline-block text-xs font-semibold uppercase tracking-widest text-white/70">
                    Shop now
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
