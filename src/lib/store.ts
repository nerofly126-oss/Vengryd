// Client-side cart & wishlist store: a tiny localStorage-backed external store exposed to React via useSyncExternalStore.
import { useSyncExternalStore } from "react";

export type StoreItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  tint: string;
};

const CART_KEY = "vengryd-cart";
const WISH_KEY = "vengryd-wishlist";

// True when a parsed value has the shape we rely on at checkout (id + numeric price).
function isStoreItem(v: unknown): v is StoreItem {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.name === "string" && typeof o.price === "number" && Number.isFinite(o.price);
}

// Reads and parses a StoreItem[] from localStorage, discarding malformed entries
// (corrupt/old-schema data must never reach the checkout math) and returning [] on error.
function load(key: string): StoreItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoreItem) : [];
  } catch {
    return [];
  }
}

let cart: StoreItem[] = load(CART_KEY);
let wishlist: StoreItem[] = load(WISH_KEY);

const listeners = new Set<() => void>();
// useSyncExternalStore subscribe: registers a listener and returns an unsubscribe fn.
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
// Notifies all subscribers that the store changed.
const emit = () => listeners.forEach((l) => l());
// Writes the current cart and wishlist back to localStorage (ignores storage errors).
const persist = () => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  } catch {
    /* ignore storage errors */
  }
};

/** Cart mutations (add is a no-op for duplicates); each persists to localStorage and notifies subscribers. */
export const cartActions = {
  add(item: StoreItem) {
    if (!cart.some((i) => i.id === item.id)) {
      cart = [...cart, item];
      persist();
      emit();
    }
  },
  remove(id: string) {
    cart = cart.filter((i) => i.id !== id);
    persist();
    emit();
  },
  clear() {
    cart = [];
    persist();
    emit();
  },
};

/** Wishlist mutations (toggle adds/removes by id); each persists to localStorage and notifies subscribers. */
export const wishlistActions = {
  toggle(item: StoreItem) {
    wishlist = wishlist.some((i) => i.id === item.id)
      ? wishlist.filter((i) => i.id !== item.id)
      : [...wishlist, item];
    persist();
    emit();
  },
  remove(id: string) {
    wishlist = wishlist.filter((i) => i.id !== id);
    persist();
    emit();
  },
};

/** Subscribes the component to the live cart contents. */
export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => cart,
    () => cart,
  );
}

/** Subscribes the component to the live wishlist contents. */
export function useWishlist() {
  return useSyncExternalStore(
    subscribe,
    () => wishlist,
    () => wishlist,
  );
}
