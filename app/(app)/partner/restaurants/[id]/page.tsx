import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";
import { RestaurantForm } from "@/components/RestaurantForm";
import { MenuManager } from "@/components/MenuManager";
import { toMenuItem, toRestaurantCard } from "@/lib/serialize";

export const metadata = { title: "Manage restaurant" };

export default async function ManageRestaurantPage({
  params,
}: PageProps<"/partner/restaurants/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const restaurant = await Restaurant.findById(id).lean();
  if (!restaurant || restaurant.owner.toString() !== session.userId) notFound();

  const items = await MenuItem.find({ restaurant: id }).sort({ category: 1, name: 1 }).lean();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-[#e23744] hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">Manage {restaurant.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update restaurant details and keep the menu current.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Restaurant details</h2>
        <RestaurantForm restaurant={toRestaurantCard(restaurant)} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Menu</h2>
        <MenuManager restaurantId={id} initialItems={items.map(toMenuItem)} />
      </section>
    </div>
  );
}
