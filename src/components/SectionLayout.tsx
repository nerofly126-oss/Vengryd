import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeafCorners from "@/components/Leafcorners";

const SectionLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[170px]" />
        <div className="absolute top-1/3 -right-32 h-[38rem] w-[38rem] rounded-full bg-accent/[0.035] blur-[160px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <LeafCorners />
        <Navbar />
        <main className="flex-1 pt-24">
          {children}
          <div className="container flex justify-center pb-16 pt-8">
            <Link
              to="/"
              className="liquid-button liquid-button-soft px-6 py-3 font-display font-semibold uppercase tracking-tight"
            >
              Back to home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default SectionLayout;
