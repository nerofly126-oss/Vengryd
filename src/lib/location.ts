import { useState } from "react";

const AREA_KEY = "vengryd-area";

/** Buyer's chosen area/city, persisted in localStorage. */
export function useBuyerArea() {
  const [area, setAreaState] = useState<string>(() => {
    try {
      return localStorage.getItem(AREA_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const setArea = (next: string) => {
    const value = next.trim();
    setAreaState(value);
    try {
      if (value) localStorage.setItem(AREA_KEY, value);
      else localStorage.removeItem(AREA_KEY);
    } catch {
      /* ignore storage errors */
    }
  };
  return [area, setArea] as const;
}

/** True when a vendor's area matches the buyer's area (shared city/area token). */
export function areaMatches(vendorArea: string | null | undefined, buyerArea: string): boolean {
  if (!buyerArea.trim()) return true; // no filter set → show everything
  const v = (vendorArea ?? "").toLowerCase();
  if (!v) return false;
  const tokens = buyerArea
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 2);
  return tokens.some((t) => v.includes(t));
}
