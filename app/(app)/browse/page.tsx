import Link from "next/link";
import { RestaurantCard } from "@/components/RestaurantCard";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listRestaurants } from "@/lib/queries";

export const metadata = { title: "Browse restaurants" };

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function pageLink(
  base: { q: string; area: string; cuisine: string; sort: string },
  page: number,
) {
  const params = new URLSearchParams({ ...base, page: String(page) });
  return `/browse?${params.toString()}`;
}

export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  const raw = await searchParams;
  const filters = {
    q: param(raw.q),
    area: param(raw.area),
    cuisine: param(raw.cuisine),
    sort: param(raw.sort) || "newest",
  };
  const page = Math.max(1, Number(param(raw.page)) || 1);

  const session = await getSession();
  await connectDB();
  const [{ restaurants, total, hasMore }, all] = await Promise.all([
    listRestaurants({ ...filters, page, limit: 12, viewerId: session?.userId }),
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

      <form method="get" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Search by name, cuisine or area"
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
            <option value="newest">Newest</option>
            <option value="rating">Top rated</option>
            <option value="eta">Fastest</option>
          </select>
          <button type="submit" className="rounded-md bg-[#e23744] px-4 py-2 text-sm font-semibold text-white">
            Go
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          {total} {total === 1 ? "restaurant" : "restaurants"}
        </h2>
        {(filters.q || filters.area || filters.cuisine) && (
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
