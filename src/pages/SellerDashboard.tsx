import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Pencil, ImagePlus, Store, Package, MapPin } from "lucide-react";
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

  const [tab, setTab] = useState<"products" | "profile">("products");

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
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
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
          <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline">
            View marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-full border-2 border-border p-1">
          {(["products", "profile"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-display font-semibold uppercase tracking-tight transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "products" ? "My Products" : "My Profile"}
            </button>
          ))}
        </div>

        {tab === "products" ? (
          <ProductsTab productCats={productCats} onRequireLocation={() => setTab("profile")} />
        ) : (
          <ProfileTab serviceCats={serviceCats} />
        )}
      </main>
    </div>
  );
};

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
      <div className="rounded-none border-2 border-dashed border-border bg-card p-10 text-center">
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
      <form onSubmit={submit} className="space-y-5 rounded-none border-2 border-border bg-card p-6">
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
              <div key={p.id} className="flex items-center gap-4 rounded-none border-2 border-border bg-card p-3">
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
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

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
      });
    }
  }, [vendor]);

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
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-none border-2 border-border bg-card p-6">
      <h2 className="font-display text-lg font-bold">Vendor profile</h2>
      <p className="text-sm text-muted-foreground">
        This is your public storefront — it shows to buyers when they browse your service category.
      </p>
      <ImageUploader imageUrl={form.imageUrl} onFile={setFile} label="Upload profile photo" />
      <input className={inputClass} placeholder="Business / vendor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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

      <p className="pt-1 text-sm font-semibold text-foreground">Contact details</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={inputClass} type="tel" placeholder="Phone (e.g. 0801 234 5678)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={inputClass} type="tel" placeholder="WhatsApp number" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
      </div>
      <input className={inputClass} type="email" placeholder="Contact email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-accent">Profile saved — buyers can now find you.</p> : null}
      <button type="submit" disabled={save.isPending} className="rounded-none bg-primary px-6 py-2.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {save.isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export default SellerDashboard;
