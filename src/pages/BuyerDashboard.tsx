import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, ShoppingCart, MapPin, X, LogOut, Trash2 } from "lucide-react";
import { useCategories, useProducts, useVendors } from "@/lib/catalog";
import { ProductCard, VendorCard } from "@/components/catalog-cards";
import { useCurrentUser, useSignOut, displayName, initials } from "@/lib/auth";
import { useBuyerArea, areaMatches } from "@/lib/location";
import { useCart, useWishlist, cartActions, wishlistActions, type StoreItem } from "@/lib/store";
import { LoadingOverlay } from "@/components/LoadingOverlay";

function CartDrawer({
  open,
  onClose,
}: {
  open: "cart" | "wishlist" | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const cart = useCart();
  const wishlist = useWishlist();
  const items = open === "cart" ? cart : wishlist;
  const subtotal = cart.reduce((sum, i) => sum + i.price, 0);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l-2 border-border bg-card"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
                {open === "cart" ? `Cart (${cart.length})` : `Favourites (${wishlist.length})`}
              </h2>
              <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {open === "cart" ? "Your cart is empty." : "No favourites yet."}
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((it: StoreItem) => (
                    <li key={it.id} className="flex items-center gap-3 border-2 border-border bg-background/40 p-2">
                      <div className="h-14 w-14 shrink-0 overflow-hidden bg-secondary">
                        {it.imageUrl ? (
                          <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className={`h-full w-full bg-gradient-to-br ${it.tint}`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                        <p className="text-xs font-bold text-primary">₦{it.price.toLocaleString()}</p>
                      </div>
                      {open === "wishlist" ? (
                        <button
                          type="button"
                          onClick={() => cartActions.add(it)}
                          className="bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          Add
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => (open === "cart" ? cartActions.remove(it.id) : wishlistActions.remove(it.id))}
                        className="p-2 text-muted-foreground hover:text-destructive"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {open === "cart" && cart.length > 0 ? (
              <div className="border-t border-border p-5">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-display text-lg font-bold text-foreground">₦{subtotal.toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (!user) navigate("/auth");
                  }}
                  className="w-full bg-primary py-3 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90"
                >
                  {user ? "Checkout (coming soon)" : "Sign in to checkout"}
                </button>
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const BuyerDashboard = () => {
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: user } = useCurrentUser();
  const signOut = useSignOut();
  const name = displayName(user);

  const [area, setArea] = useBuyerArea();
  const [locOpen, setLocOpen] = useState(false);
  const [areaInput, setAreaInput] = useState(area);

  const cart = useCart();
  const wishlist = useWishlist();
  const [drawer, setDrawer] = useState<"cart" | "wishlist" | null>(null);

  const { data: categories, isFetching: catFetching } = useCategories();
  const { data: products, isLoading: productsLoading, isFetching: prodFetching } = useProducts();
  const { data: vendors, isLoading: vendorsLoading, isFetching: venFetching } = useVendors();

  const [dataReady, setDataReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    if (!catFetching && !prodFetching && !venFetching) setDataReady(true);
  }, [catFetching, prodFetching, venFetching]);
  useEffect(() => {
    const t = window.setTimeout(() => setMinElapsed(true), 800);
    return () => window.clearTimeout(t);
  }, []);
  // Show the loader until data has settled AND a minimum time has passed
  // (so it's always visible briefly, even when Supabase resolves instantly).
  const showLoader = !dataReady || !minElapsed;

  const q = query.trim().toLowerCase();
  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? null;
  const isBrowsing = activeCategoryId !== null || q.length > 0;
  const matches = (text: string) => !q || text.toLowerCase().includes(q);

  const showProducts = !activeCategory || activeCategory.kind === "product";
  const showVendors = !activeCategory || activeCategory.kind === "service";

  const resultProducts = showProducts
    ? products.filter((p) => (!activeCategoryId || p.categoryId === activeCategoryId) && matches(p.name))
    : [];
  const resultVendors = showVendors
    ? vendors.filter(
        (v) =>
          (!activeCategoryId || v.categoryId === activeCategoryId) &&
          areaMatches(v.area, area) &&
          (matches(v.name) || v.services.some(matches)),
      )
    : [];

  const nearbyVendors = vendors.filter((v) => areaMatches(v.area, area));

  const hotDeals = products.filter((p) => p.isHotDeal);
  const featured = products.filter((p) => p.isFeatured);
  const isLoading = productsLoading || vendorsLoading;

  const clearBrowse = () => {
    setQuery("");
    setActiveCategoryId(null);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {showLoader ? <LoadingOverlay /> : null}
      <CartDrawer open={drawer} onClose={() => setDrawer(null)} />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>
          </Link>

          <div className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => {
                setAreaInput(area);
                setLocOpen((o) => !o);
              }}
              className="flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
            >
              <MapPin className="h-4 w-4 text-primary" />
              {area ? <span className="max-w-[10rem] truncate text-foreground">{area}</span> : "Set your area"}
            </button>
            {locOpen ? (
              <div className="absolute left-0 z-50 mt-2 w-64 rounded-none border-2 border-border bg-card p-3 shadow-[var(--shadow-card)]">
                <p className="mb-2 text-xs text-muted-foreground">Show vendors in your area</p>
                <input
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="e.g. Yaba, Lagos"
                  className="w-full rounded-none border-2 border-border bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setArea(areaInput);
                      setLocOpen(false);
                    }}
                    className="flex-1 rounded-none bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Save
                  </button>
                  {area ? (
                    <button
                      type="button"
                      onClick={() => {
                        setArea("");
                        setAreaInput("");
                        setLocOpen(false);
                      }}
                      className="rounded-none border-2 border-border px-3 text-sm hover:border-primary/50"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="hidden flex-1 items-center md:flex"
          >
            <div className="flex w-full items-center rounded-none border-2 border-border bg-secondary/40 focus-within:border-primary">
              <Search className="ml-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, barbers, stylists, vendors..."
                className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} className="px-2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="submit"
                className="m-1 rounded-none bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Search
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-4 text-muted-foreground">
            <button type="button" onClick={() => setDrawer("wishlist")} className="relative hover:text-foreground" aria-label="Favourites">
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {wishlist.length}
                </span>
              ) : null}
            </button>
            <button type="button" onClick={() => setDrawer("cart")} className="relative hover:text-foreground" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cart.length}
                </span>
              ) : null}
            </button>

            {user ? (
              <div className="relative">
                <button type="button" onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 hover:text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {initials(name)}
                  </span>
                  <span className="hidden max-w-[8rem] truncate text-sm text-foreground lg:inline">{name}</span>
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-none border-2 border-border bg-card p-1 shadow-[var(--shadow-card)]">
                    <Link to="/seller" onClick={() => setMenuOpen(false)} className="block rounded-none px-3 py-2 text-sm text-foreground hover:bg-secondary">
                      Sell on vengryd
                    </Link>
                    <Link to="/settings" onClick={() => setMenuOpen(false)} className="block rounded-none px-3 py-2 text-sm text-foreground hover:bg-secondary">
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        signOut.mutate();
                      }}
                      className="flex w-full items-center gap-2 rounded-none px-3 py-2 text-left text-sm text-destructive hover:bg-secondary"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link to="/auth" className="rounded-none bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search + location */}
        <div className="px-4 pb-3 md:hidden">
          <div className="flex items-center rounded-none border-2 border-border bg-secondary/40 focus-within:border-primary">
            <Search className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, vendors..."
              className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setAreaInput(area);
              setLocOpen((o) => !o);
            }}
            className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"
          >
            <MapPin className="h-4 w-4 text-primary" />
            {area ? <span className="text-foreground">{area}</span> : "Set your area"}
          </button>
          {locOpen ? (
            <div className="mt-2 rounded-none border-2 border-border bg-card p-3">
              <input
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                placeholder="e.g. Yaba, Lagos"
                className="w-full rounded-none border-2 border-border bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setArea(areaInput);
                    setLocOpen(false);
                  }}
                  className="flex-1 rounded-none bg-primary py-2 text-sm font-semibold text-primary-foreground"
                >
                  Save
                </button>
                {area ? (
                  <button
                    type="button"
                    onClick={() => {
                      setArea("");
                      setAreaInput("");
                      setLocOpen(false);
                    }}
                    className="rounded-none border-2 border-border px-3 text-sm"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        {/* Hero heading (home only) — sits directly on the page */}
        {!isBrowsing ? (
          <section>
            <span className="eyebrow-kicker mb-4">Your community</span>
            <h2 className="font-display text-3xl font-black uppercase leading-[0.9] tracking-tighter text-foreground sm:text-5xl">
              Find local
              <br />
              vendors <span className="text-primary">&amp;</span> products
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Barbers, stylists, gadgets and more — near you.
            </p>
          </section>
        ) : null}

        {/* Category bar — click to filter */}
        {categories.length > 0 ? (
          <section className="grid grid-cols-3 gap-4 rounded-none border-2 border-border bg-card p-6 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => {
              const active = cat.id === activeCategoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(active ? null : cat.id)}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary/60 group-hover:bg-primary/15"
                    }`}
                  >
                    <cat.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                  </span>
                  <span className={`text-xs font-semibold ${active ? "text-primary" : "text-foreground"}`}>{cat.label}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{cat.kind}</span>
                </button>
              );
            })}
          </section>
        ) : null}

        {isBrowsing ? (
          /* ---------------- Browse / search results ---------------- */
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">
                {activeCategory ? activeCategory.label : `Results for “${query}”`}
              </h2>
              <button
                type="button"
                onClick={clearBrowse}
                className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <X className="h-4 w-4" /> Clear
              </button>
            </div>

            {isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
            ) : resultVendors.length === 0 && resultProducts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No results found. Try another category or search.</p>
            ) : (
              <>
                {resultVendors.length > 0 ? (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vendors & services</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {resultVendors.map((v) => (
                        <VendorCard key={v.id} vendor={v} />
                      ))}
                    </div>
                  </div>
                ) : null}
                {resultProducts.length > 0 ? (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Products</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                      {resultProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : (
          /* ---------------- Default storefront ---------------- */
          <>
            {hotDeals.length > 0 ? (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-foreground">
                  <span className="rounded bg-primary/15 px-2 py-1 text-xs font-bold uppercase text-primary">Hot Deals</span>
                  Best prices right now
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {hotDeals.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="mb-5 font-display text-xl font-bold text-foreground">View Marketplace</h2>
              {isLoading ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Loading products…</p>
              ) : featured.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {featured.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No featured products yet.</p>
              )}
            </section>

            {/* Vendors near you */}
            <section className="rounded-none border-2 border-border bg-card p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Vendors {area ? `in ${area}` : "near you"}
                </h2>
                {!area ? (
                  <span className="text-xs text-muted-foreground">Set your area to see local vendors</span>
                ) : null}
              </div>
              {isLoading ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Loading vendors…</p>
              ) : nearbyVendors.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {nearbyVendors.slice(0, 8).map((v) => (
                    <VendorCard key={v.id} vendor={v} />
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No vendors {area ? `in ${area}` : ""} yet.
                </p>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} vengryd. Be part of something local.
      </footer>
    </div>
  );
};

export default BuyerDashboard;
