import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { ensureProfile, getBusinessName, getFullName, getInitials, getRoleFromUser } from "@/lib/profile";
import { uploadProfileAsset } from "@/lib/profile-assets";

export type BuyerOrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface BuyerOrder {
  id: string;
  item: string;
  seller: string;
  status: BuyerOrderStatus;
  date: string;
  amount: string;
  tracking?: string;
}

export interface BuyerWishlistItem {
  id: string;
  name: string;
  price: string;
  seller: string;
  category: string;
  added: string;
}

export interface ActivityItem {
  name: string;
  action: string;
  time: string;
}

export interface SellerProduct {
  id: string;
  name: string;
  price: string;
  category: string;
  sellerName: string;
  location: string;
  stock: number;
  sales: number;
  views: number;
  status: "Active" | "Draft" | "Out of Stock";
}

export type SellerPlan = "Free" | "Pro";
export type SellerPaymentMethod = "Bank Transfer" | "Cash on Delivery" | "Card" | "USSD";

export interface SellerPaymentSettings {
  plan: SellerPlan;
  verificationStatus: "Unverified" | "Verified";
  enabledMethods: SellerPaymentMethod[];
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  price: string;
  category: string;
  sellerName: string;
  location: string;
  sales: number;
  views: number;
  isLive: true;
}

export interface DashboardProfile {
  fullName: string;
  businessName: string | null;
  avatarUrl: string | null;
  logoUrl: string | null;
  initials: string;
  role: "buyer" | "seller";
}

type DashboardStore = {
  profile: DashboardProfile;
  buyer: {
    orders: BuyerOrder[];
    wishlist: BuyerWishlistItem[];
    activity: ActivityItem[];
  };
  seller: {
    products: SellerProduct[];
    activity: ActivityItem[];
    topSellers: { name: string; sales: string; rating: string }[];
    featuredSellers: { name: string; sales: string; rating: string }[];
    paymentSettings: SellerPaymentSettings;
  };
};

type ProfileRow = {
  id: string;
  role: "buyer" | "seller";
  full_name: string | null;
  business_name: string | null;
  username: string | null;
  location: string | null;
  avatar_url: string | null;
  logo_url: string | null;
};

type ProductRow = {
  id: string;
  seller_id: string;
  name: string;
  price: number | string;
  category: string;
  location: string | null;
  stock: number;
  sales: number;
  views: number;
  status: SellerProduct["status"];
  created_at?: string;
};

type OrderRow = {
  id: string;
  item_name: string;
  seller_name: string;
  status: BuyerOrderStatus;
  amount: number | string;
  tracking: string | null;
  ordered_at: string;
};

type WishlistRow = {
  id: string;
  product_name: string;
  seller_name: string;
  price: number | string;
  category: string;
  created_at: string;
};

type ActivityRow = {
  id: string;
  name: string;
  action: string;
  created_at: string;
};

type PaymentSettingsRow = {
  seller_id: string;
  plan: SellerPlan;
  verification_status: SellerPaymentSettings["verificationStatus"];
  enabled_methods: SellerPaymentMethod[];
  bank_name: string;
  account_name: string;
  account_number: string;
};

const DASHBOARD_QUERY_KEY = ["dashboard-store"];
const MARKETPLACE_PRODUCTS_QUERY_KEY = ["marketplace-products"];

const defaultPaymentSettings: SellerPaymentSettings = {
  plan: "Free",
  verificationStatus: "Verified",
  enabledMethods: ["Bank Transfer"],
  bankName: "GTBank",
  accountName: "Vengryd Crafts Ltd",
  accountNumber: "0123456789",
};

const defaultBuyerOrders: OrderRow[] = [
  {
    id: "seed-order-1",
    item_name: "Handwoven Kente Cloth",
    seller_name: "Accra Designs",
    status: "Shipped",
    ordered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 145000,
    tracking: "TRK-9823-AF",
  },
  {
    id: "seed-order-2",
    item_name: "Wooden Carved Mask",
    seller_name: "Lagos Crafts",
    status: "Delivered",
    ordered_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 89000,
    tracking: "TRK-9801-AF",
  },
  {
    id: "seed-order-3",
    item_name: "Beaded Necklace Set",
    seller_name: "Nairobi Style",
    status: "Processing",
    ordered_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 62000,
    tracking: null,
  },
];

