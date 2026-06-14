import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { cartActions, type StoreItem } from "@/lib/store";

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
  orders: { status: string | null; created_at: string } | null;
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
      cartActions.clear();
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
        .select("id, order_id, name, unit_price, quantity, fulfilled, created_at, orders(status, created_at)")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const byOrder = new Map<string, SellerOrder>();
      for (const row of (data ?? []) as unknown as ItemRow[]) {
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
