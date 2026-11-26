import Link from "next/link";
import { RestaurantCard } from "@/components/RestaurantCard";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listRestaurants } from "@/lib/queries";

export const metadata = { title: "Browse restaurants" };

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function pageLink(base: Record<string, string>, page: number) {
  const params = new URLSearchParams({ ...base, page: String(page) });
  return `/browse?${params.toString()}`;
}

export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  const raw = await searchParams;
  const q = param(raw.q);
  const filters = {
    q,
    area: param(raw.area),
    cuisine: param(raw.cuisine),
    lat: param(raw.lat),
    lng: param(raw.lng),
    radiusKm: param(raw.radiusKm) || "10",
    sort: param(raw.sort) || (q ? "relevance" : "newest"),
  };
  const page = Math.max(1, Number(param(raw.page)) || 1);

  const session = await getSession();
  await connectDB();
  const [{ restaurants, total, hasMore }, all] = await Promise.all([
    listRestaurants({
      ...filters,
      lat: filters.lat ? Number(filters.lat) : NaN,
      lng: filters.lng ? Number(filters.lng) : NaN,
      radiusKm: Number(filters.radiusKm),
      page,
      limit: 12,
      viewerId: session?.userId,
    }),
    listRestaurants({ limit: 50 }),
  ]);
  const areas = Array.from(new Set(all.restaurants.map((item) => item.area))).sort();
  const cuisines = Array.from(
    new Set(all.restaurants.flatMap((item) => item.cuisines)),
  ).sort();

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[#e23744] to-[#ff7a59] px-6 py-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Order food you love</h1>
        <p className="mt-1 text-sm text-white/90">
          Discover top-rated restaurants near you, delivered to your door.
        </p>
      </div>

      <form method="get" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search dishes, cuisines, restaurants, areas"
            aria-label="Search restaurants"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#e23744]"
          />
          <select name="area" defaultValue={filters.area} aria-label="Filter by area" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">All areas</option>
            {areas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <select name="cuisine" defaultValue={filters.cuisine} aria-label="Filter by cuisine" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">All cuisines</option>
            {cuisines.map((cuisine) => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select name="sort" defaultValue={filters.sort} aria-label="Sort restaurants" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="relevance">Relevance</option>
              <option value="distance">Nearest</option>
              <option value="rating">Top rated</option>
              <option value="eta">Fastest</option>
              <option value="newest">Newest</option>
            </select>
            <button type="submit" className="rounded-md bg-[#e23744] px-4 py-2 text-sm font-semibold text-white">
              Go
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-sm">
          <span className="text-slate-500">Near coordinates (optional):</span>
          <label className="flex items-center gap-1 text-slate-600">
            Latitude
            <input name="lat" type="number" step="any" defaultValue={filters.lat} placeholder="12.9719" aria-label="Latitude" className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex items-center gap-1 text-slate-600">
            Longitude
            <input name="lng" type="number" step="any" defaultValue={filters.lng} placeholder="77.6412" aria-label="Longitude" className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex items-center gap-1 text-slate-600">
            Radius
            <select name="radiusKm" defaultValue={filters.radiusKm} aria-label="Search radius" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="100">100 km</option>
            </select>
          </label>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          {total} {total === 1 ? "restaurant" : "restaurants"}
        </h2>
        {(filters.q || filters.area || filters.cuisine || filters.lat || filters.lng) && (
          <Link href="/browse" className="text-sm font-medium text-[#e23744] hover:underline">
            Clear filters
          </Link>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-semibold text-slate-700">No restaurants found</p>
          <p className="mt-1 text-sm text-slate-500">Try a different search or area.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 pb-4">
        {page > 1 && (
          <Link href={pageLink(filters, page - 1)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            ← Previous
          </Link>
        )}
        <span className="text-sm text-slate-500">Page {page}</span>
        {hasMore && (
          <Link href={pageLink(filters, page + 1)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
