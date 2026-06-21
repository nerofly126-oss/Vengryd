// Landing-page "How it works" section: a 3-step onboarding zigzag plus a grid of
// platform feature highlights.
import { motion } from "framer-motion";
import {
  UserPlus,
  MapPin,
  Store,
  Search,
  ShieldCheck,
  Building2,
  MessageSquare,
  Truck,
  TrendingUp,
} from "lucide-react";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Create Your Account",
    desc: "Join as a buyer, a seller, or both. Set up your profile or storefront in under a minute — no fees to get started.",
  },
  {
    num: "02",
    icon: MapPin,
    title: "Set Your Location",
    desc: "Tell us your area and we surface the vendors, products, and wholesale deals nearby — so everything you see is actually within reach.",
  },
  {
    num: "03",
    icon: Store,
    title: "Trade Locally",
    desc: "Browse, message, and transact in one place. Buy retail, source wholesale, and grow your network across your community.",
  },
];

const highlights = [
  {
    icon: Search,
    title: "Smart Geo-Search",
    desc: "Find vendors and products within your reach in seconds, ranked by how close they are to you.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Vendors",
    desc: "Every seller is checked before they go live, so you can trade with confidence.",
  },
  {
    icon: Building2,
    title: "B2B & B2C in One",
    desc: "Wholesale sourcing for businesses and retail shopping for consumers — from a single dashboard.",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    desc: "Talk to sellers, ask questions, and negotiate before you commit to a purchase.",
  },
  {
    icon: Truck,
    title: "Built for Local",
    desc: "Hyper-local by design, so fulfillment is faster and delivery stays in the neighborhood.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Reach",
    desc: "Sellers get discovered by nearby buyers and businesses the moment they list.",
  },
];

// Renders the steps (alternating left/right on desktop via `flip`) and the highlights grid,
// both animated on scroll.
const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-transparent via-card/60 to-transparent">
      <div className="container">
        <motion.div
          className="max-w-3xl mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="eyebrow-kicker mb-6">How it works</span>
          <h2 className="font-editorial font-semibold leading-[1.02] tracking-tight text-5xl md:text-7xl mb-6">
            Sign-up to your <span className="italic text-primary">first trade</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            vengryd brings your local economy online — connecting buyers and sellers who are
            already around the corner. Here's how you go from joining to trading.
          </p>
        </motion.div>

        {/* Steps — abstract zigzag flow, no cards */}
        <div className="relative max-w-5xl mx-auto">
          {/* flowing spine */}
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/25 to-transparent" />

          <div className="flex flex-col gap-14 md:gap-24">
            {steps.map((step, i) => {
              const flip = i % 2 === 1;
              return (
                <motion.div
                  key={step.num}
                  className={`relative flex items-start gap-6 md:w-1/2 ${
                    flip ? "md:ml-auto md:flex-row-reverse md:text-right" : "md:pr-12"
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.55 }}
                >
                  <step.icon className="shrink-0 w-12 h-12 md:w-14 md:h-14 text-primary" />

                  <div className={flip ? "md:pr-4" : ""}>
                    <h3 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter leading-[0.9] text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mt-4 max-w-sm">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* What makes vengryd different */}
        <motion.div
          className="mt-28 mb-14 max-w-3xl md:ml-auto md:text-right"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="eyebrow-kicker mb-6 md:flex-row-reverse">The toolkit</span>
          <h3 className="font-editorial font-semibold leading-[1.02] tracking-tight text-5xl md:text-7xl mb-6">
            More than a <span className="italic text-primary">listing site</span>
          </h3>
          <p className="ml-auto text-muted-foreground text-lg leading-relaxed max-w-2xl">
            A full toolkit for trading within your own community.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 max-w-5xl mx-auto">
          {highlights.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <feature.icon className="w-10 h-10 text-primary mb-5" />
              <h4 className="font-display text-lg md:text-xl font-black uppercase tracking-tight text-foreground mb-2">
                {feature.title}
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
