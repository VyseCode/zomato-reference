import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { FavoriteButton } from "@/components/FavoriteButton";
import { MenuBrowser } from "@/components/MenuBrowser";
import { getSession } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { connectDB } from "@/lib/db";
import { toMenuItem } from "@/lib/serialize";
import { Favorite } from "@/models/Favorite";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";
import { Review } from "@/models/Review";

export const metadata = { title: "Restaurant menu" };

function reviewAuthorName(user: unknown): string {
  if (user && typeof user === "object" && "name" in user) {
    return String((user as { name?: unknown }).name ?? "Diner");
  }
  return "Diner";
}

export default async function RestaurantPage({
  params,
}: PageProps<"/restaurants/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  if (!Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const [restaurant, menuItems, cart, reviews] = await Promise.all([
    Restaurant.findById(id).lean(),
    MenuItem.find({ restaurant: id }).sort({ category: 1, name: 1 }).limit(100).lean(),
    getCartView(session.userId),
    Review.find({ restaurant: id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);
  if (!restaurant) notFound();
  const isFavorite = Boolean(
    await Favorite.exists({ user: session.userId, restaurant: id }),
  );

  return (
    <div className="space-y-6">
      <Link href="/browse" className="text-sm font-medium text-[#e23744] hover:underline">
        ← All restaurants
      </Link>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="h-32 bg-gradient-to-r from-[#ffb3a7] via-[#ffd6a5] to-[#ffe7c7]" />
        <div className="space-y-2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{restaurant.name}</h1>
            <FavoriteButton restaurantId={id} initialFavorite={isFavorite} className="relative inline-flex" />
            <span className="rounded bg-green-600 px-2 py-1 text-sm font-bold text-white">
              {restaurant.ratingCount > 0 ? restaurant.ratingAvg.toFixed(1) : "NEW"} ★
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {restaurant.cuisines.join(", ")} · {restaurant.area}
          </p>
          <p className="text-sm text-slate-600">{restaurant.description}</p>
          <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>{restaurant.etaMinutes} min delivery</span>
            <span>₹{restaurant.deliveryFee} delivery fee</span>
            <span>₹{restaurant.minimumOrder} minimum order</span>
            <span>{restaurant.ratingCount} ratings</span>
          </div>
          {!restaurant.isActive && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This restaurant is currently not accepting orders.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Menu</h2>
        <MenuBrowser items={menuItems.map(toMenuItem)} initialCart={cart} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Ratings & reviews {restaurant.ratingCount > 0 && <span className="text-sm font-normal text-slate-500">({restaurant.ratingAvg.toFixed(1)} ★ from {restaurant.ratingCount})</span>}
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet. Delivered orders can be reviewed once.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <div key={review._id.toString()} className="py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">{review.rating} ★</span>
                  <span className="text-sm font-medium text-slate-800">
                    {reviewAuthorName(review.user)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{review.text || "No comment"}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
