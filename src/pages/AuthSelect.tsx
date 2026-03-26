import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Store } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LeafCorners from "@/components/Leafcorners";

const roles = {
  buyer: {
    title: "Buyer profile",
    description: "Discover local goods, trusted sellers, and wholesale opportunities near you.",
    icon: ShoppingBag,
  },
  seller: {
    title: "Seller profile",
    description: "Showcase your products, reach nearby customers, and grow your local presence.",
    icon: Store,
  },
} as const;

type Role = keyof typeof roles;

const AuthSelect = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>("buyer");

  const activeRole = roles[selectedRole];
  const ActiveIcon = activeRole.icon;

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden">
      <LeafCorners />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-[-4rem] h-64 w-64 rounded-full bg-primary/5 blur-[96px] sm:top-1/4 sm:left-1/4 sm:h-96 sm:w-96 sm:blur-[120px]" />
        <div className="absolute bottom-16 right-[-3rem] h-56 w-56 rounded-full bg-accent/5 blur-[88px] sm:bottom-1/4 sm:right-1/4 sm:h-80 sm:w-80 sm:blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] items-start justify-center overflow-y-auto px-4 py-6 sm:items-center sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground font-body text-sm sm:mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8 md:p-10">
            <div className="mx-auto mb-8 max-w-xl text-center sm:mb-10">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Choose your path on veng<span className="text-primary">ryd</span>
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-body sm:text-base">
                Pick the profile that matches how you want to use the marketplace, then continue to login or sign up.
              </p>
            </div>

            <div className="mx-auto max-w-xl">
              <div className="rounded-2xl border border-border bg-secondary/40 p-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("buyer")}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-all font-body ${
                      selectedRole === "buyer"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("seller")}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-all font-body ${
                      selectedRole === "seller"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    Seller
                  </button>
                </div>
              </div>

              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-5 rounded-2xl border border-border bg-secondary/20 p-5 sm:p-6"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ActiveIcon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
                  {activeRole.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-body sm:text-base">
                  {activeRole.description}
                </p>
              </motion.div>

              <button
                type="button"
                onClick={() => navigate(`/auth?role=${selectedRole}`)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)] hover:brightness-110 font-display"
              >
                Continue as {selectedRole}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthSelect;
