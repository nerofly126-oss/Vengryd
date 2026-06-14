import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/soner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoadingScreen from "@/components/LoadingScreen";
import SectionLayout from "@/components/SectionLayout";
import Categories from "@/components/Categories";
import HowItWorks from "@/components/Howitworks";
import Index from "./pages/Index.tsx";
import BuyerDashboard from "./pages/BuyerDashboard.tsx";
import SellerDashboard from "./pages/SellerDashboard.tsx";
import VendorProfile from "./pages/VendorProfile.tsx";
import HotDeals from "./pages/HotDeals.tsx";
import Messages from "./pages/Messages.tsx";
import Settings from "./pages/Settings.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const APP_BOOT_DELAY_MS = 1600;

const App = () => {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsBooting(false);
    }, APP_BOOT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      {isBooting ? (
        <LoadingScreen />
      ) : (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<BuyerDashboard />} />
            <Route path="/seller" element={<SellerDashboard />} />
            <Route path="/vendor/:id" element={<VendorProfile />} />
            <Route path="/deals" element={<HotDeals />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/categories" element={<SectionLayout><Categories /></SectionLayout>} />
            <Route path="/how-it-works" element={<SectionLayout><HowItWorks /></SectionLayout>} />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
      )}
    </ThemeProvider>
  );
};

export default App;
