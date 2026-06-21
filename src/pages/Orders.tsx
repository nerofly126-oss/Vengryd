import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { useMyOrders, orderProgressLabel, type BuyerOrder } from "@/lib/orders";
import { LoadingOverlay } from "@/components/LoadingOverlay";

// Buyer order-history page (route: /orders) — lists the signed-in user's past orders and their status.

// Formats a number as Nigerian Naira (e.g. 1500 -> "₦1,500").
const naira = (n: number) => `₦${n.toLocaleString()}`;

// Maps a progress label to its Tailwind text-colour class (destructive / primary / muted).
function statusClass(label: string) {
  if (label === "Cancelled") return "text-destructive";
  if (label.startsWith("Ready")) return "text-primary";
  return "text-muted-foreground";
}

// Page chrome (header + centered main) wrapping the orders content.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>
          </Link>
          <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">
            Marketplace
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

// Card for one order: header (id, date, total, overall status) plus a per-item list with fulfilled/pending badges.
function OrderCard({ order }: { order: BuyerOrder }) {
  const label = orderProgressLabel(order);
  return (
    <div className="rounded-none border-2 border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div>
          <p className="font-display text-sm font-bold text-foreground">Order #{order.id.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-base font-bold text-primary">{naira(order.total)}</p>
          <span className={`text-xs font-semibold uppercase tracking-tight ${statusClass(label)}`}>{label}</span>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{it.name}</p>
              <p className="text-xs text-muted-foreground">
                {it.quantity} × {naira(it.unitPrice)}
              </p>
            </div>
            <span
              className={`shrink-0 px-2 py-0.5 text-xs font-semibold uppercase ${
                it.fulfilled ? "bg-primary/15 text-primary" : "text-muted-foreground"
              }`}
            >
              {it.fulfilled ? "Fulfilled" : "Pending"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Orders page (route: /orders). Auth-gated — prompts sign-in when signed out. Otherwise fetches
 * the current user's orders via useMyOrders and renders them as OrderCards (or an empty state).
 */
const Orders = () => {
  const { data: user } = useCurrentUser();
  const { data: orders, isFetching } = useMyOrders();

  if (!user) {
    return (
      <Shell>
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">Sign in to see your orders.</p>
          <Link to="/auth" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="mb-2 font-display text-3xl font-black uppercase tracking-tighter">My Orders</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        You paid securely at checkout — each vendor is notified automatically. Arrange delivery or pickup with the
        vendor via Messages or their contact details.
      </p>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      ) : isFetching ? (
        <LoadingOverlay />
      ) : (
        <div className="rounded-none border-2 border-dashed border-border py-16 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You haven't placed any orders yet.</p>
          <Link to="/marketplace" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            Browse the marketplace
          </Link>
        </div>
      )}
    </Shell>
  );
};

export default Orders;
