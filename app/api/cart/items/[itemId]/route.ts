import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getCartView } from "@/lib/cart";
import { objectId } from "@/lib/schemas";
import { Cart } from "@/models/Cart";

const paramsSchema = z.object({ itemId: objectId });
const bodySchema = z.object({
  qty: z.number().int().min(0).max(50),
});

async function setQty(
  _request: Request,
  context: RouteContext<"/api/cart/items/[itemId]">,
  deleteItem: boolean,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { itemId } = paramsSchema.parse(await context.params);
    const qty = deleteItem
      ? 0
      : bodySchema.parse(await _request.json()).qty;
    await connectDB();

    const cart = await Cart.findOne({ user: session.userId });
    if (!cart) return fail("Cart not found", 404);

    const index = cart.items.findIndex(
      (item) => item._id.toString() === itemId,
    );
    if (index === -1) return fail("Item not found in your cart", 404);

    if (qty === 0) {
      cart.items.splice(index, 1);
    } else {
      cart.items[index].qty = qty;
    }
    if (cart.items.length === 0) cart.restaurant = null;
    await cart.save();

    return ok({ cart: await getCartView(session.userId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/cart/items/[itemId]">,
) {
  return setQty(request, context, false);
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/cart/items/[itemId]">,
) {
  return setQty(request, context, true);
}
