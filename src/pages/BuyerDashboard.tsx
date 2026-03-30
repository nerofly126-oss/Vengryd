import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Compass,
  Heart,
  MessageSquare,
  Package,
  Search,
  ShoppingBag,
} from "lucide-react";
import { BuyerSidebar } from "@/components/BuyerSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBuyerDashboardData } from "@/lib/dashboard-store";
import BuyerBrowse from "@/pages/buyer/BuyerBrowse";
import BuyerOrders from "@/pages/buyer/BuyerOrders";
import BuyerSettings from "@/pages/buyer/BuyerSettings";
import BuyerWishlist from "@/pages/buyer/BuyerWishlist";

const statusColor: Record<string, string> = {
  Shipped: "bg-primary/20 text-primary",
  Delivered: "bg-accent/20 text-accent",
  Processing: "bg-sand/20 text-sand-dark",
  Cancelled: "bg-destructive/20 text-destructive",
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function OverviewContent() {
  const { orders, wishlist, activity } = useBuyerDashboardData();
  const stats = [
    { label: "Today", value: `${orders.filter((order) => order.status !== "Cancelled").length} Orders` },
    { label: "Wishlist", value: `${wishlist.length} Saved` },
  ];
  const recentOrders = orders.slice(0, 4);
  const wishlistItems = wishlist.slice(0, 3);
  const recentActivity = activity.slice(0, 5);
  const highlightedSellers = Array.from(new Set(wishlist.map((item) => item.seller))).slice(0, 2);

  return (
    <>
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#1f2914] md:text-[2.2rem]">
          Welcome to vengryd.
        </h1>
        <p className="mt-1 text-sm text-[#78806c] font-body">Hello, welcome back! Here&apos;s what&apos;s worth checking today.</p>
      </motion.div>

      <div className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative min-h-[260px] overflow-hidden rounded-[32px] border border-[#203017]/10 p-7 shadow-[0_38px_70px_-46px_rgba(26,40,16,0.9)] md:p-8"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(175, 222, 101, 0.18), transparent 28%), linear-gradient(135deg, #0d180e 0%, #122312 38%, #1a2b18 100%)",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(142,191,73,0.08),transparent_18%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.06),transparent_15%),radial-gradient(circle_at_30%_80%,rgba(118,186,43,0.1),transparent_20%)]" />
          <div className="absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-[#76ba2b]/10 blur-2xl" />
          <div className="absolute right-8 top-4 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute right-16 top-12 h-28 w-28 rounded-full border border-white/10" />
          <div className="absolute inset-y-0 right-0 w-[42%] bg-[linear-gradient(130deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]" />

          <div className="relative z-10 max-w-lg">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#c7e7a0]">
              <Compass className="h-3.5 w-3.5" />
              Curated marketplace
            </div>
            <h2 className="mb-3 font-display text-2xl font-bold leading-tight text-[#eef7e1] md:text-[2rem]">
              Discover trusted local vendors and standout handmade finds.
            </h2>
            <p className="mb-7 max-w-md text-sm leading-6 text-[#d7e3ca] font-body">
              Shop beautifully made products, compare nearby sellers, and keep your favorite finds close while you
              track every order from one calm workspace.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/buyer/dashboard/browse"
                className="rounded-2xl bg-[#f4f9ea] px-5 py-2.5 text-sm font-semibold text-[#243216] transition-transform hover:-translate-y-0.5 font-body"
              >
                Explore More
              </Link>
              <Link
                to="/buyer/dashboard/wishlist"
                className="rounded-2xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#edf7df] backdrop-blur-sm transition-colors hover:bg-white/10 font-body"
              >
                Saved Finds
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[32px] border border-[#d6ebb3] bg-[linear-gradient(140deg,#efffd0_0%,#d7fb97_45%,#c6ee75_100%)] p-6 shadow-[0_34px_60px_-42px_rgba(118,186,43,0.95)]"
        >
          <div className="absolute -right-8 bottom-0 h-36 w-36 rounded-full bg-white/25 blur-2xl" />
          <div className="absolute right-6 top-4 h-28 w-28 rounded-full border border-white/40" />
          <div className="absolute right-10 top-8 h-20 w-20 rounded-full border border-white/40" />
          <div className="relative z-10">
            <h3 className="mb-5 font-display text-[1.45rem] font-semibold text-[#233015]">My Stats</h3>
          </div>
          <div className="relative z-10 mb-6 grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-[#536733] font-body">{stat.label}</p>
                <p className="font-display text-xl font-bold text-[#1f2914]">{stat.value}</p>
              </div>
            ))}
          </div>
          <Link
            to="/buyer/dashboard/orders"
            className="relative z-10 mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#2f4b10] transition-transform hover:translate-x-0.5 font-body"
          >
            Go to my orders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.95fr)]">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-[30px] border border-[#edf0e5] bg-white p-6 shadow-[0_28px_60px_-48px_rgba(40,55,23,0.55)]"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-[1.55rem] font-semibold text-[#2f5b18]">Saved Finds</h2>
            <Link
              to="/buyer/dashboard/wishlist"
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#889072] transition-colors hover:text-[#5f8f21] font-body"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {wishlistItems.map((item, index) => (
              <div
                key={item.name}
                className="group cursor-pointer rounded-[24px] border border-[#eef1e7] bg-[#fcfcf9] p-4 transition-all hover:-translate-y-1 hover:border-[#d6ebb3] hover:shadow-[0_24px_42px_-36px_rgba(78,122,24,0.9)]"
              >
                <div
                  className="relative mb-4 flex aspect-[0.95] w-full items-center justify-center overflow-hidden rounded-[22px] border border-[#f0f3ea]"
                  style={{
                    background: `linear-gradient(145deg, ${
                      index === 0 ? "#f7fbef, #e5f6c7" : index === 1 ? "#f8f5ee, #efe8d9" : "#f4f8ef, #dff0cf"
                    })`,
                  }}
                >
                  <div className="absolute -bottom-5 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-white/75 blur-xl" />
                  <Heart className="relative z-10 h-10 w-10 text-[#7eb431] transition-colors group-hover:text-[#5c8f1e]" />
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8c946f]">{item.seller}</p>
                <p className="mt-1 truncate text-sm font-semibold text-[#253216]">{item.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-[#5c8f1e]">{item.price}</p>
                  <span className="rounded-full bg-[#f2f8e6] px-2.5 py-1 text-[11px] font-medium text-[#6d7a53]">Saved</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="rounded-[30px] border border-[#edf0e5] bg-white p-6 shadow-[0_28px_60px_-48px_rgba(40,55,23,0.55)]"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-[1.55rem] font-semibold text-[#2f5b18]">Recent Activity</h2>
            <button className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#889072] transition-colors hover:text-[#5f8f21] font-body">
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((item, index) => (
              <div key={`${item.name}-${item.time}`} className="flex items-start gap-3 rounded-[22px] px-1 py-1 transition-colors hover:bg-[#f8fbf2]">
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#eef7dd] text-[#5f8f21]">
                  <span className="text-xs font-semibold">{item.name.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#253216]">{item.name}</p>
                  <p className="text-xs text-[#8a907f]">{item.action}</p>
                </div>
                <span className="whitespace-nowrap pt-1 text-[11px] text-[#9aa191]">{index < 2 ? "Just now" : item.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="rounded-[30px] border border-[#edf0e5] bg-white p-6 shadow-[0_28px_60px_-48px_rgba(40,55,23,0.55)]"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-[1.55rem] font-semibold text-[#2f5b18]">Recent Orders</h2>
            <Link
              to="/buyer/dashboard/orders"
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#889072] transition-colors hover:text-[#5f8f21] font-body"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 rounded-[22px] border border-[#f1f3eb] px-4 py-3 transition-all hover:border-[#d8e7ba] hover:bg-[#fbfdf7]"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f2f8e6]">
                  <ShoppingBag className="h-4 w-4 text-[#6c8f3a]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#253216]">{order.item}</p>
                  <p className="text-xs text-[#8a907f]">
                    {order.id} · {order.date}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[order.status]}`}>
                  {order.status}
                </span>
                <span className="hidden text-sm font-bold text-[#253216] sm:block">{order.amount}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="rounded-[30px] border border-[#edf0e5] bg-white p-6 shadow-[0_28px_60px_-48px_rgba(40,55,23,0.55)]"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-[1.55rem] font-semibold text-[#2f5b18]">Favorite Vendors</h2>
            <Link
              to="/buyer/dashboard/browse"
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#889072] transition-colors hover:text-[#5f8f21] font-body"
            >
              Explore <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {highlightedSellers.map((seller, index) => (
              <div
                key={seller}
                className="flex items-center gap-3 rounded-[22px] border border-[#f1f3eb] px-4 py-3 transition-colors hover:bg-[#fbfdf7]"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${index === 0 ? "bg-[#e9f8c8] text-[#5d8d1f]" : "bg-[#eef2e5] text-[#506239]"}`}>
                  <span className="text-sm font-semibold">{seller.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#253216]">{seller}</p>
                  <p className="text-xs text-[#8a907f]">Trusted marketplace vendor</p>
                </div>
                <span className="rounded-full bg-[#f3f8ea] px-2.5 py-1 text-[11px] font-medium text-[#6f7e58]">Saved</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

function getSubPage(pathname: string) {
  if (pathname.startsWith("/dashboard/browse")) return <BuyerBrowse />;
  if (pathname.startsWith("/dashboard/orders")) return <BuyerOrders />;
  if (pathname.startsWith("/dashboard/wishlist")) return <BuyerWishlist />;
  if (pathname.startsWith("/dashboard/settings")) return <BuyerSettings />;
  if (pathname.startsWith("/buyer/dashboard/browse")) return <BuyerBrowse />;
  if (pathname.startsWith("/buyer/dashboard/orders")) return <BuyerOrders />;
  if (pathname.startsWith("/buyer/dashboard/wishlist")) return <BuyerWishlist />;
  if (pathname.startsWith("/buyer/dashboard/settings")) return <BuyerSettings />;
  return <OverviewContent />;
}

const BuyerDashboard = () => {
  const location = useLocation();
  const { profile } = useBuyerDashboardData();

  return (
    <SidebarProvider className="bg-[linear-gradient(180deg,#f2f4ea_0%,#edf2e6_100%)] text-foreground">
      <div className="flex min-h-screen w-full bg-transparent">
        <BuyerSidebar />

        <SidebarInset className="flex flex-1 flex-col bg-transparent">
          <header className="sticky top-0 z-20 flex h-20 items-center gap-4 bg-transparent px-4 pt-4 md:px-6 lg:px-8">
            <div className="flex w-full items-center gap-4 rounded-[30px] border border-white/70 bg-[#fcfcf8]/90 px-4 py-4 shadow-[0_24px_45px_-40px_rgba(29,42,13,0.7)] backdrop-blur-sm md:px-5">
              <SidebarTrigger className="h-9 w-9 rounded-full border border-[#e7ebdc] bg-white text-[#738066] hover:bg-[#f3f7ea]" />

              <div className="max-w-md flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ea58f]" />
                  <input
                    type="text"
                    placeholder="Search dashboard"
                    className="h-11 w-full rounded-full border border-[#edf0e5] bg-[#f7f9f2] pl-10 pr-4 text-sm text-[#253216] placeholder:text-[#a1a897] focus:outline-none focus:ring-2 focus:ring-[#d8ebb7] font-body"
                  />
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#edf0e5] bg-white text-[#7b8470] transition-colors hover:bg-[#f5f8ef]">
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#edf0e5] bg-white text-[#7b8470] transition-colors hover:bg-[#f5f8ef]">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#7fc438]" />
                </button>
                <Avatar className="ml-1 h-11 w-11 rounded-2xl border border-white/30 shadow-[0_20px_36px_-28px_rgba(255,138,0,0.9)]">
                  <AvatarImage src={profile.avatarUrl || undefined} alt={profile.fullName} className="object-cover" />
                  <AvatarFallback className="rounded-2xl bg-[linear-gradient(180deg,#ffb866,#ff8a00)] text-xs font-semibold text-white">
                    {profile.initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto px-4 pb-6 md:px-6 lg:px-8 lg:pb-8">
            <div className="rounded-[36px] border border-white/60 bg-[#fcfcf8]/88 p-5 shadow-[0_36px_80px_-58px_rgba(30,43,14,0.95)] md:p-6 lg:p-8">
              {getSubPage(location.pathname)}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BuyerDashboard;
