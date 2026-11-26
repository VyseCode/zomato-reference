import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { OrderStatusControls } from "@/components/OrderStatusControls";
import { ReviewForm } from "@/components/ReviewForm";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { canAccessOrder, orderView } from "@/lib/orders";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

export const metadata = { title: "Order details" };

const statusLabels: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function OrderDetailPage({
  params,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  if (!Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const [order, user] = await Promise.all([
    Order.findById(id).lean(),
    User.findById(session.userId).select("roles").lean(),
  ]);
  if (!order) notFound();

  const access = await canAccessOrder(order, session.userId, user?.roles ?? []);
  if (!access.allowed) notFound();
  const orderDto = await orderView(order);

  return (
    <div className="space-y-5">
      <Link href="/orders" className="text-sm font-medium text-[#e23744] hover:underline">
        ← All orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{orderDto.restaurantName}</h1>
          <p className="mt-1 text-xs text-slate-500">
            Order #{orderDto.id.slice(-8)} · {new Date(orderDto.placedAt).toLocaleString()}
          </p>
        </div>
        <span className="rounded-full bg-[#fff1f2] px-4 py-2 text-sm font-semibold text-[#e23744]">
          {statusLabels[orderDto.status] ?? orderDto.status}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Items</h2>
            <div className="divide-y divide-slate-100">
              {orderDto.items.map((item) => (
                <div key={item.id} className="flex justify-between py-2 text-sm">
                  <span>{item.qty} × {item.name}</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 text-sm text-slate-600"><span>Delivery fee</span><span>₹{orderDto.deliveryFee}</span></div>
              <div className="flex justify-between pt-3 text-base font-semibold"><span>Total</span><span>₹{orderDto.total}</span></div>
            </div>
          </section>

          <OrderStatusControls
            orderId={orderDto.id}
            status={orderDto.status}
            canAdvance={access.isPartner}
            canCancel={access.isCustomer || access.isPartner}
          />

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Tracking timeline</h2>
            <ol className="space-y-3">
              {orderDto.timeline.map((entry) => (
                <li key={entry.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#e23744]" />
                  <div>
                    <p className="font-medium text-slate-800">{statusLabels[entry.status] ?? entry.status}</p>
                    <p className="text-xs text-slate-500">{new Date(entry.at).toLocaleString()}{entry.note ? ` · ${entry.note}` : ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
            <h2 className="mb-2 font-semibold text-slate-800">Delivery address</h2>
            <p className="font-medium">{orderDto.address.label}</p>
            <p className="text-slate-600">{orderDto.address.line1}{orderDto.address.line2 ? `, ${orderDto.address.line2}` : ""}</p>
            <p className="text-slate-500">{orderDto.address.city} {orderDto.address.pincode}</p>
            <p className="text-slate-500">{orderDto.address.phone}</p>
          </section>
          {orderDto.status === "delivered" && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
              <h2 className="mb-2 font-semibold text-slate-800">Rate your meal</h2>
              {orderDto.reviewed ? (
                <p className="text-green-700">Thanks for your review!</p>
              ) : (
                <ReviewForm restaurantId={orderDto.restaurantId} orderId={orderDto.id} />
              )}
              <Link href={`/restaurants/${orderDto.restaurantId}`} className="mt-3 inline-block font-medium text-[#e23744] hover:underline">
                View restaurant →
              </Link>
            </section>
          )}
          {orderDto.cancelReason && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-slate-800">Cancellation reason</h2>
              <p className="mt-1 text-slate-500">{orderDto.cancelReason}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
