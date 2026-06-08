import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import ValueProps from "@/components/ValueProps";
import HowItWorks from "@/components/Howitworks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import LeafCorners from "@/components/Leafcorners";

const exploreLinks = [
  { to: "/categories", label: "Every Category", primary: false },
  { to: "/how-it-works", label: "How It Works", primary: false },
  { to: "/join", label: "Join the Waitlist", primary: true },
];

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Continuous ambient backdrop that the sections blend into */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[170px]" />
        <div className="absolute top-1/3 -right-32 h-[38rem] w-[38rem] rounded-full bg-accent/[0.035] blur-[160px]" />
        <div className="absolute bottom-[8%] left-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/[0.025] blur-[170px]" />
      </div>

      <div className="relative z-10">
        <LeafCorners />
        <Navbar />
        <Hero />

        {/* Desktop: full single-page scroll */}
        <div className="hidden md:block">
          <div id="categories">
            <Categories />
          </div>
          <ValueProps />
          <div id="how">
            <HowItWorks />
          </div>
          <div id="join">
            <CTA />
          </div>
        </div>

        {/* Mobile: organised — value pitch + each section opens on its own page */}
        <div className="md:hidden">
          <ValueProps />
          <section className="py-16">
            <div className="container">
              <span className="eyebrow-kicker mb-8">Explore</span>
              <div className="flex flex-col gap-3">
                {exploreLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`liquid-button ${
                      link.primary ? "liquid-button-primary" : "liquid-button-soft"
                    } w-full px-6 py-4 font-display font-semibold uppercase tracking-tight`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
