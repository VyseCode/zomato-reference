import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listOrders } from "@/lib/orders";
import { User } from "@/models/User";
import { Restaurant } from "@/models/Restaurant";

export const metadata = { title: "Orders" };

const statusLabels: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const session = await getSession();
  if (!session) return null;

  const raw = await searchParams;
  const scope = Array.isArray(raw.scope) ? raw.scope[0] : raw.scope;
  const partnerScope = scope === "partner";

  await connectDB();
  const user = await User.findById(session.userId).select("roles").lean();
  let filter: Record<string, unknown> = { user: session.userId };
  if (partnerScope && user?.roles.includes("partner")) {
    const restaurants = await Restaurant.find({ owner: session.userId }).select("_id").lean();
    filter = { restaurant: { $in: restaurants.map((item) => item._id) } };
  }
  const { orders } = await listOrders(filter, 1, 50);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {partnerScope ? "Partner orders" : "Your orders"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Track status and order again.</p>
        </div>
        {user?.roles.includes("partner") && (
          <div className="flex gap-2 text-sm">
            <Link href="/orders" className={`rounded-full px-4 py-2 ${partnerScope ? "border border-slate-300" : "bg-[#e23744] text-white"}`}>
              My orders
            </Link>
            <Link href="/orders?scope=partner" className={`rounded-full px-4 py-2 ${partnerScope ? "bg-[#e23744] text-white" : "border border-slate-300"}`}>
              Partner orders
            </Link>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-semibold text-slate-700">No orders here yet</p>
          <Link href="/browse" className="mt-2 inline-block text-sm font-medium text-[#e23744] hover:underline">
            Find something to eat →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-slate-800">{order.restaurantName}</h2>
                  <p className="text-xs text-slate-500">
                    {new Date(order.placedAt).toLocaleString()} · {order.items.reduce((sum, item) => sum + item.qty, 0)} items
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {statusLabels[order.status] ?? order.status}
                  </span>
                  <p className="mt-1 text-sm font-semibold">₹{order.total}</p>
                </div>
              </div>
              <p className="mt-2 truncate text-sm text-slate-500">
                {order.items.map((item) => `${item.qty}× ${item.name}`).join(", ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
