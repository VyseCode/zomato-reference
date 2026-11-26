import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { canAccessOrder, orderView } from "@/lib/orders";
import { objectId } from "@/lib/schemas";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

const paramsSchema = z.object({ id: objectId });

export async function GET(
  _request: Request,
  context: RouteContext<"/api/orders/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    await connectDB();

    const order = await Order.findById(id).lean();
    if (!order) return fail("Order not found", 404);

    const user = await User.findById(session.userId).select("roles").lean();
    const access = await canAccessOrder(order, session.userId, user?.roles ?? []);
    if (!access.allowed) return fail("Order not found", 404);

    return ok({ order: await orderView(order) });
  } catch (error) {
    return handleError(error);
  }
}
