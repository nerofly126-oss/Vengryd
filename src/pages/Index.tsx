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
    <div className="min-h-screen bg-background">
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
  );
};

export default Index;
