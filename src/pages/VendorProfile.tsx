import { Link, useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  MessageCircle,
  Phone,
  Mail,
  Star,
  Share2,
  BadgeCheck,
  Clock,
  Pencil,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  Music2,
} from "lucide-react";
import { useVendor, useVendorProducts, useMyVendorRating, useRateVendor } from "@/lib/catalog";
import { useStartConversation } from "@/lib/messaging";
import { shareLink } from "@/lib/share";
import { useCurrentUser } from "@/lib/auth";
import { ProductCard, Stars } from "@/components/catalog-cards";
import { LoadingOverlay } from "@/components/LoadingOverlay";

// Public vendor storefront page (route: /vendor/:id) — shows a vendor's profile, hours,
// contact links, services, ratings, and products; owners get edit/inbox shortcuts.

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Hours = { open?: string; close?: string; days?: number[] };

// Returns true/false if the vendor is currently open per their hours, or null if hours aren't set.
function isOpenNow(h: Hours): boolean | null {
  if (!h?.open || !h?.close || !h?.days?.length) return null;
  const now = new Date();
  if (!h.days.includes(now.getDay())) return false;
  const [oh, om] = h.open.split(":").map(Number);
  const [ch, cm] = h.close.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= oh * 60 + om && mins <= ch * 60 + cm;
}

// Builds a readable "Mon, Tue · 09:00–17:00" hours string, or null if hours aren't set.
function hoursLabel(h: Hours): string | null {
  if (!h?.open || !h?.close || !h?.days?.length) return null;
  const days = [...h.days].sort((a, b) => a - b).map((d) => DAY_LABELS[d]).join(", ");
  return `${days} · ${h.open}–${h.close}`;
}

// Social-platform registry: maps each key to its icon and a URL builder for handle-only values.
const SOCIALS: { key: string; icon: typeof Globe; base: (v: string) => string }[] = [
  { key: "instagram", icon: Instagram, base: (v) => `https://instagram.com/${v.replace(/^@/, "")}` },
  { key: "x", icon: Twitter, base: (v) => `https://x.com/${v.replace(/^@/, "")}` },
  { key: "facebook", icon: Facebook, base: (v) => `https://facebook.com/${v.replace(/^@/, "")}` },
  { key: "tiktok", icon: Music2, base: (v) => `https://tiktok.com/@${v.replace(/^@/, "")}` },
  { key: "website", icon: Globe, base: (v) => `https://${v.replace(/^https?:\/\//i, "")}` },
];

// Resolves a stored social value to a safe https URL (rebuilds non-URL values to block
// dangerous schemes like javascript:).
function socialHref(key: string, val: string): string {
  const v = val.trim();
  // Only http(s) full URLs pass through directly; everything else is rebuilt into a
  // safe https URL, so a malicious "javascript:" value can never become the href.
  if (/^https?:\/\//i.test(v)) return v;
  const s = SOCIALS.find((x) => x.key === key);
  return s ? s.base(v) : `https://${v}`;
}

// Interactive 1–5 star rating control; calls `onPick` with the chosen star count.
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
  "inline-flex items-center gap-2 border-2 border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50";

const sectionHeading = "font-display text-lg font-bold text-foreground";

// Page chrome (sticky header + centered main) wrapping the vendor profile content.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>
          </Link>
          <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">
            Marketplace
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-12 sm:px-6">{children}</main>
    </div>
  );
}

