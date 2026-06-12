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

function load(key: string): StoreItem[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoreItem[]) : [];
  } catch {
    return [];
  }
}

let cart: StoreItem[] = load(CART_KEY);
let wishlist: StoreItem[] = load(WISH_KEY);

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const emit = () => listeners.forEach((l) => l());
const persist = () => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  } catch {
    /* ignore storage errors */
  }
};

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

export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => cart,
    () => cart,
  );
}

export function useWishlist() {
  return useSyncExternalStore(
    subscribe,
    () => wishlist,
    () => wishlist,
  );
}
