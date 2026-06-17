import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trash2, Pencil, ImagePlus, Store, Package, MapPin, Coins, ShoppingBag, Boxes, Clock, Share2, Navigation } from "lucide-react";
import { SellerNav } from "@/components/SellerNav";
import { getCurrentCoords, reverseGeocode } from "@/lib/location";
import { useCategories } from "@/lib/catalog";
import {
  useCurrentUser,
  useMyProducts,
  useSaveProduct,
  useDeleteProduct,
  useMyVendor,
  useSaveVendor,
  uploadImage,
  type ProductRow,
} from "@/lib/seller";
import { useSellerOrders, useToggleFulfilled, sellerStats } from "@/lib/orders";
import { useBanks, useMyPayout, useSavePayout } from "@/lib/payout";
import { shareLink } from "@/lib/share";

const inputClass =
  "w-full rounded-none border-2 border-border bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

const emptyProduct = {
  id: undefined as string | undefined,
  name: "",
  categoryId: "",
  description: "",
  price: "",
  oldPrice: "",
  stock: "",
  discount: "",
  isFeatured: false,
  isHotDeal: false,
  imageUrl: "" as string | null | undefined,
};

function ImageUploader({
  imageUrl,
  onFile,
  label,
}: {
  imageUrl?: string | null;
  onFile: (file: File) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? imageUrl ?? null;
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-none border-2 border-border bg-secondary/40">
        {shown ? (
          <img src={shown} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="rounded-none border-2 border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/50"
      >
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setPreview(URL.createObjectURL(file));
            onFile(file);
          }
        }}
      />
    </div>
  );
}

const SellerDashboard = () => {
  const { data: user } = useCurrentUser();
  const { data: categories } = useCategories();
  const productCats = categories.filter((c) => c.kind === "product");
  const serviceCats = categories.filter((c) => c.kind === "service");

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") ?? "overview";
  const tab: SellerTab = (["overview", "orders", "products", "profile"] as const).includes(tabParam as SellerTab)
    ? (tabParam as SellerTab)
    : "overview";
  const setTab = (t: SellerTab) => setSearchParams({ tab: t });

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4 text-center text-foreground">
        <Store className="h-10 w-10 text-primary" />
        <h1 className="font-display text-3xl font-black uppercase tracking-tighter">Sell on vengryd</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sign in to list products and set up your vendor profile. It's free to start — no verification needed yet.
        </p>
        <Link
          to="/auth"
          className="rounded-none bg-primary px-6 py-3 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90"
        >
          Sign in / Join
        </Link>
        <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>{" "}
            <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Seller</span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">
              View marketplace
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6">
        <h1 className="mb-6 font-display text-2xl font-black uppercase tracking-tighter sm:text-3xl">
          {tab === "overview" ? "Overview" : tab === "orders" ? "Orders" : tab === "products" ? "My Products" : "My Profile"}
        </h1>

        {tab === "overview" ? (
          <OverviewTab onSeeOrders={() => setTab("orders")} />
        ) : tab === "orders" ? (
          <OrdersTab />
        ) : tab === "products" ? (
          <ProductsTab productCats={productCats} onRequireLocation={() => setTab("profile")} />
        ) : (
          <ProfileTab serviceCats={serviceCats} />
        )}
      </main>

      <SellerNav />
    </div>
  );
};

type SellerTab = "overview" | "orders" | "products" | "profile";

const naira = (n: number) => `₦${n.toLocaleString()}`;

/* ---------------- Overview tab ---------------- */

