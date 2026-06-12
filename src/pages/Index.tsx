import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import ValueProps from "@/components/ValueProps";
import HowItWorks from "@/components/Howitworks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import LeafCorners from "@/components/Leafcorners";

const Index = () => {
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
        <Footer />
      </div>
    </div>
  );
};

export default Index;