/**
 * VendorProfile page (route: /vendor/:id). Loads a vendor (by id or slug) and their products
 * from Supabase, computes owner status (current user === vendor.sellerId), open/closed state,
 * and visible socials. Owners see edit/inbox controls; visitors can rate (auth-gated) and start
 * a conversation, which creates/opens a chat thread and navigates to /messages.
 */
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

  // Starts (or reopens) a conversation with this vendor and routes to it; redirects to /auth if signed out.
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
  const verified = vendor.verified || vendor.acceptsPayments;
  const openNow = isOpenNow(vendor.hours);
  const hours = hoursLabel(vendor.hours);
  const socialEntries = SOCIALS.filter((s) => vendor.socials?.[s.key]);

  return (
    <Shell>
      {/* Cover (full-bleed) */}
      <div className="relative -mx-4 sm:-mx-6">
        <div className={`h-40 w-full bg-gradient-to-br ${vendor.tint} sm:h-56`}>
          {vendor.coverUrl ? <img src={vendor.coverUrl} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {isOwner ? (
            <Link
              to="/seller/messages"
              className="flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-display font-bold uppercase tracking-tight text-foreground backdrop-blur transition-colors hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" /> Inbox
            </Link>
          ) : vendor.sellerId ? (
            <button
              type="button"
              onClick={onMessage}
              disabled={startConversation.isPending}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground backdrop-blur transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" /> {startConversation.isPending ? "Opening…" : "Message"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => shareLink(`/vendor/${vendor.slug}`, vendor.name)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:text-primary"
            aria-label="Share profile"
          >
            <Share2 className="h-4 w-4" />
          </button>
          {isOwner ? (
            <Link
              to="/seller?tab=profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:text-primary"
              aria-label="Edit profile"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {/* Identity — avatar sits on top of the cover */}
      <div className="flex items-end gap-4">
        <div className="relative z-10 -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-background bg-secondary">
          {vendor.imageUrl ? (
            <img src={vendor.imageUrl} alt={vendor.name} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${vendor.tint}`}>
              <Icon className="h-10 w-10 text-white/90" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="pb-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">{vendor.name}</h1>
            {verified ? <BadgeCheck className="h-5 w-5 shrink-0 text-primary" /> : null}
          </div>
          {vendor.tagline ? <p className="mt-0.5 text-sm text-muted-foreground">{vendor.tagline}</p> : null}
        </div>
      </div>

      {/* Meta line */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {vendor.area ? (
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-primary" /> {vendor.area}
          </span>
        ) : null}
        {openNow !== null ? (
          <span className={`flex items-center gap-1 font-semibold ${openNow ? "text-accent" : "text-destructive"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> {openNow ? "Open now" : "Closed"}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <Stars rating={vendor.rating} />
          {vendor.rating ? vendor.rating.toFixed(1) : "—"} · {vendor.reviews} reviews
        </span>
      </div>

      {/* Rate */}
      <div className="mt-4">
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

      {/* About */}
      {vendor.bio ? (
        <section className="mt-6 border-t border-border pt-6">
          <h2 className={sectionHeading}>About</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{vendor.bio}</p>
        </section>
      ) : null}

      {/* Hours */}
      {hours ? (
        <section className="mt-6 border-t border-border pt-6">
          <h2 className={`flex items-center gap-2 ${sectionHeading}`}>
            <Clock className="h-4 w-4 text-primary" /> Business hours
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{hours}</p>
        </section>
      ) : null}

      {/* Contact + socials */}
      {vendor.phone || vendor.email || socialEntries.length > 0 ? (
        <section className="mt-6 border-t border-border pt-6">
          <h2 className={sectionHeading}>Contact</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
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
            {socialEntries.map((s) => {
              const SIcon = s.icon;
              return (
                <a
                  key={s.key}
                  href={socialHref(s.key, vendor.socials[s.key])}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center border-2 border-border text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  aria-label={s.key}
                >
                  <SIcon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Services */}
      {vendor.services.length > 0 ? (
        <section className="mt-6 border-t border-border pt-6">
          <h2 className={sectionHeading}>Services</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {vendor.services.map((s) => (
              <span key={s} className="rounded-full border-2 border-border px-4 py-1.5 text-sm text-foreground">
                {s}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Products */}
      <section className="mt-6 border-t border-border pt-6">
        <h2 className={sectionHeading}>Products</h2>
        {products.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="mt-3 border-2 border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            This vendor hasn't listed any products yet.
          </p>
        )}
      </section>
    </Shell>
  );
};

export default VendorProfile;
