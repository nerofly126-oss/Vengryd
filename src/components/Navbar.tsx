import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const MotionLink = motion(Link);

const mobileLinks = [
  { to: "/categories", label: "Categories" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/join", label: "Join" },
];

const mobileMenuVariants = {
  closed: {
    opacity: 0,
    y: -18,
    scale: 0.96,
    filter: "blur(14px)",
    transition: {
      duration: 0.24,
      ease: [0.32, 0.72, 0, 1],
    },
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.06,
      delayChildren: 0.06,
    },
  },
};

const mobileItemVariants = {
  closed: {
    opacity: 0,
    y: -8,
  },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 md:px-5 md:pt-3">
      <div className="mx-auto w-full md:max-w-6xl">
        <div className="navbar-shell">
          <div className="container flex h-16 items-center justify-between">
            <a href="/" className="font-display text-xl font-bold tracking-wide text-white">
              ven<span className="text-primary">gryd</span>
            </a>

            {/* Desktop */}
            <div className="hidden items-center gap-1 md:flex">
              <a href="#categories" className="navbar-desktop-link">
                Categories
              </a>
              <a href="#how" className="navbar-desktop-link">
                How It Works
              </a>
              <a href="#join" className="navbar-desktop-link">
                Join
              </a>
              <Link
                to="/auth/select"
                className="liquid-button liquid-button-primary ml-3 px-5 py-2 text-sm font-display font-semibold"
              >
                Log In / Sign Up
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className="navbar-hamburger md:hidden"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            >
              <span className={`navbar-hamburger__line ${open ? "navbar-hamburger__line--top-open" : ""}`} />
              <span className={`navbar-hamburger__line ${open ? "navbar-hamburger__line--middle-open" : ""}`} />
              <span className={`navbar-hamburger__line ${open ? "navbar-hamburger__line--bottom-open" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileMenuVariants}
              className="navbar-mobile-panel md:hidden"
            >
              <div className="container flex flex-col gap-2 px-5 py-4">
                {mobileLinks.map((link) => (
                  <MotionLink
                    key={link.to}
                    variants={mobileItemVariants}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="navbar-mobile-link"
                  >
                    {link.label}
                  </MotionLink>
                ))}
                <motion.div variants={mobileItemVariants} className="pt-2">
                  <Link
                    to="/auth/select"
                    onClick={() => setOpen(false)}
                    className="liquid-button liquid-button-primary px-5 py-2.5 text-sm font-display font-semibold"
                  >
                    Log In / Sign Up
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
