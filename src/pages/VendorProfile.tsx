import { Link, useParams, useNavigate } from "react-router-dom";
import { MapPin, MessageCircle, Phone, Mail, Star, Share2 } from "lucide-react";
import { useVendor, useVendorProducts, useMyVendorRating, useRateVendor } from "@/lib/catalog";
import { useStartConversation } from "@/lib/messaging";
import { shareLink } from "@/lib/share";
import { useCurrentUser } from "@/lib/auth";
import { ProductCard, Stars } from "@/components/catalog-cards";
import { LoadingOverlay } from "@/components/LoadingOverlay";

function RateStars({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onPick(n)} aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}>
          <Star className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 hover:text-amber-400"}`} />
        </button>
      ))}
    </div>
  );
}

const contactBtn =
  "inline-flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>
          </Link>
          <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">
            Marketplace
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

const VendorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: vendor, isFetching } = useVendor(id);
  const { data: products } = useVendorProducts(vendor?.sellerId);
  const { data: myRating } = useMyVendorRating(id);
  const rate = useRateVendor(id);
  const startConversation = useStartConversation();

  const isOwner = !!user && !!vendor?.sellerId && vendor.sellerId === user.id;

  const onMessage = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!vendor) return;
    startConversation.mutate(vendor.id, {
      onSuccess: (conversationId) => navigate(`/messages?c=${conversationId}`),
    });
  };

  if (!vendor) {
    return (
      <Shell>
        {isFetching ? (
          <LoadingOverlay />
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground">Vendor not found.</p>
            <Link to="/marketplace" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Back to marketplace
            </Link>
          </div>
        )}
      </Shell>
    );
  }

  const Icon = vendor.icon;

  return (
    <Shell>
      {/* Profile banner */}
      <section className="flex flex-col gap-6 rounded-2xl border-2 border-border bg-card p-6 sm:flex-row sm:items-center">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl">
          {vendor.imageUrl ? (
            <img src={vendor.imageUrl} alt={vendor.name} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${vendor.tint}`}>
              <Icon className="h-12 w-12 text-white/90" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="font-display text-3xl font-black uppercase tracking-tighter text-foreground">{vendor.name}</h1>
          {vendor.area ? (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> {vendor.area}
            </p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <Stars rating={vendor.rating} />
            <span className="text-xs text-muted-foreground">
              {vendor.rating ? vendor.rating.toFixed(1) : "—"} · {vendor.reviews} reviews
            </span>
          </div>
          <div className="mt-3">
            <p className="mb-1 text-xs text-muted-foreground">{myRating ? "Your rating" : "Rate this vendor"}</p>
            <RateStars
              value={myRating ?? 0}
              onPick={(n) => {
                if (!user) {
                  navigate("/auth");
                  return;
                }
                rate.mutate(n);
              }}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-2 sm:flex-col">
          <button
            type="button"
            onClick={() => shareLink(`/vendor/${vendor.slug}`, vendor.name)}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-border px-6 py-3 text-sm font-display font-bold uppercase tracking-tight text-foreground transition-colors hover:border-primary/50"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          {isOwner ? (
            <Link
              to="/seller/messages"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-border px-6 py-3 text-sm font-display font-bold uppercase tracking-tight text-foreground transition-colors hover:border-primary/50"
            >
              <MessageCircle className="h-4 w-4" /> Inbox
            </Link>
          ) : vendor.sellerId ? (
            <button
              type="button"
              onClick={onMessage}
              disabled={startConversation.isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" /> {startConversation.isPending ? "Opening…" : "Message"}
            </button>
          ) : null}
        </div>
      </section>

      {/* Contact details */}
      {vendor.phone || vendor.email ? (
        <section className="mt-6 flex flex-wrap gap-3">
          {vendor.phone ? (
            <a href={`tel:${vendor.phone}`} className={contactBtn}>
              <Phone className="h-4 w-4 text-primary" /> {vendor.phone}
            </a>
          ) : null}
          {vendor.email ? (
            <a href={`mailto:${vendor.email}`} className={contactBtn}>
              <Mail className="h-4 w-4 text-primary" /> Email
            </a>
          ) : null}
        </section>
      ) : null}

      {/* Services */}
      {vendor.services.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Services</h2>
          <div className="flex flex-wrap gap-2">
            {vendor.services.map((s) => (
              <span key={s} className="rounded-full border-2 border-border px-4 py-1.5 text-sm text-foreground">
                {s}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Catalog */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">Products</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            This vendor hasn't listed any products yet.
          </p>
        )}
      </section>
    </Shell>
  );
};

export default VendorProfile;
