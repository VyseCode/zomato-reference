import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getCartView } from "@/lib/cart";
import { objectId } from "@/lib/schemas";
import { Cart } from "@/models/Cart";
import { MenuItem } from "@/models/MenuItem";

const schema = z.object({
  menuItemId: objectId,
  qty: z.number().int().min(1).max(50).default(1),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const body = schema.parse(await request.json());
    await connectDB();

    const menuItem = await MenuItem.findById(body.menuItemId).lean();
    if (!menuItem) return fail("Menu item not found", 404);
    if (!menuItem.isAvailable) return fail("This menu item is unavailable", 409);

    let cart = await Cart.findOne({ user: session.userId });
    if (!cart) cart = new Cart({ user: session.userId, items: [], restaurant: null });

    if (
      cart.restaurant &&
      cart.restaurant.toString() !== menuItem.restaurant.toString()
    ) {
      return fail(
        "Your cart already contains items from another restaurant. Clear it first.",
        409,
      );
    }

    const existing = cart.items.find(
      (item) => item.menuItem.toString() === body.menuItemId,
    );
    if (existing) {
      if (existing.qty + body.qty > 50) {
        return fail("Maximum quantity per item is 50", 400);
      }
      existing.qty += body.qty;
    } else {
      cart.items.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        qty: body.qty,
        isVeg: menuItem.isVeg,
      } as unknown as (typeof cart.items)[number]);
    }
    cart.restaurant = menuItem.restaurant;
    await cart.save();

    return ok({ cart: await getCartView(session.userId) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
