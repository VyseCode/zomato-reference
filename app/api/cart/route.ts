import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { getCartView } from "@/lib/cart";
import { connectDB } from "@/lib/db";
import { Cart } from "@/models/Cart";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("You must be signed in", 401);

  try {
    await connectDB();
    return ok({ cart: await getCartView(session.userId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return fail("You must be signed in", 401);

  try {
    await connectDB();
    await Cart.updateOne(
      { user: session.userId },
      { $set: { items: [], restaurant: null } },
    );
    return ok({ cart: { restaurant: null, items: [], subtotal: 0, deliveryFee: 0, minimumOrder: 0, total: 0, belowMinimum: false } });
  } catch (error) {
    return handleError(error);
  }
}
