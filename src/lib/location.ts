// Location utilities: localStorage-backed buyer area/coords hooks, geolocation + reverse geocoding, and distance/area matching helpers.
import { useState } from "react";

const AREA_KEY = "vengryd-area";
const COORDS_KEY = "vengryd-coords";

export type Coords = { lat: number; lng: number };

/** Buyer's GPS coordinates, persisted in localStorage. */
export function useBuyerCoords() {
  const [coords, setCoordsState] = useState<Coords | null>(() => {
    try {
      const raw = localStorage.getItem(COORDS_KEY);
      if (!raw) return null;
      const v = JSON.parse(raw) as Partial<Coords>;
      // Discard malformed/old-schema data so distance math never sees NaN.
      return typeof v?.lat === "number" && typeof v?.lng === "number" && Number.isFinite(v.lat) && Number.isFinite(v.lng)
        ? { lat: v.lat, lng: v.lng }
        : null;
    } catch {
      return null;
    }
  });
  const setCoords = (next: Coords | null) => {
    setCoordsState(next);
    try {
      if (next) localStorage.setItem(COORDS_KEY, JSON.stringify(next));
      else localStorage.removeItem(COORDS_KEY);
    } catch {
      /* ignore storage errors */
    }
  };
  return [coords, setCoords] as const;
}

/** Promise wrapper around the browser geolocation API. */
export function getCurrentCoords(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location isn't supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.code === err.PERMISSION_DENIED ? "Location permission denied." : "Couldn't get your location.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

/** Turn coordinates into a readable area name (free, no API key). Returns "" on failure. */
export async function reverseGeocode(c: Coords): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${c.lat}&longitude=${c.lng}&localityLanguage=en`,
    );
    if (!res.ok) return "";
    const d = (await res.json()) as { locality?: string; city?: string; principalSubdivision?: string };
    const parts = [d.locality || d.city, d.principalSubdivision].filter(Boolean);
    return parts.join(", ");
  } catch {
    return "";
  }
}

/** Great-circle distance in kilometres (haversine). */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

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
