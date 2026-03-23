import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

const CTA = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="py-32">
      <div className="container">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6">
            Ready to go <span className="text-primary">local</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join thousands of businesses and consumers building a stronger local economy. Be the first to know when vengryd launches.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold transition-all hover:shadow-[var(--shadow-glow)] hover:scale-[1.02]"
              >
                Join
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-lg bg-accent/10 border border-accent/20 text-accent font-display font-semibold"
            >
              🌿 You're on the list! We'll be in touch.
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
