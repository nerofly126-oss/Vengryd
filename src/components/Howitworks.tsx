import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Sign Up", desc: "Create your account as a buyer, seller, or both. It takes 30 seconds." },
  { num: "02", title: "Set Your Location", desc: "We use your area to surface nearby vendors, products, and deals." },
  { num: "03", title: "Start Trading", desc: "Browse, connect, and transact — whether wholesale or retail." },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-card">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg">Three steps to start buying and selling locally.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="relative text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <span className="font-display text-7xl font-bold text-primary/15 select-none">{step.num}</span>
              <h3 className="font-display text-xl font-bold -mt-4 mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
