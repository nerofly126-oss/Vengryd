import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { joinWaitlist } from "@/lib/waitlist";

const CTA = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("You're on the list! We'll be in touch.");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await joinWaitlist(email);

      if (result.alreadyJoined) {
        setSubmitMessage("You're already on the list. We'll be in touch.");
        setSubmitted(true);
        return;
      }

      setSubmitMessage(
        result.emailFailed
          ? "You're on the list. We saved your spot, but your confirmation email is delayed."
          : "You're on the list! Check your email for confirmation.",
      );
      setSubmitted(true);
      setEmail("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while joining the waitlist.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
            Be among the first to hear when vengryd launches.
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
                disabled={isSubmitting}
                className="group inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold transition-all hover:shadow-[var(--shadow-glow)] hover:scale-[1.02]"
              >
                {isSubmitting ? "Joining..." : "Join"}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-lg bg-accent/10 border border-accent/20 text-accent font-display font-semibold"
            >
              {submitMessage}
            </motion.div>
          )}
          {errorMessage ? (
            <p className="mt-4 text-sm text-destructive font-body">{errorMessage}</p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground font-body">
              Join the waitlist for launch updates.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
