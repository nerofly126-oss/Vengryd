import { useLayoutEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureBlocks from "@/components/FeatureBlocks";
import Categories from "@/components/Categories";
import HowItWorks from "@/components/Howitworks";
import ShowcaseBanner from "@/components/ShowcaseBanner";
import Footer from "@/components/Footer";
import LeafCorners from "@/components/Leafcorners";

// Public marketing landing page (route: /) — composes the home page from section components.

/**
 * Index page: the marketing home page. Renders an ambient background plus the landing
 * sections in order (Navbar, Hero, FeatureBlocks, Categories, HowItWorks, ShowcaseBanner,
 * Footer); #categories and #how anchors support in-page nav scrolling.
 *
 * The landing is always shown in dark mode regardless of the user's theme: while mounted
 * it forces the `dark` class on <html> and restores the previous state on unmount, without
 * touching the saved theme preference.
 */
const Index = () => {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.add("dark");
    return () => {
      if (!wasDark) html.classList.remove("dark");
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Continuous ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[170px]" />
        <div className="absolute top-1/3 -right-32 h-[38rem] w-[38rem] rounded-full bg-accent/[0.035] blur-[160px]" />
        <div className="absolute bottom-[8%] left-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/[0.025] blur-[170px]" />
      </div>

      <div className="relative z-10">
        <LeafCorners />
        <Navbar />
        <Hero />
        <FeatureBlocks />
        <div id="categories">
          <Categories />
        </div>
        <div id="how">
          <HowItWorks />
        </div>
        <ShowcaseBanner />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
