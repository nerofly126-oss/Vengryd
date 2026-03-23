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
    <section className="py-24">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* For Buyers */}
          <motion.div
            className="p-8 md:p-10 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30"
            style={{ boxShadow: "var(--shadow-card)" }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-display font-semibold mb-6 uppercase tracking-wider">
              For Buyers
            </span>
            <h3 className="font-display text-3xl font-bold mb-8">
              Source locally,<br />save globally.
            </h3>
            <div className="space-y-6">
              {buyerProps.map((p) => (
                <div key={p.title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <p.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground mb-1">{p.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* For Sellers */}
          <motion.div
            className="p-8 md:p-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card"
            style={{ boxShadow: "var(--shadow-card)" }}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-display font-semibold mb-6 uppercase tracking-wider">
              For Sellers
            </span>
            <h3 className="font-display text-3xl font-bold mb-8">
              Your storefront,<br />your neighborhood.
            </h3>
            <div className="space-y-6">
              {sellerProps.map((p) => (
                <div key={p.title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <p.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground mb-1">{p.title}</h4>
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
