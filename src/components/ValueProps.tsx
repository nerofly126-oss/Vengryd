import { motion } from "framer-motion";
import { Building2, Users, Zap, Shield } from "lucide-react";

const buyerProps = [
  { icon: Zap, title: "Instant Discovery", desc: "Find local vendors and products in seconds with smart geo-search." },
  { icon: Shield, title: "Verified Sellers", desc: "Every vendor is verified. Shop with confidence from trusted local businesses." },
];

const sellerProps = [
  { icon: Building2, title: "B2B & B2C in One", desc: "Sell wholesale to businesses and retail to consumers — one dashboard." },
  { icon: Users, title: "Hyperlocal Reach", desc: "Get discovered by customers and businesses in your area instantly." },
];

const ValueProps = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <motion.div
          className="max-w-3xl mb-16 md:text-right md:ml-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="eyebrow-kicker mb-6 md:flex-row-reverse">Why vengryd</span>
          <h2 className="font-display font-black uppercase leading-[0.85] tracking-tighter text-5xl md:text-7xl">
            Both sides of <span className="text-stroke">the trade</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-14 md:gap-16 lg:gap-24">
          {/* For Buyers */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow-kicker mb-6">For Buyers</span>
            <h3 className="font-display text-3xl md:text-4xl font-bold mb-10">
              Source locally,<br />save globally.
            </h3>
            <div className="space-y-9">
              {buyerProps.map((p) => (
                <div key={p.title} className="flex gap-5">
                  <p.icon className="shrink-0 w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-display text-lg font-bold text-foreground mb-1">{p.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* For Sellers */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow-kicker mb-6">For Sellers</span>
            <h3 className="font-display text-3xl md:text-4xl font-bold mb-10">
              Your storefront,<br />your neighborhood.
            </h3>
            <div className="space-y-9">
              {sellerProps.map((p) => (
                <div key={p.title} className="flex gap-5">
                  <p.icon className="shrink-0 w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-display text-lg font-bold text-foreground mb-1">{p.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
