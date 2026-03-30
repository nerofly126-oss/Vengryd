import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Eye,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  Star,
  TrendingUp,
} from "lucide-react";
import { SellerSidebar } from "@/components/SellerSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSellerDashboardData } from "@/lib/dashboard-store";
import SellerPayments from "@/pages/seller/SellerPayments";
import SellerProducts from "@/pages/seller/SellerProducts";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function OverviewContent() {
  const { products, activity: recentActivity, topSellers, featuredSellers, paymentSettings } = useSellerDashboardData();
  const stats = [
    { label: "Active", value: `${products.filter((product) => product.status === "Active").length} Listings` },
    {
      label: "Total Sales",
      value: `₦${products.reduce((sum, product) => sum + product.sales * Number(product.price), 0).toLocaleString()}`,
    },
  ];
  const overviewProducts = products.slice(0, 3).map((product) => ({
    name: product.name,
    price: `₦${Number(product.price).toLocaleString()}`,
    sales: product.sales,
    views: product.views,
  }));

  return (
    <>
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-wide text-foreground md:text-3xl">
          Welcome to vengryd.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground font-body">
          Hello Seller, welcome back!
        </p>
      </motion.div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 lg:col-span-2"
          style={{ background: "var(--gradient-earth)" }}
        >
          <div className="relative z-10">
            <h2 className="mb-2 font-display text-xl font-bold text-primary-foreground md:text-2xl">
              Create and sell extraordinary products
            </h2>
            <p className="mb-6 max-w-md text-sm text-primary-foreground/80 font-body">
              The world&apos;s first and largest handmade African marketplace. Share your craft with the world.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-xl border border-primary-foreground/20 bg-background/20 px-5 py-2.5 text-sm font-medium text-primary-foreground backdrop-blur-sm transition-colors hover:bg-background/30 font-body">
                Explore More
              </button>
              <button className="rounded-xl bg-primary-foreground px-5 py-2.5 text-sm font-medium text-primary transition-all hover:brightness-110 font-body">
                Top Sellers
              </button>
            </div>
          </div>
          <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-primary-foreground/5" />
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-foreground/5" />
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6"
        >
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">My Stats</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="mb-1 text-xs text-muted-foreground font-body">{stat.label}</p>
                <p className="font-display text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
          <Link to="/seller/dashboard" className="mt-auto flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent/80 font-body">
            Go to my orders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-5 lg:col-span-2"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">My Listings</h2>
            <Link to="/seller/dashboard/listings" className="flex items-center gap-1 text-xs text-accent hover:underline font-body">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {overviewProducts.map((item) => (
              <div
                key={item.name}
                className="group cursor-pointer rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:border-accent/30"
              >
                <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-lg bg-secondary/80">
                  <Package className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-accent" />
                </div>
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <ShoppingCart className="h-3 w-3" /> {item.sales}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" /> {item.views}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-accent">{item.price}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Activity</h2>
            <button className="flex items-center gap-1 text-xs text-accent hover:underline font-body">
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div key={`${item.name}-${item.time}`} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.action}</p>
                </div>
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Top Sellers</h2>
            <button className="flex items-center gap-1 text-xs text-accent hover:underline font-body">
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {topSellers.map((seller) => (
              <div
                key={seller.name}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-sm font-semibold text-accent">{seller.name[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{seller.name}</p>
                  <p className="text-xs text-muted-foreground">{seller.sales} sales</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-sand" />
                  <span className="text-sm font-medium text-foreground">{seller.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Featured Sellers</h2>
            <button className="flex items-center gap-1 text-xs text-accent hover:underline font-body">
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {featuredSellers.map((seller) => (
              <div
                key={seller.name}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="text-sm font-semibold text-primary">{seller.name[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{seller.name}</p>
                  <p className="text-xs text-muted-foreground">{seller.sales} sales</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-sand" />
                  <span className="text-sm font-medium text-foreground">{seller.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="mt-6 rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Payment Stack</h2>
            <p className="mt-1 text-sm text-muted-foreground font-body">
              Start with verification and subscription, then control direct payment methods per seller.
            </p>
          </div>
          <Link to="/seller/dashboard/settings" className="text-xs text-accent hover:underline font-body">
            Manage Settings
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="mt-1 font-display text-lg text-foreground">{paymentSettings.plan}</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-xs text-muted-foreground">Verification</p>
            <p className="mt-1 font-display text-lg text-foreground">{paymentSettings.verificationStatus}</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-xs text-muted-foreground">Enabled Methods</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {paymentSettings.enabledMethods.length > 0 ? paymentSettings.enabledMethods.join(", ") : "None enabled"}
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function getSubPage(pathname: string) {
  if (pathname.startsWith("/seller/dashboard/settings")) return <SellerPayments />;
  if (pathname.startsWith("/seller-preview/settings")) return <SellerPayments />;
  if (pathname.startsWith("/seller/products")) return <SellerProducts />;
  if (pathname.startsWith("/seller/dashboard/listings")) return <SellerProducts />;
  if (pathname.startsWith("/seller-preview/listings")) return <SellerProducts />;
  return <OverviewContent />;
}

const SellerDashboard = () => {
  const location = useLocation();
  const { profile } = useSellerDashboardData();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SellerSidebar />

        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <SidebarTrigger className="text-muted-foreground" />

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search Dashboard"
                  className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-body"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="liquid-button liquid-button-icon liquid-button-soft text-muted-foreground">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="liquid-button liquid-button-icon liquid-button-soft relative text-muted-foreground">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
              </button>
              <Avatar className="ml-1 h-8 w-8 border border-border/80">
                <AvatarImage src={profile.logoUrl || profile.avatarUrl || undefined} alt={profile.businessName || profile.fullName} className="object-cover" />
                <AvatarFallback className="bg-accent/20 text-xs font-semibold text-accent">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{getSubPage(location.pathname)}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SellerDashboard;