function StatCard({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-black tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function OverviewTab({ onSeeOrders }: { onSeeOrders: () => void }) {
  const { data: orders } = useSellerOrders();
  const { data: products } = useMyProducts();
  const { data: vendor } = useMyVendor();
  const stats = sellerStats(orders);
  const profilePath = vendor ? `/vendor/${vendor.slug ?? vendor.id}` : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Coins} label="Revenue" value={naira(stats.revenue)} />
        <StatCard icon={ShoppingBag} label="Orders" value={String(stats.orders)} />
        <StatCard icon={Boxes} label="Units sold" value={String(stats.units)} />
        <StatCard icon={Clock} label="Pending" value={String(stats.pending)} />
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-foreground">How you're doing</h2>
          <button type="button" onClick={onSeeOrders} className="text-sm font-semibold text-primary hover:underline">
            View orders →
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          You have <span className="font-semibold text-foreground">{products.length}</span> product
          {products.length === 1 ? "" : "s"} listed
          {stats.pending > 0 ? (
            <>
              {" "}
              and <span className="font-semibold text-foreground">{stats.pending}</span> item
              {stats.pending === 1 ? "" : "s"} waiting to be fulfilled.
            </>
          ) : (
            <> — all caught up on fulfilment.</>
          )}
        </p>
      </div>

      {profilePath && vendor ? (
        <div className="border-t border-border pt-6">
          <h2 className="font-display text-lg font-bold text-foreground">Share your storefront</h2>
          <p className="mt-1 text-sm text-muted-foreground">Send buyers straight to your public profile.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-none border-2 border-border bg-secondary/30 px-3 py-2.5 text-xs text-muted-foreground">
              {window.location.origin}
              {profilePath}
            </code>
            <button
              type="button"
              onClick={() => shareLink(profilePath, vendor.name)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Orders tab ---------------- */

function OrdersTab() {
  const { data: orders } = useSellerOrders();
  const toggle = useToggleFulfilled();

  if (orders.length === 0) {
    return (
      <div className="rounded-none border-2 border-dashed border-border py-16 text-center">
        <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">No orders yet. They'll show up here once buyers check out.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((o) => (
        <div key={o.id} className="border-b border-border pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
            <div>
              <p className="font-display text-sm font-bold text-foreground">Order #{o.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-base font-bold text-primary">{naira(o.subtotal)}</p>
              {o.status === "cancelled" ? (
                <span className="text-xs font-semibold uppercase text-destructive">Cancelled</span>
              ) : null}
            </div>
          </div>
          <ul className="divide-y divide-border">
            {o.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.quantity} × {naira(it.unitPrice)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle.mutate({ itemId: it.id, fulfilled: !it.fulfilled })}
                  disabled={toggle.isPending || o.status === "cancelled"}
                  className={`shrink-0 border-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-tight transition-colors disabled:opacity-60 ${
                    it.fulfilled
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {it.fulfilled ? "Fulfilled" : "Mark fulfilled"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Products tab ---------------- */

function ProductsTab({
  productCats,
  onRequireLocation,
}: {
  productCats: { id: string; label: string }[];
  onRequireLocation: () => void;
}) {
  const { data: products } = useMyProducts();
  const { data: vendor } = useMyVendor();
  const save = useSaveProduct();
  const del = useDeleteProduct();

  const [form, setForm] = useState({ ...emptyProduct });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setForm({ ...emptyProduct });
    setFile(null);
    setError("");
  };

  const editRow = (p: ProductRow) => {
    setForm({
      id: p.id,
      name: p.name,
      categoryId: p.category_id ?? "",
      description: p.description ?? "",
      price: String(p.price),
      oldPrice: p.old_price != null ? String(p.old_price) : "",
      stock: p.stock != null ? String(p.stock) : "",
      discount: p.discount != null ? String(p.discount) : "",
      isFeatured: p.is_featured,
      isHotDeal: p.is_hot_deal,
      imageUrl: p.image_url,
    });
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.categoryId || !form.price) {
      setError("Name, category and price are required.");
      return;
    }
    try {
      let imageUrl = form.imageUrl ?? null;
      if (file) imageUrl = await uploadImage(file, "products");
      await save.mutateAsync({
        id: form.id,
        name: form.name.trim(),
        categoryId: form.categoryId,
        description: form.description.trim() || null,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        discount: form.discount ? Number(form.discount) : null,
        stock: form.stock ? Number(form.stock) : null,
        imageUrl,
        isFeatured: form.isFeatured,
        isHotDeal: form.isHotDeal,
      });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product.");
    }
  };

  if (!vendor?.area) {
    return (
      <div className="py-16 text-center">
        <MapPin className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-3 font-display text-lg font-bold">Set your location first</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Add your business area in your profile before listing products — buyers find you by location.
        </p>
        <button
          type="button"
          onClick={onRequireLocation}
          className="mt-5 rounded-none bg-primary px-6 py-2.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90"
        >
          Go to profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="space-y-5">
        <h2 className="font-display text-lg font-bold">{form.id ? "Edit product" : "Add a product"}</h2>
        <ImageUploader imageUrl={form.imageUrl} onFile={setFile} label="Upload image" />
        <input className={inputClass} placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea
          className={`${inputClass} min-h-[5rem] resize-y`}
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <select className={inputClass} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Select category</option>
            {productCats.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <input className={inputClass} type="number" min="0" step="0.01" placeholder="Price (₦)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className={inputClass} type="number" min="0" step="0.01" placeholder="Old price (optional)" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} />
          <input className={inputClass} type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <input className={inputClass} type="number" min="0" max="100" placeholder="Discount %" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-[hsl(var(--primary))]" />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isHotDeal} onChange={(e) => setForm({ ...form, isHotDeal: e.target.checked })} className="accent-[hsl(var(--primary))]" />
            Hot deal
          </label>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3">
          <button type="submit" disabled={save.isPending} className="rounded-none bg-primary px-6 py-2.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {save.isPending ? "Saving…" : form.id ? "Update product" : "Add product"}
          </button>
          {form.id ? (
            <button type="button" onClick={reset} className="rounded-none border-2 border-border px-6 py-2.5 text-sm font-semibold hover:border-primary/50">
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div>
        <h2 className="mb-4 font-display text-lg font-bold">Your products ({products.length})</h2>
        {products.length === 0 ? (
          <p className="rounded-none border-2 border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No products yet. Add your first one above.
          </p>
        ) : (
          <div className="grid gap-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 py-2">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-none bg-secondary/40">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-primary">₦{Number(p.price).toLocaleString()}</p>
                </div>
                <button type="button" onClick={() => editRow(p)} className="rounded-none p-2 text-muted-foreground hover:text-primary" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => del.mutate(p.id)} className="rounded-none p-2 text-muted-foreground hover:text-destructive" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Profile tab ---------------- */

function ProfileTab({ serviceCats }: { serviceCats: { id: string; label: string }[] }) {
  const { data: vendor } = useMyVendor();
  const save = useSaveVendor();

  const [form, setForm] = useState({
    id: undefined as string | undefined,
    name: "",
    categoryId: "",
    area: "",
    services: "",
    phone: "",
    whatsapp: "",
    email: "",
    imageUrl: "" as string | null | undefined,
    coverUrl: "" as string | null | undefined,
    tagline: "",
    bio: "",
    instagram: "",
    x: "",
    facebook: "",
    tiktok: "",
    website: "",
    open: "",
    close: "",
    days: [] as number[],
    lat: null as number | null,
    lng: null as number | null,
  });
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);

  const toggleDay = (d: number) =>
    setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));

  useEffect(() => {
    if (vendor) {
      setForm({
        id: vendor.id,
        name: vendor.name,
        categoryId: vendor.category_id ?? "",
        area: vendor.area ?? "",
        services: (vendor.services ?? []).join(", "),
        phone: vendor.phone ?? "",
        whatsapp: vendor.whatsapp ?? "",
        email: vendor.contact_email ?? "",
        imageUrl: vendor.image_url,
        coverUrl: vendor.cover_url,
        tagline: vendor.tagline ?? "",
        bio: vendor.bio ?? "",
        instagram: vendor.socials?.instagram ?? "",
        x: vendor.socials?.x ?? "",
        facebook: vendor.socials?.facebook ?? "",
        tiktok: vendor.socials?.tiktok ?? "",
        website: vendor.socials?.website ?? "",
        open: vendor.hours?.open ?? "",
        close: vendor.hours?.close ?? "",
        days: vendor.hours?.days ?? [],
        lat: vendor.lat ?? null,
        lng: vendor.lng ?? null,
      });
    }
  }, [vendor]);

  const pinLocation = async () => {
    setError("");
    setLocating(true);
    try {
      const c = await getCurrentCoords();
      const place = await reverseGeocode(c);
      // Fill the area name from GPS if the seller hasn't typed one.
      setForm((f) => ({ ...f, lat: c.lat, lng: c.lng, area: f.area.trim() ? f.area : place }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't get your location.");
    } finally {
      setLocating(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!form.name.trim() || !form.categoryId || !form.area.trim()) {
      setError("Business name, service category and area (your location) are required.");
      return;
    }
    try {
      let imageUrl = form.imageUrl ?? null;
      if (file) imageUrl = await uploadImage(file, "profile");
      let coverUrl = form.coverUrl ?? null;
      if (coverFile) coverUrl = await uploadImage(coverFile, "profile");

      const socials: Record<string, string> = {};
      for (const [k, v] of Object.entries({
        instagram: form.instagram,
        x: form.x,
        facebook: form.facebook,
        tiktok: form.tiktok,
        website: form.website,
      })) {
        if (v.trim()) socials[k] = v.trim();
      }
      const hours =
        form.open && form.close && form.days.length
          ? { open: form.open, close: form.close, days: [...form.days].sort((a, b) => a - b) }
          : {};

      await save.mutateAsync({
        id: form.id,
        name: form.name.trim(),
        categoryId: form.categoryId,
        area: form.area.trim(),
        services: form.services.split(",").map((s) => s.trim()).filter(Boolean),
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        imageUrl,
        coverUrl,
        tagline: form.tagline.trim() || null,
        bio: form.bio.trim() || null,
        socials,
        hours,
        lat: form.lat,
        lng: form.lng,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    }
  };

  return (
    <div className="space-y-6">
    <form onSubmit={submit} className="space-y-5">
      <h2 className="font-display text-lg font-bold">Vendor profile</h2>
      <p className="text-sm text-muted-foreground">
        This is your public storefront — it shows to buyers when they browse your service category.
      </p>
      <ImageUploader imageUrl={form.imageUrl} onFile={setFile} label="Upload profile photo" />
      <ImageUploader imageUrl={form.coverUrl} onFile={setCoverFile} label="Upload cover image" />
      <input className={inputClass} placeholder="Business / vendor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={inputClass} placeholder="Tagline (e.g. Photographer | Art Director)" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <select className={inputClass} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Select service category</option>
          {serviceCats.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Area / location — required (e.g. Yaba, Lagos)" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
      </div>
      <input className={inputClass} placeholder="Services (comma separated, e.g. Haircut, Beard trim)" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} />
      <textarea
        className={`${inputClass} min-h-[5rem] resize-y`}
        placeholder="About / bio — tell buyers about your business"
        value={form.bio}
        onChange={(e) => setForm({ ...form, bio: e.target.value })}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={pinLocation}
          disabled={locating}
          className="inline-flex items-center gap-2 rounded-none border-2 border-border px-4 py-2 text-sm font-semibold hover:border-primary/50 disabled:opacity-60"
        >
          <Navigation className="h-4 w-4 text-primary" />
          {locating ? "Locating…" : form.lat != null ? "Update shop location" : "Pin my shop location (GPS)"}
        </button>
        {form.lat != null ? (
          <span className="text-xs font-semibold text-accent">Location pinned ✓</span>
        ) : (
          <span className="text-xs text-muted-foreground">Lets buyers find you by distance</span>
        )}
      </div>

      <div className="space-y-2">
        <p className="pt-1 text-sm font-semibold text-foreground">Business hours</p>
        <div className="flex flex-wrap gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(i)}
              className={`h-9 w-9 rounded-full text-xs font-bold transition-colors ${
                form.days.includes(i) ? "bg-primary text-primary-foreground" : "border-2 border-border text-muted-foreground"
              }`}
            >
              {d[0]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input className={inputClass} type="time" value={form.open} onChange={(e) => setForm({ ...form, open: e.target.value })} />
          <span className="text-sm text-muted-foreground">to</span>
          <input className={inputClass} type="time" value={form.close} onChange={(e) => setForm({ ...form, close: e.target.value })} />
        </div>
      </div>

      <p className="pt-1 text-sm font-semibold text-foreground">Contact details</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={inputClass} type="tel" placeholder="Phone (e.g. 0801 234 5678)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={inputClass} type="email" placeholder="Contact email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>

      <p className="pt-1 text-sm font-semibold text-foreground">Social links</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={inputClass} placeholder="Instagram (@handle or URL)" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        <input className={inputClass} placeholder="X / Twitter" value={form.x} onChange={(e) => setForm({ ...form, x: e.target.value })} />
        <input className={inputClass} placeholder="Facebook" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
        <input className={inputClass} placeholder="TikTok" value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} />
        <input className={inputClass} placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-accent">Profile saved — buyers can now find you.</p> : null}
      <button type="submit" disabled={save.isPending} className="rounded-none bg-primary px-6 py-2.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {save.isPending ? "Saving…" : "Save profile"}
      </button>
    </form>

    {vendor ? (
      <PayoutSection />
    ) : (
      <div className="border-t border-border pt-6 text-sm text-muted-foreground">
        Save your vendor profile first, then you can connect a payout account to start selling.
      </div>
    )}
    </div>
  );
}

/* ---------------- Payouts ---------------- */

function PayoutSection() {
  const { data: payout } = useMyPayout();
  const banks = useBanks(true);
  const save = useSavePayout();
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (payout) {
      setBankCode(payout.bankCode);
      setAccountNumber(payout.accountNumber);
    }
  }, [payout]);

  const connected = !!payout?.subaccountId;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!bankCode || accountNumber.trim().length < 10) {
      setError("Select your bank and enter a valid 10-digit account number.");
      return;
    }
    try {
      await save.mutateAsync({ bankCode, accountNumber: accountNumber.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save payout details.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Payouts</h2>
        {connected ? (
          <span className="bg-primary/15 px-2 py-1 text-xs font-bold uppercase text-primary">Connected</span>
        ) : (
          <span className="text-xs font-semibold uppercase text-muted-foreground">Not set up</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Add your bank account so buyers can pay you. Sales are auto-settled to this account via Flutterwave, minus a
        10% platform fee. Buyers can't purchase your products until this is connected.
      </p>
      {connected && payout?.accountName ? (
        <p className="text-sm text-foreground">
          Paying out to <span className="font-semibold">{payout.accountName}</span> · {payout.accountNumber}
        </p>
      ) : null}

      <select
        className={inputClass}
        value={bankCode}
        onChange={(e) => setBankCode(e.target.value)}
        disabled={banks.isFetching}
      >
        <option value="">{banks.isFetching ? "Loading banks…" : "Select your bank"}</option>
        {banks.data.map((b) => (
          <option key={b.code} value={b.code}>
            {b.name}
          </option>
        ))}
      </select>
      <input
        className={inputClass}
        inputMode="numeric"
        maxLength={10}
        placeholder="Account number (10 digits)"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {save.isSuccess ? <p className="text-sm text-accent">Payout account verified and connected.</p> : null}
      <button
        type="submit"
        disabled={save.isPending}
        className="rounded-none bg-primary px-6 py-2.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {save.isPending ? "Verifying…" : connected ? "Update payout account" : "Connect payout account"}
      </button>
    </form>
  );
}

export default SellerDashboard;