const defaultBuyerWishlist: WishlistRow[] = [
  {
    id: "seed-wishlist-1",
    product_name: "African Print Tote Bag",
    seller_name: "Accra Designs",
    price: 45000,
    category: "Accessories",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-wishlist-2",
    product_name: "Carved Wooden Bowl",
    seller_name: "Lagos Crafts",
    price: 68000,
    category: "Home Decor",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-wishlist-3",
    product_name: "Ankara Dress Set",
    seller_name: "Nairobi Style",
    price: 120000,
    category: "Clothing",
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const defaultBuyerActivity: Omit<ActivityRow, "id">[] = [
  { name: "Handwoven Basket", action: "Added to wishlist", created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
  { name: "Shea Butter Set", action: "Order delivered", created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { name: "Kente Cloth", action: "Order shipped", created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
  { name: "Carved Mask", action: "Left a review", created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
];

const defaultSellerProducts: Omit<ProductRow, "seller_id">[] = [
  { id: "seed-product-1", name: "Handwoven Kente Cloth", price: 145, category: "Textiles", location: "Lagos", stock: 12, sales: 48, views: 320, status: "Active" },
  { id: "seed-product-2", name: "Carved Wooden Mask", price: 89, category: "Art", location: "Lagos", stock: 8, sales: 32, views: 215, status: "Active" },
  { id: "seed-product-3", name: "Beaded Necklace Set", price: 62, category: "Jewelry", location: "Lagos", stock: 25, sales: 67, views: 480, status: "Active" },
  { id: "seed-product-4", name: "Shea Butter Collection", price: 38, category: "Beauty", location: "Lagos", stock: 0, sales: 120, views: 890, status: "Out of Stock" },
  { id: "seed-product-5", name: "Ankara Fabric Roll", price: 55, category: "Textiles", location: "Lagos", stock: 30, sales: 15, views: 110, status: "Active" },
  { id: "seed-product-6", name: "Leather Drum Bag", price: 98, category: "Accessories", location: "Lagos", stock: 5, sales: 8, views: 75, status: "Draft" },
];

const defaultSellerActivity: Omit<ActivityRow, "id">[] = [
  { name: "Kente Cloth", action: "New order received", created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
  { name: "Wooden Bowl", action: "Product viewed 50 times", created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { name: "Shea Butter Set", action: "5-star review received", created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
  { name: "Beaded Earrings", action: "Stock running low", created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
];

const emptyStore: DashboardStore = {
  profile: {
    fullName: "",
    businessName: null,
    avatarUrl: null,
    logoUrl: null,
    initials: "U",
    role: "buyer",
  },
  buyer: {
    orders: [],
    wishlist: [],
    activity: [],
  },
  seller: {
    products: [],
    activity: [],
    topSellers: [],
    featuredSellers: [],
    paymentSettings: defaultPaymentSettings,
  },
};

function formatCurrency(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  return `₦${Number.isFinite(amount) ? amount.toLocaleString() : 0}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatRelativeTime(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  const relativeTimeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormat.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormat.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormat.format(diffDays, "day");
}

function getSellerDisplayName(profile?: Pick<ProfileRow, "business_name" | "full_name"> | null) {
  return profile?.business_name || profile?.full_name || "Marketplace Seller";
}

function getDefaultPaymentSettings(user: User): PaymentSettingsRow {
  return {
    seller_id: user.id,
    plan: defaultPaymentSettings.plan,
    verification_status: defaultPaymentSettings.verificationStatus,
    enabled_methods: defaultPaymentSettings.enabledMethods,
    bank_name: defaultPaymentSettings.bankName,
    account_name: getBusinessName(user),
    account_number: defaultPaymentSettings.accountNumber,
  };
}

async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

async function ensureBuyerSeed(user: User) {
  const supabase = getSupabaseClient();

  const { data: existingOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_id", user.id)
    .limit(1);

  if (ordersError) throw ordersError;

  if (!existingOrders || existingOrders.length === 0) {
    const { error } = await supabase.from("orders").insert(
      defaultBuyerOrders.map((order, index) => ({
        ...order,
        id: `${user.id}-order-${index + 1}`,
        buyer_id: user.id,
        seller_id: null,
        product_id: null,
      })),
    );

    if (error) throw error;
  }

  const { data: existingWishlist, error: wishlistError } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("buyer_id", user.id)
    .limit(1);

  if (wishlistError) throw wishlistError;

  if (!existingWishlist || existingWishlist.length === 0) {
    const { error } = await supabase.from("wishlist_items").insert(
      defaultBuyerWishlist.map((item, index) => ({
        ...item,
        id: `${user.id}-wishlist-${index + 1}`,
        buyer_id: user.id,
        product_id: null,
      })),
    );

    if (error) throw error;
  }

  const { data: existingActivity, error: activityError } = await supabase
    .from("buyer_activity_log")
    .select("id")
    .eq("buyer_id", user.id)
    .limit(1);

  if (activityError) throw activityError;

  if (!existingActivity || existingActivity.length === 0) {
    const { error } = await supabase.from("buyer_activity_log").insert(
      defaultBuyerActivity.map((item, index) => ({
        ...item,
        id: `${user.id}-buyer-activity-${index + 1}`,
        buyer_id: user.id,
      })),
    );

    if (error) throw error;
  }
}

async function ensureSellerSeed(user: User) {
  const supabase = getSupabaseClient();
  const businessName = getBusinessName(user);

  const { data: existingPaymentSettings, error: paymentError } = await supabase
    .from("seller_payment_settings")
    .select("seller_id")
    .eq("seller_id", user.id)
    .maybeSingle();

  if (paymentError) throw paymentError;

  if (!existingPaymentSettings) {
    const { error } = await supabase.from("seller_payment_settings").insert({
      ...getDefaultPaymentSettings(user),
      account_name: businessName,
    });

    if (error) throw error;
  }

  const { data: existingProducts, error: productsError } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", user.id)
    .limit(1);

  if (productsError) throw productsError;

  if (!existingProducts || existingProducts.length === 0) {
    const { error } = await supabase.from("products").insert(
      defaultSellerProducts.map((product, index) => ({
        ...product,
        id: `${user.id}-product-${index + 1}`,
        seller_id: user.id,
        price: Number(product.price),
      })),
    );

    if (error) throw error;
  }

  const { data: existingActivity, error: activityError } = await supabase
    .from("seller_activity_log")
    .select("id")
    .eq("seller_id", user.id)
    .limit(1);

  if (activityError) throw activityError;

  if (!existingActivity || existingActivity.length === 0) {
    const { error } = await supabase.from("seller_activity_log").insert(
      defaultSellerActivity.map((item, index) => ({
        ...item,
        id: `${user.id}-seller-activity-${index + 1}`,
        seller_id: user.id,
      })),
    );

    if (error) throw error;
  }
}

async function ensureMarketplaceSeed(user: User) {
  await ensureProfile(user);

  if (getRoleFromUser(user) === "seller") {
    await ensureSellerSeed(user);
  } else {
    await ensureBuyerSeed(user);
  }
}

function buildSellerRankings(products: ProductRow[], profiles: ProfileRow[]) {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const aggregateMap = new Map<
    string,
    { sellerId: string; name: string; sales: number; views: number; rating: number }
  >();

  for (const product of products) {
    const existing = aggregateMap.get(product.seller_id);
    const profile = profileMap.get(product.seller_id);
    const name = getSellerDisplayName(profile);
    const ratingBase = 4.5 + Math.min(product.sales / 200, 0.4);

    if (existing) {
      existing.sales += product.sales;
      existing.views += product.views;
      existing.rating = Math.max(existing.rating, ratingBase);
    } else {
      aggregateMap.set(product.seller_id, {
        sellerId: product.seller_id,
        name,
        sales: product.sales,
        views: product.views,
        rating: ratingBase,
      });
    }
  }

  const ranked = Array.from(aggregateMap.values()).sort((left, right) => right.sales - left.sales);

  return {
    topSellers: ranked.slice(0, 2).map((seller) => ({
      name: seller.name,
      sales: seller.sales.toLocaleString(),
      rating: seller.rating.toFixed(1),
    })),
    featuredSellers: ranked
      .slice(2, 4)
      .concat(ranked.slice(0, Math.max(0, 2 - ranked.slice(2, 4).length)))
      .slice(0, 2)
      .map((seller) => ({
        name: seller.name,
        sales: seller.sales.toLocaleString(),
        rating: seller.rating.toFixed(1),
      })),
  };
}

async function fetchDashboardStore(): Promise<DashboardStore> {
  const user = await getCurrentUser();

  if (!user) {
    return emptyStore;
  }

  await ensureMarketplaceSeed(user);

  const supabase = getSupabaseClient();
  const [profileResult, ordersResult, wishlistResult, buyerActivityResult, productsResult, sellerActivityResult, paymentResult, allProductsResult, allProfilesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, full_name, business_name, username, location, avatar_url, logo_url")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("orders")
        .select("id, item_name, seller_name, status, amount, tracking, ordered_at")
        .eq("buyer_id", user.id)
        .order("ordered_at", { ascending: false }),
      supabase
        .from("wishlist_items")
        .select("id, product_name, seller_name, price, category, created_at")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("buyer_activity_log")
        .select("id, name, action, created_at")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("products")
        .select("id, seller_id, name, price, category, location, stock, sales, views, status, created_at")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("seller_activity_log")
        .select("id, name, action, created_at")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("seller_payment_settings")
        .select("seller_id, plan, verification_status, enabled_methods, bank_name, account_name, account_number")
        .eq("seller_id", user.id)
        .maybeSingle(),
      supabase
        .from("products")
        .select("id, seller_id, name, price, category, location, stock, sales, views, status, created_at")
        .order("sales", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, role, full_name, business_name, username, location, avatar_url, logo_url")
        .eq("role", "seller"),
    ]);

  if (profileResult.error) throw profileResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (wishlistResult.error) throw wishlistResult.error;
  if (buyerActivityResult.error) throw buyerActivityResult.error;
  if (productsResult.error) throw productsResult.error;
  if (sellerActivityResult.error) throw sellerActivityResult.error;
  if (paymentResult.error) throw paymentResult.error;
  if (allProductsResult.error) throw allProductsResult.error;
  if (allProfilesResult.error) throw allProfilesResult.error;

  const sellerProfiles = (allProfilesResult.data ?? []) as ProfileRow[];
  const { topSellers, featuredSellers } = buildSellerRankings(
    (allProductsResult.data ?? []) as ProductRow[],
    sellerProfiles,
  );

  const currentProfile = profileResult.data as ProfileRow | null;
  const currentFullName = currentProfile?.full_name || getFullName(user);
  const currentBusinessName = currentProfile?.business_name || (getRoleFromUser(user) === "seller" ? getBusinessName(user) : null);

  return {
    profile: {
      fullName: currentFullName,
      businessName: currentBusinessName,
      avatarUrl: currentProfile?.avatar_url ?? null,
      logoUrl: currentProfile?.logo_url ?? null,
      initials: getInitials(currentBusinessName || currentFullName),
      role: getRoleFromUser(user),
    },
    buyer: {
      orders: ((ordersResult.data ?? []) as OrderRow[]).map((order) => ({
        id: order.id,
        item: order.item_name,
        seller: order.seller_name,
        status: order.status,
        date: formatDate(order.ordered_at),
        amount: formatCurrency(order.amount),
        tracking: order.tracking ?? undefined,
      })),
      wishlist: ((wishlistResult.data ?? []) as WishlistRow[]).map((item) => ({
        id: item.id,
        name: item.product_name,
        price: formatCurrency(item.price),
        seller: item.seller_name,
        category: item.category,
        added: formatShortDate(item.created_at),
      })),
      activity: ((buyerActivityResult.data ?? []) as ActivityRow[]).map((item) => ({
        name: item.name,
        action: item.action,
        time: formatRelativeTime(item.created_at),
      })),
    },
    seller: {
      products: ((productsResult.data ?? []) as ProductRow[]).map((product) => ({
        id: product.id,
        name: product.name,
        price: String(product.price),
        category: product.category,
        sellerName: getBusinessName(user),
        location: product.location || "Lagos",
        stock: product.stock,
        sales: product.sales,
        views: product.views,
        status: product.status,
      })),
      activity: ((sellerActivityResult.data ?? []) as ActivityRow[]).map((item) => ({
        name: item.name,
        action: item.action,
        time: formatRelativeTime(item.created_at),
      })),
      topSellers,
      featuredSellers,
      paymentSettings: paymentResult.data
        ? {
            plan: (paymentResult.data as PaymentSettingsRow).plan,
            verificationStatus: (paymentResult.data as PaymentSettingsRow).verification_status,
            enabledMethods: (paymentResult.data as PaymentSettingsRow).enabled_methods ?? [],
            bankName: (paymentResult.data as PaymentSettingsRow).bank_name,
            accountName: (paymentResult.data as PaymentSettingsRow).account_name,
            accountNumber: (paymentResult.data as PaymentSettingsRow).account_number,
          }
        : {
            ...defaultPaymentSettings,
            accountName: getBusinessName(user),
          },
    },
  };
}

async function fetchMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  await ensureProfile(user);

  const supabase = getSupabaseClient();
  const [productsResult, profilesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, seller_id, name, price, category, location, sales, views, status")
      .eq("status", "Active")
      .order("sales", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, role, full_name, business_name, username, location")
      .eq("role", "seller"),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const profileMap = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );

  return ((productsResult.data ?? []) as ProductRow[]).map((product) => ({
    id: product.id,
    name: product.name,
    price: formatCurrency(product.price),
    category: product.category,
    sellerName: getSellerDisplayName(profileMap.get(product.seller_id)),
    location: product.location || profileMap.get(product.seller_id)?.location || "Lagos",
    sales: product.sales,
    views: product.views,
    isLive: true as const,
  }));
}

async function syncWishlist(nextWishlist: BuyerWishlistItem[]) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = getSupabaseClient();
  const nextIds = nextWishlist.map((item) => item.id);

  if (nextIds.length > 0) {
    const { error } = await supabase.from("wishlist_items").upsert(
      nextWishlist.map((item) => ({
        id: item.id,
        buyer_id: user.id,
        product_id: null,
        product_name: item.name,
        seller_name: item.seller,
        price: Number(item.price.replace(/[^\d.]/g, "")),
        category: item.category,
      })),
      { onConflict: "id" },
    );

    if (error) throw error;

    const { error: deleteError } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("buyer_id", user.id)
      .not("id", "in", `(${nextIds.map((id) => `"${id}"`).join(",")})`);

    if (deleteError) throw deleteError;
    return;
  }

  const { error } = await supabase.from("wishlist_items").delete().eq("buyer_id", user.id);
  if (error) throw error;
}

async function insertBuyerActivity(activity: ActivityItem) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("buyer_activity_log").insert({
    id: `${user.id}-buyer-activity-${Date.now()}`,
    buyer_id: user.id,
    name: activity.name,
    action: activity.action,
  });

  if (error) throw error;
}

async function syncSellerProducts(nextProducts: SellerProduct[]) {
  const user = await getCurrentUser();
  if (!user) return;

  await ensureProfile(user);

  const supabase = getSupabaseClient();
  const nextIds = nextProducts.map((product) => product.id);

  if (nextIds.length > 0) {
    const { error } = await supabase.from("products").upsert(
      nextProducts.map((product) => ({
        id: product.id,
        seller_id: user.id,
        name: product.name,
        price: Number(product.price),
        category: product.category,
        location: product.location,
        stock: product.stock,
        sales: product.sales,
        views: product.views,
        status: product.status,
      })),
      { onConflict: "id" },
    );

    if (error) throw error;

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("seller_id", user.id)
      .not("id", "in", `(${nextIds.map((id) => `"${id}"`).join(",")})`);

    if (deleteError) throw deleteError;
    return;
  }

  const { error } = await supabase.from("products").delete().eq("seller_id", user.id);
  if (error) throw error;
}

async function insertSellerActivity(activity: ActivityItem) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("seller_activity_log").insert({
    id: `${user.id}-seller-activity-${Date.now()}`,
    seller_id: user.id,
    name: activity.name,
    action: activity.action,
  });

  if (error) throw error;
}

async function upsertPaymentSettings(nextSettings: SellerPaymentSettings) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("seller_payment_settings").upsert(
    {
      seller_id: user.id,
      plan: nextSettings.plan,
      verification_status: nextSettings.verificationStatus,
      enabled_methods: nextSettings.enabledMethods,
      bank_name: nextSettings.bankName,
      account_name: nextSettings.accountName,
      account_number: nextSettings.accountNumber,
    },
    { onConflict: "seller_id" },
  );

  if (error) throw error;
}

export function useDashboardStore() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardStore,
    initialData: emptyStore,
  });
}

export function useMarketplaceProducts() {
  return useQuery({
    queryKey: MARKETPLACE_PRODUCTS_QUERY_KEY,
    queryFn: fetchMarketplaceProducts,
    initialData: [],
  });
}

export function useBuyerDashboardData() {
  const queryClient = useQueryClient();
  const dashboardQuery = useDashboardStore();

  const wishlistMutation = useMutation({
    mutationFn: syncWishlist,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });

  const activityMutation = useMutation({
    mutationFn: insertBuyerActivity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("You need to be signed in to upload a profile photo.");
      await uploadProfileAsset(user, file, "avatar");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });

  return {
    profile: (dashboardQuery.data ?? emptyStore).profile,
    ...(dashboardQuery.data ?? emptyStore).buyer,
    isLoading: dashboardQuery.isLoading,
    isSaving: wishlistMutation.isPending || activityMutation.isPending || avatarMutation.isPending,
    error:
      dashboardQuery.error ??
      wishlistMutation.error ??
      activityMutation.error ??
      avatarMutation.error ??
      null,
    setWishlist: (wishlist: BuyerWishlistItem[] | ((current: BuyerWishlistItem[]) => BuyerWishlistItem[])) => {
      const currentWishlist = (dashboardQuery.data ?? emptyStore).buyer.wishlist;
      const nextWishlist = typeof wishlist === "function" ? wishlist(currentWishlist) : wishlist;
      void wishlistMutation.mutateAsync(nextWishlist);
    },
    addBuyerActivity: (activity: ActivityItem) => {
      void activityMutation.mutateAsync(activity);
    },
    uploadAvatar: async (file: File) => {
      await avatarMutation.mutateAsync(file);
    },
  };
}

export function useSellerDashboardData() {
  const queryClient = useQueryClient();
  const dashboardQuery = useDashboardStore();

  const productsMutation = useMutation({
    mutationFn: syncSellerProducts,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: MARKETPLACE_PRODUCTS_QUERY_KEY });
    },
  });

  const activityMutation = useMutation({
    mutationFn: insertSellerActivity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: upsertPaymentSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("You need to be signed in to upload a profile photo.");
      await uploadProfileAsset(user, file, "avatar");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });

  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("You need to be signed in to upload a logo.");
      await uploadProfileAsset(user, file, "logo");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: MARKETPLACE_PRODUCTS_QUERY_KEY });
    },
  });

  return {
    profile: (dashboardQuery.data ?? emptyStore).profile,
    ...(dashboardQuery.data ?? emptyStore).seller,
    isLoading: dashboardQuery.isLoading,
    isSaving:
      productsMutation.isPending ||
      activityMutation.isPending ||
      paymentMutation.isPending ||
      avatarMutation.isPending ||
      logoMutation.isPending,
    error:
      dashboardQuery.error ??
      productsMutation.error ??
      activityMutation.error ??
      paymentMutation.error ??
      avatarMutation.error ??
      logoMutation.error ??
      null,
    setProducts: (products: SellerProduct[] | ((current: SellerProduct[]) => SellerProduct[])) => {
      const currentProducts = (dashboardQuery.data ?? emptyStore).seller.products;
      const nextProducts = typeof products === "function" ? products(currentProducts) : products;
      void productsMutation.mutateAsync(nextProducts);
    },
    addSellerActivity: (activity: ActivityItem) => {
      void activityMutation.mutateAsync(activity);
    },
    setPaymentSettings: (
      paymentSettings:
        | SellerPaymentSettings
        | ((current: SellerPaymentSettings) => SellerPaymentSettings),
    ) => {
      const currentPaymentSettings = (dashboardQuery.data ?? emptyStore).seller.paymentSettings;
      const nextSettings =
        typeof paymentSettings === "function"
          ? paymentSettings(currentPaymentSettings)
          : paymentSettings;
      void paymentMutation.mutateAsync(nextSettings);
    },
    uploadAvatar: async (file: File) => {
      await avatarMutation.mutateAsync(file);
    },
    uploadLogo: async (file: File) => {
      await logoMutation.mutateAsync(file);
    },
  };
}
