import { getSession } from "@/lib/auth";
import { fail, handleError, ok, paginationFrom } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { listOrders, orderView } from "@/lib/orders";
import { orderCreateSchema } from "@/lib/schemas";
import { Address } from "@/models/Address";
import { Cart } from "@/models/Cart";
import { MenuItem } from "@/models/MenuItem";
import { Order } from "@/models/Order";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { searchParams } = new URL(request.url);
    const { page, limit } = paginationFrom(searchParams);
    const scope = searchParams.get("scope") === "partner" ? "partner" : "mine";

    await connectDB();
    if (scope === "partner") {
      const user = await User.findById(session.userId).select("roles").lean();
      if (!user?.roles.includes("partner")) {
        return fail("A partner account is required", 403);
      }
      const restaurants = await Restaurant.find({ owner: session.userId })
        .select("_id")
        .lean();
      return ok(
        await listOrders(
          { restaurant: { $in: restaurants.map((item) => item._id) } },
          page,
          limit,
        ),
      );
    }

    return ok(await listOrders({ user: session.userId }, page, limit));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { addressId } = orderCreateSchema.parse(await request.json());
    await connectDB();

    const cart = await Cart.findOne({ user: session.userId });
    if (!cart || cart.items.length === 0) {
      return fail("Your cart is empty", 400);
    }

    const address = await Address.findOne({
      _id: addressId,
      user: session.userId,
    }).lean();
    if (!address) return fail("Address not found", 404);

    const restaurant = await Restaurant.findById(cart.restaurant).lean();
    if (!restaurant) return fail("Restaurant not found", 404);
    if (!restaurant.isActive) {
      return fail("This restaurant is not accepting orders right now", 409);
    }

    const itemIds = cart.items.map((item) => item.menuItem);
    const menuDocs = await MenuItem.find({ _id: { $in: itemIds } }).lean();
    const menuById = new Map(
      menuDocs.map((item) => [item._id.toString(), item]),
    );
    for (const cartItem of cart.items) {
      const menuItem = menuById.get(cartItem.menuItem.toString());
      if (!menuItem || !menuItem.isAvailable) {
        return fail(
          `“${cartItem.name}” is no longer available. Please update your cart.`,
          409,
        );
      }
      if (menuItem.restaurant.toString() !== restaurant._id.toString()) {
        return fail("Your cart contains items from another restaurant", 409);
      }
    }

    const items = cart.items.map((cartItem) => {
      const menuItem = menuById.get(cartItem.menuItem.toString())!;
      return {
        menuItem: new Types.ObjectId(cartItem.menuItem.toString()),
        name: menuItem.name,
        price: menuItem.price,
        qty: cartItem.qty,
        _id: new Types.ObjectId(),
      };
    });
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0,
    );
    if (subtotal < restaurant.minimumOrder) {
      return fail(
        `Minimum order is ₹${restaurant.minimumOrder}. Add ₹${restaurant.minimumOrder - subtotal} more.`,
        400,
      );
    }

    const order = await Order.create({
      user: session.userId,
      restaurant: restaurant._id,
      address: address._id,
      addressSnapshot: {
        label: address.label,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        pincode: address.pincode,
        phone: address.phone,
      },
      items,
      subtotal,
      deliveryFee: restaurant.deliveryFee,
      total: subtotal + restaurant.deliveryFee,
      status: "placed",
      timeline: [{ status: "placed", note: "Order placed", at: new Date() }],
      cancelReason: "",
    });

    await Cart.updateOne(
      { user: session.userId },
      { $set: { items: [], restaurant: null } },
    );

    return ok(await orderView(order.toObject()), 201);
  } catch (error) {
    return handleError(error);
  }
}
