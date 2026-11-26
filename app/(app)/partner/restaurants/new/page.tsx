import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { RestaurantForm } from "@/components/RestaurantForm";

export const metadata = { title: "New restaurant" };

export default async function NewRestaurantPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.userId).select("roles").lean();
  if (!user?.roles.includes("partner")) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-[#e23744] hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">List a new restaurant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set your delivery radius, fees and minimum order. You can edit these later.
        </p>
      </div>
      <RestaurantForm />
    </div>
  );
}
