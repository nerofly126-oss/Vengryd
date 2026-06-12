import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Laptop,
  Tv,
  Smartphone,
  Tablet,
  Gamepad2,
  Camera,
  Cpu,
  Home,
  Watch,
  Headphones,
  Scissors,
  Shirt,
  Wrench,
  Utensils,
  Gem,
  Sparkles,
  Leaf,
  Package,
  type LucideIcon,
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

/* Maps the DB `icon` string onto a lucide component. */
const ICON_MAP: Record<string, LucideIcon> = {
  laptop: Laptop,
  tv: Tv,
  smartphone: Smartphone,
  tablet: Tablet,
  gamepad: Gamepad2,
  camera: Camera,
  cpu: Cpu,
  home: Home,
  watch: Watch,
  headphones: Headphones,
  scissors: Scissors,
  shirt: Shirt,
  wrench: Wrench,
  utensils: Utensils,
  gem: Gem,
  sparkles: Sparkles,
  leaf: Leaf,
};

const iconFor = (name: string | null | undefined) => ICON_MAP[name ?? ""] ?? Package;

export type CategoryKind = "product" | "service";

export type Category = {
  id: string;
  label: string;
  icon: LucideIcon;
  kind: CategoryKind;
  count: number;
};

export type Product = {
  id: string;
  name: string;
  categoryId?: string;
  sellerId?: string;
  icon: LucideIcon;
  tint: string;
  imageUrl?: string;
  description?: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  sold?: number;
  stock?: number;
  isFeatured: boolean;
  isHotDeal: boolean;
};

export type Vendor = {
  id: string;
  name: string;
  categoryId?: string;
  sellerId?: string;
  icon: LucideIcon;
  tint: string;
  imageUrl?: string;
  area: string;
  rating: number;
  reviews: number;
  services: string[];
  phone?: string;
  whatsapp?: string;
  email?: string;
};

type CategoryRow = { id: string; label: string; icon: string | null; kind: string | null; product_count: number };
type ProductRow = {
  id: string;
  name: string;
  category_id: string | null;
  seller_id: string | null;
  icon: string | null;
  tint: string | null;
  image_url: string | null;
  description: string | null;
  price: number | string;
  old_price: number | string | null;
  discount: number | null;
  rating: number | string;
  reviews: number;
  sold: number | null;
  stock: number | null;
  is_featured: boolean;
  is_hot_deal: boolean;
};
type VendorRow = {
  id: string;
  name: string;
  category_id: string | null;
  seller_id: string | null;
  icon: string | null;
  tint: string | null;
  image_url: string | null;
  area: string | null;
  rating: number | string;
  reviews: number;
  services: string[] | null;
  phone: string | null;
  whatsapp: string | null;
  contact_email: string | null;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    label: row.label,
    icon: iconFor(row.icon),
    kind: row.kind === "service" ? "service" : "product",
    count: row.product_count,
  };
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id ?? undefined,
    sellerId: row.seller_id ?? undefined,
    icon: iconFor(row.icon),
    tint: row.tint ?? "from-slate-700 to-slate-900",
    imageUrl: row.image_url ?? undefined,
    description: row.description ?? undefined,
    price: Number(row.price),
    oldPrice: row.old_price != null ? Number(row.old_price) : undefined,
    discount: row.discount ?? undefined,
    rating: Number(row.rating),
    reviews: row.reviews,
    sold: row.sold ?? undefined,
    stock: row.stock ?? undefined,
    isFeatured: row.is_featured,
    isHotDeal: row.is_hot_deal,
  };
}

function mapVendor(row: VendorRow): Vendor {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id ?? undefined,
    sellerId: row.seller_id ?? undefined,
    icon: iconFor(row.icon),
    tint: row.tint ?? "from-emerald-700 to-emerald-900",
    imageUrl: row.image_url ?? undefined,
    area: row.area ?? "",
    rating: Number(row.rating),
    reviews: row.reviews,
    services: row.services ?? [],
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.contact_email ?? undefined,
  };
}

/* ---------------- Queries (live Supabase data only) ---------------- */

async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, label, icon, kind, product_count")
    .order("sort", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as CategoryRow[]).map(mapCategory);
}

async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, category_id, seller_id, icon, tint, image_url, description, price, old_price, discount, rating, reviews, sold, stock, is_featured, is_hot_deal",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as ProductRow[]).map(mapProduct);
}

async function fetchVendors(): Promise<Vendor[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, category_id, seller_id, icon, tint, image_url, area, rating, reviews, services, phone, whatsapp, contact_email")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as VendorRow[]).map(mapVendor);
}

export function useVendor(id?: string) {
  return useQuery({
    queryKey: ["vendor", id],
    enabled: !!id,
    queryFn: async (): Promise<Vendor | null> => {
      if (!isSupabaseConfigured() || !id) return null;
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, category_id, seller_id, icon, tint, image_url, area, rating, reviews, services, phone, whatsapp, contact_email")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapVendor(data as VendorRow) : null;
    },
    initialData: null,
  });
}

export function useVendorProducts(sellerId?: string | null) {
  return useQuery({
    queryKey: ["vendor-products", sellerId],
    enabled: !!sellerId,
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured() || !sellerId) return [];
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, category_id, seller_id, icon, tint, image_url, description, price, old_price, discount, rating, reviews, sold, stock, is_featured, is_hot_deal",
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as ProductRow[]).map(mapProduct);
    },
    initialData: [],
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["catalog-categories"], queryFn: fetchCategories, initialData: [] });
}

export function useProducts() {
  return useQuery({ queryKey: ["catalog-products"], queryFn: fetchProducts, initialData: [] });
}

export function useVendors() {
  return useQuery({ queryKey: ["catalog-vendors"], queryFn: fetchVendors, initialData: [] });
}

/* ---------------- Vendor ratings ---------------- */

/** The signed-in buyer's own rating for a vendor (null if none / signed out). */
export function useMyVendorRating(vendorId?: string) {
  return useQuery({
    queryKey: ["vendor-rating-mine", vendorId],
    enabled: !!vendorId,
    queryFn: async (): Promise<number | null> => {
      if (!isSupabaseConfigured() || !vendorId) return null;
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("vendor_ratings")
        .select("rating")
        .eq("vendor_id", vendorId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.rating as number | undefined) ?? null;
    },
    initialData: null,
  });
}

export function useRateVendor(vendorId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rating: number) => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to rate this vendor.");
      if (!vendorId) throw new Error("Missing vendor.");

      // one rating per buyer per vendor: update if it exists, else insert
      const { data: existing, error: findError } = await supabase
        .from("vendor_ratings")
        .select("id")
        .eq("vendor_id", vendorId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (findError) throw findError;

      if (existing) {
        const { error } = await supabase
          .from("vendor_ratings")
          .update({ rating })
          .eq("id", (existing as { id: string }).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vendor_ratings")
          .insert({ vendor_id: vendorId, buyer_id: user.id, rating });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendor", vendorId] });
      void qc.invalidateQueries({ queryKey: ["vendor-rating-mine", vendorId] });
      void qc.invalidateQueries({ queryKey: ["catalog-vendors"] });
    },
  });
}
