import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { RestaurantCardDTO } from "@/lib/serialize";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardDTO }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md">
      <FavoriteButton restaurantId={restaurant.id} initialFavorite={restaurant.favorite} />
      <Link href={`/restaurants/${restaurant.id}`} className="block">
        <div className="relative h-36 bg-gradient-to-br from-[#ffb3a7] via-[#ffd6a5] to-[#ffe7c7]">
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-black uppercase tracking-widest text-white/70">
            {restaurant.name.slice(0, 2)}
          </div>
          <span className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700">
            {restaurant.etaMinutes} min
          </span>
          {!restaurant.isActive && (
            <span className="absolute left-2 top-2 rounded bg-slate-800/80 px-2 py-1 text-xs font-semibold text-white">
              Closed
            </span>
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-semibold text-slate-800 group-hover:text-[#e23744]">
              {restaurant.name}
            </h2>
            <span className="shrink-0 rounded bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white">
              {restaurant.ratingCount > 0 ? restaurant.ratingAvg.toFixed(1) : "NEW"} ★
            </span>
          </div>
          <p className="truncate text-xs text-slate-500">{restaurant.cuisines.join(", ")}</p>
          <p className="text-xs text-slate-500">{restaurant.area}</p>
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
            <span>₹{restaurant.minimumOrder} min</span>
            <span>₹{restaurant.deliveryFee} delivery</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
