import { listOrders } from "@/lib/orders";
import { toRestaurantCard } from "@/lib/serialize";
import { Favorite } from "@/models/Favorite";
import { Order } from "@/models/Order";
import { Restaurant } from "@/models/Restaurant";
import { Review } from "@/models/Review";

const STATUSES = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function emptyByStatus() {
  const result: Record<string, number> = {};
  for (const status of STATUSES) result[status] = 0;
  return result;
}

export async function getCustomerDashboard(userId: string) {
  const [orders, reviews, favorites, recent] = await Promise.all([
    Order.find({ user: userId }).select("status total").lean(),
    Review.countDocuments({ user: userId }),
    Favorite.countDocuments({ user: userId }),
    listOrders({ user: userId }, 1, 5),
  ]);

  const byStatus = emptyByStatus();
  let spent = 0;
  for (const order of orders) {
    byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
    if (order.status !== "cancelled") spent += order.total;
  }

  return {
    ordersTotal: orders.length,
    byStatus,
    spent: Math.round(spent * 100) / 100,
    reviews,
    favorites,
    recentOrders: recent.orders,
  };
}

export async function getPartnerDashboard(userId: string) {
  const restaurants = await Restaurant.find({ owner: userId }).lean();
  const ids = restaurants.map((restaurant) => restaurant._id);
  const [orders, recent] = await Promise.all([
    Order.find({ restaurant: { $in: ids } }).select("status total").lean(),
    listOrders({ restaurant: { $in: ids } }, 1, 5),
  ]);

  const byStatus = emptyByStatus();
  let revenue = 0;
  for (const order of orders) {
    byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
    if (order.status !== "cancelled") revenue += order.total;
  }

  const ratingUnits = restaurants.reduce(
    (sum, restaurant) => sum + restaurant.ratingAvg * restaurant.ratingCount,
    0,
  );
  const ratingCount = restaurants.reduce(
    (sum, restaurant) => sum + restaurant.ratingCount,
    0,
  );

  return {
    restaurants: restaurants.map((restaurant) => toRestaurantCard(restaurant)),
    ordersTotal: orders.length,
    byStatus,
    revenue: Math.round(revenue * 100) / 100,
    avgRating: ratingCount ? Math.round((ratingUnits / ratingCount) * 10) / 10 : 0,
    ratingCount,
    recentOrders: recent.orders,
  };
}
