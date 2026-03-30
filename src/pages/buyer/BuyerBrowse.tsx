import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, MapPin, Search, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMarketplaceProducts } from "@/lib/dashboard-store";

const feedProducts = [
  { id: "m1", name: "Adire Lounge Set", price: "₦85,000", category: "Clothing", sellerName: "Ibadan Loom House", location: "Ibadan", sales: 29, views: 188 },
  { id: "m2", name: "Bronze Decor Piece", price: "₦132,000", category: "Art", sellerName: "Benin Metal Works", location: "Benin City", sales: 12, views: 94 },
  { id: "m3", name: "Aso Oke Cap", price: "₦27,000", category: "Accessories", sellerName: "Oyo Heritage Studio", location: "Ibadan", sales: 41, views: 211 },
  { id: "m4", name: "Organic Black Soap", price: "₦18,500", category: "Beauty", sellerName: "Abeokuta Naturals", location: "Abeokuta", sales: 64, views: 302 },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function BuyerBrowse() {
  const { data: products = [] } = useMarketplaceProducts();
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");

  const items = [...products, ...feedProducts];
  const locations = Array.from(new Set(items.map((item) => item.location)));
  const categories = Array.from(new Set(items.map((item) => item.category)));
  const vendors = Array.from(new Set(items.map((item) => item.sellerName)));

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = locationFilter === "all" || item.location === locationFilter;
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesVendor = vendorFilter === "all" || item.sellerName === vendorFilter;

    return matchesSearch && matchesLocation && matchesCategory && matchesVendor;
  });

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="rounded-3xl p-6 md:p-8 text-white" style={{ background: "var(--gradient-forest)" }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/70">Buyer Feed</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-wide">Marketplace near you</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80 font-body">
              A denser browse experience inspired by large marketplace feeds, with location and vendor filters built in.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
            <div>
              <p className="text-xs text-white/70">Seller Sync</p>
              <p className="text-sm font-medium">{products.length} live seller listings are visible here now</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products or vendors..."
              className="h-10 w-full rounded-xl border border-border bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="h-10">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="h-10">
              <Store className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((item) => (
          <div key={item.id} className="group rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
            <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-xl bg-secondary/60">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/50 transition-colors group-hover:text-primary" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">{item.category}</span>
              {"isLive" in item ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">Live</span> : null}
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-foreground">{item.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.sellerName}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.location}</span>
              <span>{item.views} views</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-bold text-primary">{item.price}</p>
              <span className="text-xs text-muted-foreground">{item.sales} sold</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
