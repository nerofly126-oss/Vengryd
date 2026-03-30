import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Grid3X3, Heart, List, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type BuyerWishlistItem, useBuyerDashboardData } from "@/lib/dashboard-store";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function BuyerWishlist() {
  const { wishlist: items, setWishlist, addBuyerActivity } = useBuyerDashboardData();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [confirmDelete, setConfirmDelete] = useState<BuyerWishlistItem | null>(null);

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.seller.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRemove = (id: string) => {
    const removedItem = items.find((item) => item.id === id);
    setWishlist(items.filter((item) => item.id !== id));
    if (removedItem) {
      addBuyerActivity({
        name: removedItem.name,
        action: "Removed from wishlist",
        time: "Just now",
      });
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground font-body">{items.length} items saved for later</p>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search wishlist..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-body"
          />
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-secondary p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`rounded-md p-1.5 transition-colors ${view === "grid" ? "bg-card text-foreground" : "text-muted-foreground"}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md p-1.5 transition-colors ${view === "list" ? "bg-card text-foreground" : "text-muted-foreground"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {view === "grid" ? (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="relative mb-3 flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-secondary/60">
                  <Heart className="h-10 w-10 text-primary/40" />
                  <button
                    onClick={() => setConfirmDelete(item)}
                    className="absolute right-2 top-2 rounded-lg bg-card/80 p-1.5 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-body">{item.category}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.seller}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">{item.price}</p>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                    <ShoppingCart className="h-3 w-3" /> Add to Cart
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card"
        >
          {filtered.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/30">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/60">
                <Heart className="h-5 w-5 text-primary/40" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.seller} · {item.category}
                </p>
              </div>
              <p className="hidden text-sm font-semibold text-primary sm:block">{item.price}</p>
              <p className="hidden text-xs text-muted-foreground md:block">{item.added}</p>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setConfirmDelete(item)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground font-body">No wishlist items found.</div>
          ) : null}
        </motion.div>
      )}

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Remove Item</DialogTitle>
            <DialogDescription className="font-body">
              Remove &quot;{confirmDelete?.name}&quot; from your wishlist?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => (confirmDelete ? handleRemove(confirmDelete.id) : null)}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
