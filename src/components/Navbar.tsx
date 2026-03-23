import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        <a href="/" className="font-display text-xl font-bold text-foreground tracking-wide">
          veng<span className="text-primary">ryd</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Categories</a>
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">How It Works</a>
          <a href="#join" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Join</a>
          <button className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm transition-all hover:shadow-[var(--shadow-glow)]">
            Get Early Access
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="container py-4 flex flex-col gap-4">
              <a href="#categories" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground font-body">Categories</a>
              <a href="#how" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground font-body">How It Works</a>
              <a href="#join" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground font-body">Join</a>
              <button className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm w-fit">
                Get Early Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

