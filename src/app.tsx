import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/soner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoadingScreen from "@/components/LoadingScreen";
import { RoleGuard } from "@/components/RoleGuard";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import AuthSelect from "./pages/AuthSelect.tsx";
import NotFound from "./pages/NotFound.tsx";
import BuyerDashboard from "./pages/BuyerDashboard.tsx";
import SellerDashboard from "./pages/SellerDashboard.tsx";

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

  if (isBooting) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/dashboard/browse" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/dashboard/orders" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/dashboard/wishlist" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/dashboard/settings" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/buyer/dashboard" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/buyer/dashboard/browse" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/buyer/dashboard/orders" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/buyer/dashboard/wishlist" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/buyer/dashboard/settings" element={<RoleGuard allowedRole="buyer"><BuyerDashboard /></RoleGuard>} />
            <Route path="/seller/products" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller/dashboard" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller/dashboard/orders" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller/dashboard/analytics" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller/dashboard/listings" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller/dashboard/messages" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller/dashboard/promotions" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller/dashboard/settings" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller-preview" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller-preview/orders" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller-preview/analytics" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller-preview/listings" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller-preview/messages" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller-preview/promotions" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/seller-preview/settings" element={<RoleGuard allowedRole="seller"><SellerDashboard /></RoleGuard>} />
            <Route path="/auth/select" element={<AuthSelect />} />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
