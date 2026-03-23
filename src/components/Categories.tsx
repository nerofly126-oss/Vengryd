import { motion } from "framer-motion";
import { ShoppingBag, Utensils, Wrench, Shirt, Leaf, Gem } from "lucide-react";

const categories = [
  { icon: Utensils, label: "Food & Dining", count: "2,400+" },
  { icon: ShoppingBag, label: "Retail & Goods", count: "1,800+" },
  { icon: Wrench, label: "Home Services", count: "950+" },
  { icon: Shirt, label: "Fashion & Style", count: "1,200+" },
  { icon: Leaf, label: "Organic & Farm", count: "620+" },
  { icon: Gem, label: "Artisan & Crafts", count: "780+" },
];

const Categories = () => {
  return (
    <section className="py-24 bg-card">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Every Category, <span className="text-primary">One Place</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From wholesale sourcing to everyday shopping — discover what your neighborhood has to offer.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              className="group flex flex-col items-center gap-4 p-6 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 hover:bg-secondary transition-all cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <cat.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-sm text-foreground">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} vendors</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
