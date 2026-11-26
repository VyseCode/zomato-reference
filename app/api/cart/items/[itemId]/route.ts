import { Types } from "mongoose";
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
  request: Request,
  context: RouteContext<"/api/cart/items/[itemId]">,
  deleteItem: boolean,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { itemId } = paramsSchema.parse(await context.params);
    const qty = deleteItem ? 0 : bodySchema.parse(await request.json()).qty;
    await connectDB();

    const cart = await Cart.findOne({ user: session.userId }).lean();
    if (!cart) return fail("Cart not found", 404);

    const item = cart.items.find((entry) => entry._id.toString() === itemId);
    if (!item) return fail("Item not found in your cart", 404);

    if (qty === 0) {
      await Cart.updateOne(
        { user: session.userId },
        { $pull: { items: { _id: new Types.ObjectId(itemId) } } },
      );
    } else {
      const result = await Cart.updateOne(
        { user: session.userId, "items._id": itemId, "items.qty": item.qty },
        { $inc: { "items.$.qty": qty - item.qty } },
      );
      if (!result.matchedCount) {
        return fail("Cart changed, please retry", 409);
      }
    }

    await Cart.updateOne(
      { user: session.userId, items: { $size: 0 } },
      { $set: { restaurant: null } },
    );
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
