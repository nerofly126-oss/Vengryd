import { Link } from "react-router-dom";
import { Star, Heart, MapPin, type LucideIcon } from "lucide-react";
import type { Product, Vendor } from "@/lib/catalog";

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

export function MediaThumb({
  icon: Icon,
  tint,
  imageUrl,
  alt,
}: {
  icon: LucideIcon;
  tint: string;
  imageUrl?: string;
  alt: string;
}) {
  if (imageUrl) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-secondary">
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br ${tint}`}>
      <Icon className="h-1/3 w-1/3 text-white/90" strokeWidth={1.5} />
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative flex flex-col rounded-2xl border-2 border-border bg-card p-4 transition-colors hover:border-primary/50">
      {product.discount ? (
        <span className="absolute left-3 top-3 z-10 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
          -{product.discount}%
        </span>
      ) : null}
      <button
        type="button"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
        aria-label="Add to wishlist"
      >
        <Heart className="h-4 w-4" />
      </button>

      <MediaThumb icon={product.icon} tint={product.tint} imageUrl={product.imageUrl} alt={product.name} />

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <Stars rating={product.rating} />
          <span className="text-xs text-muted-foreground">({String(product.reviews).padStart(2, "0")})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">${product.price.toFixed(2)}</span>
          {product.oldPrice ? (
            <span className="text-xs text-muted-foreground line-through">${product.oldPrice.toFixed(2)}</span>
          ) : null}
        </div>

        {product.sold !== undefined && product.stock !== undefined ? (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, (product.sold / product.stock) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Sold: {product.sold}/{product.stock} products
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs font-medium text-accent">✓ In stock {product.stock} products</p>
        )}
      </div>
    </div>
  );
}

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <div className="group flex flex-col rounded-2xl border-2 border-border bg-card p-4 transition-colors hover:border-primary/50">
      <MediaThumb icon={vendor.icon} tint={vendor.tint} imageUrl={vendor.imageUrl} alt={vendor.name} />
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="font-display text-base font-bold text-foreground">{vendor.name}</h3>
        {vendor.area ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {vendor.area}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <Stars rating={vendor.rating} />
          <span className="text-xs text-muted-foreground">({vendor.reviews})</span>
        </div>
        {vendor.services.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {vendor.services.slice(0, 3).map((s) => (
              <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        ) : null}
        <Link
          to={`/vendor/${vendor.id}`}
          className="mt-4 w-full rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          View profile
        </Link>
      </div>
    </div>
  );
}
