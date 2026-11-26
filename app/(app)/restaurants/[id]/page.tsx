import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { MenuBrowser } from "@/components/MenuBrowser";
import { getSession } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { connectDB } from "@/lib/db";
import { toMenuItem } from "@/lib/serialize";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";

export const metadata = { title: "Restaurant menu" };

export default async function RestaurantPage({
  params,
}: PageProps<"/restaurants/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  if (!Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const [restaurant, menuItems, cart] = await Promise.all([
    Restaurant.findById(id).lean(),
    MenuItem.find({ restaurant: id }).sort({ category: 1, name: 1 }).lean(),
    getCartView(session.userId),
  ]);
  if (!restaurant) notFound();

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
    </div>
  );
}
