// Reusable search input with a live product/vendor typeahead dropdown.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import type { Product, Vendor } from "@/lib/catalog";

const MIN_CHARS = 2;
const MAX_PRODUCTS = 5;
const MAX_VENDORS = 4;

/**
 * Universal search box with a live typeahead dropdown. After a couple of
 * characters it suggests matching product and vendor names; picking a product
 * narrows the search to it, picking a vendor opens its profile.
 */
export function SearchBox({
  products,
  vendors,
  value,
  onChange,
  placeholder = "Search products, vendors, categories...",
  showButton = false,
}: {
  products: Product[];
  vendors: Vendor[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  showButton?: boolean;
}) {
  const navigate = useNavigate();
  const [focused, setFocused] = useState(false);

  const q = value.trim().toLowerCase();
  const productHits = q.length >= MIN_CHARS
    ? products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, MAX_PRODUCTS)
    : [];
  const vendorHits = q.length >= MIN_CHARS
    ? vendors.filter((v) => v.name.toLowerCase().includes(q)).slice(0, MAX_VENDORS)
    : [];

  const open = focused && q.length >= MIN_CHARS && productHits.length + vendorHits.length > 0;

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center rounded-none border-2 border-border bg-secondary/40 focus-within:border-primary">
        <Search className="ml-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        {showButton ? (
          <button
            type="submit"
            className="m-1 rounded-none bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Search
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto border-2 border-border bg-card shadow-[var(--shadow-card)]">
          {productHits.length > 0 ? (
            <div className="p-1">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Products</p>
              {productHits.map((p) => {
                const Icon = p.icon;
                return (
                  // onMouseDown (not onClick) so it fires before the input blur closes the list.
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(p.name);
                      setFocused(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary"
                  >
                    <span className="h-9 w-9 shrink-0 overflow-hidden bg-secondary">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${p.tint}`}>
                          <Icon className="h-4 w-4 text-white/90" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{p.name}</span>
                      <span className="block text-xs text-primary">₦{p.price.toLocaleString()}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {vendorHits.length > 0 ? (
            <div className="border-t border-border p-1">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Vendors</p>
              {vendorHits.map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFocused(false);
                      navigate(`/vendor/${v.id}`);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary"
                  >
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-secondary">
                      {v.imageUrl ? (
                        <img src={v.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${v.tint}`}>
                          <Icon className="h-4 w-4 text-white/90" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{v.name}</span>
                      {v.area ? <span className="block truncate text-xs text-muted-foreground">{v.area}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
