// Seller workspace data layer: image uploads to Supabase storage plus hooks to manage the seller's own products and single vendor profile (RLS-scoped to the user).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export { useCurrentUser } from "@/lib/auth";

const BUCKET = "catalog-images";

export type SellerProduct = {
  id?: string;
  name: string;
  categoryId: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  discount?: number | null;
  stock?: number | null;
  imageUrl?: string | null;
  isFeatured: boolean;
  isHotDeal: boolean;
};

export type SellerVendor = {
  id?: string;
  name: string;
  categoryId: string;
  area: string;
  services: string[];
  imageUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  lat?: number | null;
  lng?: number | null;
  coverUrl?: string | null;
  bio?: string | null;
  tagline?: string | null;
  socials?: Record<string, string>;
  hours?: { open?: string; close?: string; days?: number[] };
};

export type ProductRow = {
  id: string;
  name: string;
  category_id: string | null;
  image_url: string | null;
  description: string | null;
  price: number | string;
  old_price: number | string | null;
  discount: number | null;
  stock: number | null;
  is_featured: boolean;
  is_hot_deal: boolean;
};

export type VendorRow = {
  id: string;
  slug: string | null;
  name: string;
  category_id: string | null;
  image_url: string | null;
  area: string | null;
  services: string[] | null;
  phone: string | null;
  whatsapp: string | null;
  contact_email: string | null;
  lat: number | null;
  lng: number | null;
  cover_url: string | null;
  bio: string | null;
  tagline: string | null;
  verified: boolean | null;
  socials: Record<string, string> | null;
  hours: { open?: string; close?: string; days?: number[] } | null;
};

// Returns the signed-in Supabase user or throws — used to gate all seller writes.
async function requireUser(): Promise<User> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("You need to be signed in to sell.");
  return user;
}

/**
 * Validates (image only, <=5MB) and uploads a file to the catalog-images bucket under the user's folder.
 * Returns the public URL. Requires auth.
 */
export async function uploadImage(file: File, folder: "products" | "profile"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5MB or smaller.");

  const supabase = getSupabaseClient();
  const user = await requireUser();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

/* ---------------- Products ---------------- */

/** The signed-in seller's own products, newest first (RLS-scoped to their seller_id). */
export function useMyProducts() {
  return useQuery({
    queryKey: ["my-products"],
    queryFn: async (): Promise<ProductRow[]> => {
      if (!isSupabaseConfigured()) return [];
      const supabase = getSupabaseClient();
      const user = await requireUser();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category_id, image_url, description, price, old_price, discount, stock, is_featured, is_hot_deal")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
    initialData: [],
  });
}

/** Creates or updates (upsert on id) a product for the current seller; invalidates the seller's and public product caches. */
export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SellerProduct) => {
      const supabase = getSupabaseClient();
      const user = await requireUser();
      const row: Record<string, unknown> = {
        seller_id: user.id,
        name: input.name,
        category_id: input.categoryId,
        description: input.description ?? null,
        price: input.price,
        old_price: input.oldPrice ?? null,
        discount: input.discount ?? null,
        stock: input.stock ?? null,
        image_url: input.imageUrl ?? null,
        is_featured: input.isFeatured,
        is_hot_deal: input.isHotDeal,
      };
      if (input.id) row.id = input.id;
      const { error } = await supabase.from("products").upsert(row, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-products"] });
      void qc.invalidateQueries({ queryKey: ["catalog-products"] });
    },
  });
}

/** Deletes a product by id; invalidates the seller's and public product caches. */
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-products"] });
      void qc.invalidateQueries({ queryKey: ["catalog-products"] });
    },
  });
}

/* ---------------- Vendor profile (one per seller) ---------------- */

/** The current seller's single vendor profile, or null if they haven't created one. */
export function useMyVendor() {
  return useQuery({
    queryKey: ["my-vendor"],
    queryFn: async (): Promise<VendorRow | null> => {
      if (!isSupabaseConfigured()) return null;
      const supabase = getSupabaseClient();
      const user = await requireUser();
      const { data, error } = await supabase
        .from("vendors")
        .select("id, slug, name, category_id, image_url, area, services, phone, whatsapp, contact_email, lat, lng, cover_url, bio, tagline, verified, socials, hours")
        .eq("seller_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as VendorRow | null) ?? null;
    },
    initialData: null,
  });
}

/** Saves the seller's vendor profile (one per seller: updates if present, else inserts); invalidates vendor caches. */
export function useSaveVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SellerVendor) => {
      const supabase = getSupabaseClient();
      const user = await requireUser();
      const row = {
        seller_id: user.id,
        name: input.name,
        category_id: input.categoryId,
        area: input.area,
        services: input.services,
        image_url: input.imageUrl ?? null,
        phone: input.phone ?? null,
        whatsapp: input.whatsapp ?? null,
        contact_email: input.email ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        cover_url: input.coverUrl ?? null,
        bio: input.bio ?? null,
        tagline: input.tagline ?? null,
        socials: input.socials ?? {},
        hours: input.hours ?? {},
      };

      // One vendor profile per seller: update if it exists, otherwise insert.
      const { data: existing, error: findError } = await supabase
        .from("vendors")
        .select("id")
        .eq("seller_id", user.id)
        .maybeSingle();
      if (findError) throw findError;

      if (existing) {
        const { error } = await supabase.from("vendors").update(row).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vendors").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-vendor"] });
      void qc.invalidateQueries({ queryKey: ["my-profile"] });
      void qc.invalidateQueries({ queryKey: ["catalog-vendors"] });
    },
  });
}
