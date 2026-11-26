import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getCustomerDashboard, getPartnerDashboard } from "@/lib/dashboards";
import { User } from "@/models/User";
import { PartnerUpgrade } from "@/components/PartnerUpgrade";

export const metadata = { title: "Dashboard" };

const statusLabels: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.userId).select("name roles").lean();
  const isPartner = Boolean(user?.roles.includes("partner"));
  const customer = await getCustomerDashboard(session.userId);
  const partner = isPartner ? await getPartnerDashboard(session.userId) : null;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hello, {user?.name ?? "there"}</h1>
        <p className="mt-1 text-sm text-slate-500">A quick summary of your activity.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Customer overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Orders" value={customer.ordersTotal} />
          <Stat label="Spent" value={`₹${customer.spent}`} />
          <Stat label="Delivered" value={customer.byStatus.delivered ?? 0} />
          <Stat label="Favorites" value={customer.favorites} />
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(customer.byStatus).map(([status, count]) => (
            <span key={status} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              {statusLabels[status]}: <strong>{count}</strong>
            </span>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent orders</h3>
            <Link href="/orders" className="text-sm font-medium text-[#e23744] hover:underline">All orders →</Link>
          </div>
          {customer.recentOrders.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="mt-2 divide-y divide-slate-100">
              {customer.recentOrders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="flex justify-between py-2 text-sm hover:text-[#e23744]">
                  <span>{order.restaurantName}</span>
                  <span className="text-slate-500">{statusLabels[order.status]} · ₹{order.total}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Partner overview</h2>
          {isPartner && (
            <Link href="/partner/restaurants/new" className="rounded-full bg-[#e23744] px-4 py-2 text-sm font-semibold text-white">
              Add restaurant
            </Link>
          )}
        </div>
        {!isPartner || !partner ? (
          <PartnerUpgrade />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Restaurants" value={partner.restaurants.length} />
              <Stat label="Partner orders" value={partner.ordersTotal} />
              <Stat label="Revenue" value={`₹${partner.revenue}`} />
              <Stat label="Avg rating" value={partner.ratingCount ? partner.avgRating.toFixed(1) : "NEW"} />
            </div>
            {partner.restaurants.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No restaurants listed yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {partner.restaurants.map((restaurant) => (
                  <Link key={restaurant.id} href={`/partner/restaurants/${restaurant.id}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800">{restaurant.name}</h3>
                      <span className="text-xs text-slate-500">{restaurant.isActive ? "Open" : "Closed"}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{restaurant.cuisines.join(", ")} · {restaurant.area}</p>
                    <p className="mt-2 text-sm font-medium text-[#e23744]">Manage menu →</p>
                  </Link>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Recent partner orders</h3>
                <Link href="/orders?scope=partner" className="text-sm font-medium text-[#e23744] hover:underline">All →</Link>
              </div>
              {partner.recentOrders.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No partner orders yet.</p>
              ) : (
                <div className="mt-2 divide-y divide-slate-100">
                  {partner.recentOrders.map((order) => (
                    <Link key={order.id} href={`/orders/${order.id}`} className="flex justify-between py-2 text-sm hover:text-[#e23744]">
                      <span>{order.restaurantName}</span>
                      <span className="text-slate-500">{statusLabels[order.status]} · ₹{order.total}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
