import { Types } from "mongoose";
import { Order } from "@/models/Order";
import { Restaurant } from "@/models/Restaurant";
import { Review } from "@/models/Review";
import { toOrder, type OrderDTO } from "@/lib/serialize";

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const ACTOR_STATUSES = new Set([
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
]);

export async function orderView(doc: {
  _id: Types.ObjectId;
  restaurant: Types.ObjectId;
  status: string;
  items: Array<{ _id: Types.ObjectId; name: string; price: number; qty: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addressSnapshot: {
    label: string;
    line1: string;
    line2: string;
    city: string;
    pincode: string;
    phone: string;
  };
  timeline: Array<{
    _id: Types.ObjectId;
    status: string;
    at: Date;
    note: string;
  }>;
  cancelReason: string;
  placedAt: Date;
}): Promise<OrderDTO> {
  const [restaurant, review] = await Promise.all([
    Restaurant.findById(doc.restaurant).select("name").lean(),
    Review.exists({ order: doc._id }),
  ]);
  return toOrder(doc, restaurant?.name ?? "Unknown restaurant", Boolean(review));
}

export async function listOrders(
  filter: Record<string, unknown>,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ placedAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  const orders = [];
  for (const doc of docs) orders.push(await orderView(doc));
  return { orders, page, limit, total, hasMore: skip + docs.length < total };
}

export async function canAccessOrder(
  order: { user: Types.ObjectId; restaurant: Types.ObjectId },
  userId: string,
  roles: string[],
): Promise<{ isCustomer: boolean; isPartner: boolean; allowed: boolean }> {
  const isCustomer = order.user.toString() === userId;
  let isPartner = false;
  if (roles.includes("partner")) {
    const restaurant = await Restaurant.findById(order.restaurant).select("owner").lean();
    isPartner = restaurant?.owner.toString() === userId;
  }
  return { isCustomer, isPartner, allowed: isCustomer || isPartner };
}
