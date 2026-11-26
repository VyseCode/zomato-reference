import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";

export type GeoFilter = {
  lat: number;
  lng: number;
  radiusKm: number;
};

export type SortMode = "relevance" | "distance" | "rating" | "eta" | "newest";

const EARTH_RADIUS_KM = 6371;

export function parseGeo(lat: number, lng: number, radiusKm: number): GeoFilter | null {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }
  const radius = Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : 10;
  return { lat, lng, radiusKm: Math.min(radius, 100) };
}

export function geoCenter(geo: GeoFilter): [number, number] {
  return [geo.lng, geo.lat];
}

export function toLocation(lat?: number, lng?: number) {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return undefined;
  }
  return { type: "Point" as const, coordinates: [lng, lat] as [number, number] };
}

export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function textQuery(q: string): string | null {
  const terms = q
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1);
  return terms.length ? terms.join(" ") : null;
}

export function resolveSort(requested: string, hasText: boolean, hasGeo: boolean): SortMode {
  if (requested === "distance") {
    return hasText ? "relevance" : hasGeo ? "distance" : "newest";
  }
  if (
    requested === "relevance" ||
    requested === "rating" ||
    requested === "eta" ||
    requested === "newest"
  ) {
    return requested;
  }
  if (hasText) return "relevance";
  if (hasGeo) return "distance";
  return "newest";
}

export async function refreshMenuNames(restaurantId: string): Promise<void> {
  const names = await MenuItem.find({ restaurant: restaurantId, isAvailable: true }).distinct(
    "name",
  );
  await Restaurant.updateOne({ _id: restaurantId }, { $set: { menuNames: names } });
}
