import Link from "next/link";
import { RestaurantCard } from "@/components/RestaurantCard";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Favorite } from "@/models/Favorite";
import { Restaurant } from "@/models/Restaurant";
import { toRestaurantCard } from "@/lib/serialize";

export const metadata = { title: "Favorites" };

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) return null;

  await connectDB();
  const docs = await Favorite.find({ user: session.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const ids = docs.map((doc) => doc.restaurant);
  const restaurants = await Restaurant.find({ _id: { $in: ids } }).lean();
  const favoriteIds = new Set(ids.map((id) => id.toString()));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Your favorites</h1>
        <p className="mt-1 text-sm text-slate-500">Quick access to the places you love.</p>
      </div>
      {restaurants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-semibold text-slate-700">No favorites yet</p>
          <Link href="/browse" className="mt-2 inline-block text-sm font-medium text-[#e23744] hover:underline">
            Browse restaurants →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant._id.toString()} restaurant={toRestaurantCard(restaurant, favoriteIds)} />
          ))}
        </div>
      )}
    </div>
  );
}
