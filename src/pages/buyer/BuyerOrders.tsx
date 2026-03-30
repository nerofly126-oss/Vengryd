import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBuyerDashboardData } from "@/lib/dashboard-store";

type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

interface Order {
  id: string;
  item: string;
  seller: string;
  status: OrderStatus;
  date: string;
  amount: string;
  tracking?: string;
}

const statusConfig: Record<OrderStatus, { color: string; icon: typeof Clock }> = {
  Processing: { color: "bg-sand/20 text-sand-dark", icon: Clock },
  Shipped: { color: "bg-primary/20 text-primary", icon: Truck },
  Delivered: { color: "bg-accent/20 text-accent", icon: CheckCircle },
  Cancelled: { color: "bg-destructive/20 text-destructive", icon: XCircle },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function BuyerOrders() {
  const { orders: allOrders } = useBuyerDashboardData();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = allOrders.filter((order) => {
    const matchStatus = filter === "all" || order.status.toLowerCase() === filter;
    const matchSearch =
      order.item.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchSearch;
  });

  return (
    <div>
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground font-body">Track and manage all your purchases</p>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {[
          { label: "Total Orders", value: allOrders.length, icon: Package },
          { label: "Shipped", value: allOrders.filter((order) => order.status === "Shipped").length, icon: Truck },
          {
            label: "Delivered",
            value: allOrders.filter((order) => order.status === "Delivered").length,
            icon: CheckCircle,
          },
          {
            label: "Processing",
            value: allOrders.filter((order) => order.status === "Processing").length,
            icon: Clock,
          },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-body"
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-[160px] border-border bg-secondary">
            <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground font-body md:grid">
          <span>Order</span>
          <span>Seller</span>
          <span>Status</span>
          <span>Amount</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-border">
          {filtered.map((order) => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={order.id}
                className="flex flex-col items-start gap-2 px-5 py-4 transition-colors hover:bg-secondary/30 md:grid md:grid-cols-[1fr_1fr_auto_auto_auto] md:items-center md:gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{order.item}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.id} · {order.date}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{order.seller}</p>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}>
                  <StatusIcon className="h-3 w-3" /> {order.status}
                </span>
                <span className="text-sm font-semibold text-foreground">{order.amount}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            );
          })}

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground font-body">
              No orders found matching your criteria.
            </div>
          ) : null}
        </div>
      </motion.div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Order Details</DialogTitle>
            <DialogDescription className="font-body">{selectedOrder?.id}</DialogDescription>
          </DialogHeader>

          {selectedOrder ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-body">Item</p>
                  <p className="font-medium text-foreground">{selectedOrder.item}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Seller</p>
                  <p className="font-medium text-foreground">{selectedOrder.seller}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Date</p>
                  <p className="font-medium text-foreground">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Amount</p>
                  <p className="font-medium text-foreground">{selectedOrder.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[selectedOrder.status].color}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                {selectedOrder.tracking ? (
                  <div>
                    <p className="text-xs text-muted-foreground font-body">Tracking</p>
                    <p className="font-medium text-primary">{selectedOrder.tracking}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
                {selectedOrder.status === "Delivered" ? <Button className="flex-1">Leave Review</Button> : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
