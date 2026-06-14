import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { type StoreItem } from "@/lib/store";

export type SellerOrderItem = {
  id: string;
  orderId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  fulfilled: boolean;
};

export type SellerOrder = {
  id: string;
  status: string;
  createdAt: string;
  /** Just this seller's line items + their subtotal for the order. */
  items: SellerOrderItem[];
  subtotal: number;
};

type ItemRow = {
  id: string;
  order_id: string;
  name: string;
  unit_price: number | string;
  quantity: number;
  fulfilled: boolean;
  created_at: string;
  orders: { status: string | null; created_at: string; payment_status: string | null } | null;
};

/** Place an order from the current cart items (each StoreItem.id is a product id). */
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: StoreItem[]): Promise<string> => {
      if (items.length === 0) throw new Error("Your cart is empty.");
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to place an order.");

      const { data: order, error } = await supabase
        .from("orders")
        .insert({ buyer_id: user.id })
        .select("id")
        .single();
      if (error) throw error;
      const orderId = (order as { id: string }).id;

      // seller_id, name and unit_price are filled server-side by a trigger.
      const rows = items.map((it) => ({ order_id: orderId, product_id: it.id, quantity: 1 }));
      const { error: itemsError } = await supabase.from("order_items").insert(rows);
      if (itemsError) throw itemsError;

      return orderId;
    },
    onSuccess: () => {
      // Cart is cleared only after payment is verified (see checkout flow).
      void qc.invalidateQueries({ queryKey: ["my-orders"] });
      void qc.invalidateQueries({ queryKey: ["seller-orders"] });
    },
  });
}

/** Orders containing the current seller's products, newest first. */
export function useSellerOrders() {
  return useQuery({
    queryKey: ["seller-orders"],
    queryFn: async (): Promise<SellerOrder[]> => {
      if (!isSupabaseConfigured()) return [];
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("order_items")
        .select("id, order_id, name, unit_price, quantity, fulfilled, created_at, orders(status, created_at, payment_status)")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const byOrder = new Map<string, SellerOrder>();
      for (const row of (data ?? []) as unknown as ItemRow[]) {
        // Only paid orders are real sales — hide unpaid/abandoned checkouts.
        if (row.orders?.payment_status !== "paid") continue;
        let order = byOrder.get(row.order_id);
        if (!order) {
          order = {
            id: row.order_id,
            status: row.orders?.status ?? "pending",
            createdAt: row.orders?.created_at ?? row.created_at,
            items: [],
            subtotal: 0,
          };
          byOrder.set(row.order_id, order);
        }
        const unitPrice = Number(row.unit_price);
        order.items.push({
          id: row.id,
          orderId: row.order_id,
          name: row.name,
          unitPrice,
          quantity: row.quantity,
          fulfilled: row.fulfilled,
        });
        order.subtotal += unitPrice * row.quantity;
      }
      return Array.from(byOrder.values());
    },
    initialData: [],
  });
}

export type BuyerOrder = {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { id: string; name: string; unitPrice: number; quantity: number; fulfilled: boolean }[];
};

type BuyerOrderRow = {
  id: string;
  status: string | null;
  payment_status: string | null;
  total: number | string;
  created_at: string;
  order_items: { id: string; name: string; unit_price: number | string; quantity: number; fulfilled: boolean }[] | null;
};

/** The signed-in buyer's own orders, newest first. */
export function useMyOrders() {
  return useQuery({
    queryKey: ["my-orders"],
    queryFn: async (): Promise<BuyerOrder[]> => {
      if (!isSupabaseConfigured()) return [];
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("orders")
        .select("id, status, payment_status, total, created_at, order_items(id, name, unit_price, quantity, fulfilled)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return ((data ?? []) as unknown as BuyerOrderRow[]).map((o) => ({
        id: o.id,
        status: o.status ?? "pending",
        paymentStatus: o.payment_status ?? "unpaid",
        total: Number(o.total),
        createdAt: o.created_at,
        items: (o.order_items ?? []).map((it) => ({
          id: it.id,
          name: it.name,
          unitPrice: Number(it.unit_price),
          quantity: it.quantity,
          fulfilled: it.fulfilled,
        })),
      }));
    },
    initialData: [],
  });
}

/** A buyer-facing status label derived from the line items. */
export function orderProgressLabel(order: BuyerOrder): string {
  if (order.status === "cancelled") return "Cancelled";
  if (order.paymentStatus !== "paid") return "Payment pending";
  if (order.items.length > 0 && order.items.every((it) => it.fulfilled)) return "Ready / Fulfilled";
  if (order.items.some((it) => it.fulfilled)) return "Partially fulfilled";
  return "Awaiting vendor";
}

export function useToggleFulfilled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, fulfilled }: { itemId: string; fulfilled: boolean }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("order_items").update({ fulfilled }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seller-orders"] });
    },
  });
}

/** Headline numbers for the seller overview, derived from their orders. */
export function sellerStats(orders: SellerOrder[]) {
  let revenue = 0;
  let units = 0;
  let pending = 0;
  for (const o of orders) {
    for (const it of o.items) {
      revenue += it.unitPrice * it.quantity;
      units += it.quantity;
      if (!it.fulfilled) pending += it.quantity;
    }
  }
  return { revenue, units, pending, orders: orders.length };
}
