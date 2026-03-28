import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Sparkles, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import welcomeBg from "@/assets/welcome-bg.jpg";
import LeafCorners from "@/components/Leafcorners";

type Role = "buyer" | "seller" | null;

const AuthSelect = () => {
  const [role, setRole] = useState<Role>("buyer");
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (!role) {
      return;
    }

    setConfirmed(true);
  };

  const handleContinue = () => {
    if (!role) {
      return;
    }

    navigate(`/auth?role=${role}`);
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4 py-6">
      <div className="absolute inset-0">
        <img
          src={welcomeBg}
          alt=""
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/20 to-background/95" />
      </div>

      <LeafCorners />

      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {!confirmed ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
              className="rounded-[2rem] border border-border/60 bg-card/75 p-6 text-center shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mb-5 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground font-body"
              >
                Back to home
              </button>

              <h1 className="mb-2 font-display text-3xl font-bold tracking-wide text-foreground">
                veng<span className="text-primary">ryd</span>
              </h1>
              <p className="mb-10 text-sm text-muted-foreground font-body">
                How would you like to use the marketplace?
              </p>

              <div className="mb-8">
                <div className="mx-auto mb-5 max-w-sm rounded-2xl border border-border/70 bg-secondary/50 p-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRole("buyer")}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all font-body ${
                        role === "buyer"
                          ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                          : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                      }`}
                    >
                      Buyer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("seller")}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all font-body ${
                        role === "seller"
                          ? "bg-accent text-accent-foreground shadow-[var(--shadow-leaf)]"
                          : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                      }`}
                    >
                      Seller
                    </button>
                  </div>
                </div>

                <motion.div
                  key={role ?? "none"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-border/70 bg-card/80 p-6 text-left"
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                      role === "seller"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {role === "seller" ? (
                      <Store className="h-6 w-6" />
                    ) : (
                      <ShoppingBag className="h-6 w-6" />
                    )}
                  </div>
                  <h3 className="mb-1 font-display text-lg font-semibold text-foreground">
                    {role === "seller" ? "Seller" : "Buyer"}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground font-body">
                    {role === "seller"
                      ? "Share your craft, grow your audience, and build trust locally."
                      : "Discover unique goods and support artisans you believe in."}
                  </p>
                </motion.div>
              </div>

              <motion.button
                type="button"
                onClick={handleConfirm}
                disabled={!role}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-[var(--shadow-glow)] disabled:cursor-not-allowed disabled:opacity-40 font-display"
              >
                Continue
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-[2rem] border border-border/60 bg-card/75 p-6 text-center shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mb-5 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground font-body"
              >
                Back to home
              </button>

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="mx-auto mb-6 h-10 w-10 text-primary" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-4 font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl"
              >
                Welcome,{" "}
                <span className={role === "buyer" ? "text-primary" : "text-accent"}>
                  {role === "buyer" ? "Buyer" : "Seller"}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mx-auto mb-10 max-w-sm text-base text-muted-foreground font-body"
              >
                {role === "buyer"
                  ? "Your journey to discovering authentic goods starts now. Explore curated finds from talented artisans."
                  : "Your storefront awaits. Share your craft, tell your story, and connect with people who value it."}
              </motion.p>

              <motion.button
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={handleContinue}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-[var(--shadow-glow)] font-display"
              >
                Get Started
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthSelect;
