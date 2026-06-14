import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, MapPin, X, LogOut, Trash2 } from "lucide-react";
import { useCategories, useProducts, useVendors } from "@/lib/catalog";
import { ProductCard, VendorCard } from "@/components/catalog-cards";
import { HotDealsPromo } from "@/components/HotDealsPromo";
import { SearchBox } from "@/components/SearchBox";
import { useCurrentUser, useSignOut, displayName, initials } from "@/lib/auth";
import { useBuyerArea, areaMatches } from "@/lib/location";
import { toast } from "sonner";
import { useCart, useWishlist, cartActions, wishlistActions, type StoreItem } from "@/lib/store";
import { useCreateOrder } from "@/lib/orders";
import { startPayment, verifyPayment, isPaymentsConfigured, type SplitSubaccount } from "@/lib/payments";
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
  const { data: products } = useProducts();
  const { data: vendors } = useVendors();
  const cart = useCart();
  const wishlist = useWishlist();
  const createOrder = useCreateOrder();
  const [paying, setPaying] = useState(false);
  const items = open === "cart" ? cart : wishlist;
  const subtotal = cart.reduce((sum, i) => sum + i.price, 0);

  // One subaccount per distinct vendor in the cart, split by each vendor's subtotal.
  // Returns null if any item's vendor isn't payout-enabled (shouldn't happen — gated at add-to-cart).
  const buildSplit = (): SplitSubaccount[] | null => {
    const bySubaccount = new Map<string, number>();
    for (const item of cart) {
      const product = products.find((p) => p.id === item.id);
      const vendor = product?.sellerId ? vendors.find((v) => v.sellerId === product.sellerId) : null;
      const subId = vendor?.subaccountId;
      if (!subId) return null;
      bySubaccount.set(subId, (bySubaccount.get(subId) ?? 0) + item.price);
    }
    return Array.from(bySubaccount.entries()).map(([id, amount]) => ({
      id,
      transaction_split_ratio: amount,
      transaction_charge_type: "percentage",
      transaction_charge: 0.1,
    }));
  };

  const checkout = async () => {
    if (!user) {
      onClose();
      navigate("/auth");
      return;
    }
    if (!isPaymentsConfigured()) {
      toast.error("Payments aren't configured yet.");
      return;
    }
    const subaccounts = buildSplit();
    if (!subaccounts || subaccounts.length === 0) {
      toast.error("Some items in your cart aren't available for purchase right now.");
      return;
    }
    setPaying(true);
    try {
      const orderId = await createOrder.mutateAsync(cart);
      const payment = await startPayment({
        txRef: orderId,
        amount: subtotal,
        email: user.email ?? "",
        name: displayName(user),
        subaccounts,
      });
      if (!payment) {
        toast("Payment cancelled — your order is saved as unpaid.");
        return;
      }
      const paid = await verifyPayment(orderId, payment.transaction_id ?? "");
      if (paid) {
        cartActions.clear();
        toast.success("Payment successful — your order is in!");
        onClose();
        navigate("/orders");
      } else {
        toast.error("We couldn't confirm your payment. Check My Orders or try again.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setPaying(false);
    }
  };

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
                  onClick={checkout}
                  disabled={paying}
                  className="w-full bg-primary py-3 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {!user ? "Sign in to checkout" : paying ? "Processing…" : `Pay ₦${subtotal.toLocaleString()}`}
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
  const isBrowsing = q.length > 0;
  const matches = (text: string) => !q || text.toLowerCase().includes(q);
  // So searching a category name (e.g. "gadgets", "barbers") surfaces that category.
  const catLabel = (id?: string) => categories.find((c) => c.id === id)?.label ?? "";

  const resultProducts = products.filter((p) => matches(p.name) || matches(catLabel(p.categoryId)));
  const resultVendors = vendors.filter(
    (v) =>
      areaMatches(v.area, area) &&
      (matches(v.name) || v.services.some(matches) || matches(catLabel(v.categoryId))),
  );

  const nearbyVendors = vendors.filter((v) => areaMatches(v.area, area));

  const hotDeals = products.filter((p) => p.isHotDeal);
  // Hot-deal products live in the Hot Deals section only — keep them out of the marketplace grid.
  const featured = products.filter((p) => p.isFeatured && !p.isHotDeal);
  const isLoading = productsLoading || vendorsLoading;

  const clearBrowse = () => {
    setQuery("");
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

          <form onSubmit={(e) => e.preventDefault()} className="hidden flex-1 items-center md:flex">
            <SearchBox
              products={products}
              vendors={vendors}
              value={query}
              onChange={setQuery}
              placeholder="Search products, barbers, stylists, vendors..."
              showButton
            />
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
                    <Link to="/orders" onClick={() => setMenuOpen(false)} className="block rounded-none px-3 py-2 text-sm text-foreground hover:bg-secondary">
                      My Orders
                    </Link>
                    <Link to="/messages" onClick={() => setMenuOpen(false)} className="block rounded-none px-3 py-2 text-sm text-foreground hover:bg-secondary">
                      Messages
                    </Link>
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
          <SearchBox products={products} vendors={vendors} value={query} onChange={setQuery} />
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

        {/* Hot Deals promo — leads the dashboard, full-bleed */}
        {!isBrowsing && hotDeals.length > 0 ? (
          <div className="-mx-4 sm:-mx-6">
            <HotDealsPromo deals={hotDeals} />
          </div>
        ) : null}

        {isBrowsing ? (
          /* ---------------- Browse / search results ---------------- */
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">
                {`Results for “${query}”`}
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
