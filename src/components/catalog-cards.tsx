import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, MapPin, ShoppingCart, MessageCircle, X, type LucideIcon } from "lucide-react";
import { useVendors, type Product, type Vendor } from "@/lib/catalog";
import { useCart, useWishlist, cartActions, wishlistActions, type StoreItem } from "@/lib/store";
import { useStartConversation } from "@/lib/messaging";
import { useCurrentUser } from "@/lib/auth";

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
      <div className="aspect-square w-full overflow-hidden bg-secondary">
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`flex aspect-square w-full items-center justify-center bg-gradient-to-br ${tint}`}>
      <Icon className="h-1/3 w-1/3 text-white/90" strokeWidth={1.5} />
    </div>
  );
}

function toItem(product: Product): StoreItem {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    tint: product.tint,
  };
}

function ProductDetailModal({
  product,
  vendor,
  canBuy,
  open,
  onClose,
}: {
  product: Product;
  vendor: { id: string; name: string } | null;
  canBuy: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const cart = useCart();
  const wishlist = useWishlist();
  const inCart = cart.some((i) => i.id === product.id);
  const faved = wishlist.some((i) => i.id === product.id);
  const isOwn = !!user && !!product.sellerId && product.sellerId === user.id;
  const item = toItem(product);
  const Icon = product.icon;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            className="relative z-10 grid max-h-[90vh] w-full max-w-3xl overflow-hidden border-2 border-border bg-card md:grid-cols-2"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className={`flex aspect-square w-full items-center justify-center bg-gradient-to-br ${product.tint}`}>
                  <Icon className="h-1/3 w-1/3 text-white/90" strokeWidth={1.5} />
                </div>
              )}
              {product.discount ? (
                <span className="absolute left-3 top-3 bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  -{product.discount}%
                </span>
              ) : null}
            </div>

            <div className="flex flex-col overflow-y-auto p-6">
              <h2 className="font-display text-2xl font-bold text-foreground">{product.name}</h2>
              <div className="mt-2 flex items-center gap-2">
                <Stars rating={product.rating} />
                <span className="text-xs text-muted-foreground">({String(product.reviews).padStart(2, "0")} reviews)</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">₦{product.price.toLocaleString()}</span>
                {product.oldPrice ? (
                  <span className="text-sm text-muted-foreground line-through">₦{product.oldPrice.toLocaleString()}</span>
                ) : null}
              </div>
              {product.description ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              ) : null}
              {product.stock !== undefined ? (
                <p className="mt-3 text-xs font-medium text-accent">✓ {product.stock} in stock</p>
              ) : null}
              {vendor ? (
                <Link
                  to={`/vendor/${vendor.id}`}
                  onClick={onClose}
                  className="mt-3 text-sm font-semibold text-primary hover:underline"
                >
                  Sold by {vendor.name}
                </Link>
              ) : null}

              <div className="mt-auto flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      onClose();
                      navigate("/auth");
                      return;
                    }
                    cartActions.add(item);
                  }}
                  disabled={inCart || isOwn || !canBuy}
                  className="flex flex-1 items-center justify-center gap-2 bg-primary py-3 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  <ShoppingCart className="h-4 w-4" />{" "}
                  {isOwn ? "Your product" : !canBuy ? "Unavailable" : inCart ? "In cart" : "Add to cart"}
                </button>
                {isOwn ? null : (
                  <button
                    type="button"
                    onClick={() => wishlistActions.toggle(item)}
                    className="flex h-12 w-12 items-center justify-center border-2 border-border text-muted-foreground hover:text-primary"
                    aria-label="Favourite"
                  >
                    <Heart className={`h-5 w-5 ${faved ? "fill-primary text-primary" : ""}`} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const cart = useCart();
  const wishlist = useWishlist();
  const inCart = cart.some((i) => i.id === product.id);
  const faved = wishlist.some((i) => i.id === product.id);
  const item = toItem(product);
  const [open, setOpen] = useState(false);

  const { data: vendors } = useVendors();
  const ownerVendor = product.sellerId ? vendors.find((v) => v.sellerId === product.sellerId) ?? null : null;
  const vendorRef = ownerVendor ? { id: ownerVendor.id, name: ownerVendor.name } : null;
  const isOwn = !!user && !!product.sellerId && product.sellerId === user.id;
  // Buyable only once the vendor has set up payouts (so the order can auto-settle).
  const canBuy = !!ownerVendor?.acceptsPayments;

  return (
    <div className="group relative flex flex-col border-2 border-border bg-card p-4 transition-colors hover:border-primary/50">
      <ProductDetailModal product={product} vendor={vendorRef} canBuy={canBuy} open={open} onClose={() => setOpen(false)} />
      {product.discount ? (
        <span className="absolute left-3 top-3 z-10 bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
          -{product.discount}%
        </span>
      ) : null}
      {isOwn ? null : (
        <button
          type="button"
          onClick={() => wishlistActions.toggle(item)}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-muted-foreground transition-colors hover:text-primary"
          aria-label={faved ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart className={`h-4 w-4 ${faved ? "fill-primary text-primary" : ""}`} />
        </button>
      )}

      <button type="button" onClick={() => setOpen(true)} className="block w-full" aria-label={`View ${product.name}`}>
        <MediaThumb icon={product.icon} tint={product.tint} imageUrl={product.imageUrl} alt={product.name} />
      </button>

      <div className="mt-4 flex flex-1 flex-col">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="line-clamp-2 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </button>
        {vendorRef ? (
          <Link to={`/vendor/${vendorRef.id}`} className="mt-1 text-xs text-muted-foreground hover:text-primary">
            by {vendorRef.name}
          </Link>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <Stars rating={product.rating} />
          <span className="text-xs text-muted-foreground">({String(product.reviews).padStart(2, "0")})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">₦{product.price.toLocaleString()}</span>
          {product.oldPrice ? (
            <span className="text-xs text-muted-foreground line-through">₦{product.oldPrice.toLocaleString()}</span>
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

        <button
          type="button"
          onClick={() => {
            if (!user) {
              navigate("/auth");
              return;
            }
            cartActions.add(item);
          }}
          disabled={inCart || isOwn || !canBuy}
          className="mt-4 flex w-full items-center justify-center gap-2 bg-primary py-2 text-sm font-display font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <ShoppingCart className="h-4 w-4" />
          {isOwn ? "Your product" : !canBuy ? "Unavailable" : inCart ? "In cart" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const startConversation = useStartConversation();
  const isOwner = !!user && !!vendor.sellerId && vendor.sellerId === user.id;
  // Messaging only works for vendors claimed by a seller (sellerId set).
  const canMessage = !!vendor.sellerId && !isOwner;

  const onMessage = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    startConversation.mutate(vendor.id, {
      onSuccess: (conversationId) => navigate(`/messages?c=${conversationId}`),
    });
  };

  return (
    <div className="group flex flex-col border-2 border-border bg-card p-4 transition-colors hover:border-primary/50">
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
              <span key={s} className="border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex gap-2">
          <Link
            to={`/vendor/${vendor.id}`}
            className="flex-1 bg-primary py-2 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View profile
          </Link>
          {canMessage ? (
            <button
              type="button"
              onClick={onMessage}
              disabled={startConversation.isPending}
              className="flex items-center justify-center border-2 border-border px-3 text-foreground transition-colors hover:border-primary/50 disabled:opacity-60"
              aria-label={`Message ${vendor.name}`}
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
