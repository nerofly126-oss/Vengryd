import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { useProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/catalog-cards";
import { LoadingOverlay } from "@/components/LoadingOverlay";

const HotDeals = () => {
  const { data: products, isFetching } = useProducts();
  const deals = products.filter((p) => p.isHotDeal);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>
          </Link>
          <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">
            Marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tighter">Hot Deals</h1>
            <p className="text-sm text-muted-foreground">Limited-time prices from vendors near you.</p>
          </div>
        </div>

        {deals.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : isFetching ? (
          <LoadingOverlay />
        ) : (
          <div className="border-2 border-dashed border-border py-20 text-center">
            <Flame className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No hot deals right now — check back soon.</p>
            <Link to="/marketplace" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Back to marketplace
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default HotDeals;
