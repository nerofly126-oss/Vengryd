import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/catalog";
import promoImg from "@/assets/hotdealspromocard.jpeg";

/**
 * Compact hot-deals promo banner. Fixed, modest height so it can't balloon; the
 * product shot is anchored to the right and its dark studio background blends
 * into the gradient via mix-blend-lighten. The whole card opens /deals.
 */
export function HotDealsPromo({ deals }: { deals: Product[] }) {
  if (deals.length === 0) return null;
  const minPrice = Math.min(...deals.map((d) => d.price));

  return (
    <Link
      to="/deals"
      className="group relative flex min-h-[8.5rem] items-center overflow-hidden bg-gradient-to-r from-black via-neutral-950 to-emerald-950 sm:min-h-[10rem]"
    >
      {/* product shot — dark bg melts into the gradient */}
      <img
        src={promoImg}
        alt=""
        className="pointer-events-none absolute right-0 top-1/2 h-[115%] max-h-[12rem] -translate-y-1/2 object-contain opacity-90 mix-blend-lighten sm:right-6"
      />
      {/* green glow behind the copy */}
      <div className="pointer-events-none absolute -left-10 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative z-10 max-w-[62%] px-6 py-5 sm:px-10">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Hot Deals</span>
        <h3 className="mt-1.5 font-editorial text-xl font-semibold leading-tight text-white sm:text-3xl">
          A healthy leap <span className="italic text-primary">ahead.</span>
        </h3>
        <p className="mt-1.5 text-xs text-white/70 sm:text-sm">
          Limited-time prices from <span className="font-semibold text-white">₦{minPrice.toLocaleString()}</span>
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-display font-bold uppercase tracking-tight text-neutral-900 transition-transform group-hover:scale-[1.03] sm:text-sm">
          Discover now
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
