import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import {
  ACTOR_STATUSES,
  STATUS_TRANSITIONS,
  canAccessOrder,
  orderView,
} from "@/lib/orders";
import { objectId, orderStatusSchema } from "@/lib/schemas";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

const paramsSchema = z.object({ id: objectId });

export async function POST(
  request: Request,
  context: RouteContext<"/api/orders/[id]/status">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const { status, note } = orderStatusSchema.parse(await request.json());
    await connectDB();

    const order = await Order.findById(id).lean();
    if (!order) return fail("Order not found", 404);

    const user = await User.findById(session.userId).select("roles").lean();
    const access = await canAccessOrder(order, session.userId, user?.roles ?? []);
    if (!access.allowed) return fail("You are not involved in this order", 403);

    if (!STATUS_TRANSITIONS[order.status]?.includes(status)) {
      return fail(
        `Cannot change status from ${order.status} to ${status}`,
        409,
      );
    }
    if (ACTOR_STATUSES.has(status) && !access.isPartner) {
      return fail("Only the restaurant partner can advance this order", 403);
    }
    if (status === "cancelled" && !(access.isCustomer || access.isPartner)) {
      return fail("Only the customer or partner can cancel this order", 403);
    }

    await Order.updateOne(
      { _id: id, status: order.status },
      {
        $set: {
          status,
          cancelReason: status === "cancelled" ? note : order.cancelReason,
        },
        $push: { timeline: { status, note, at: new Date() } },
      },
    );

    const updated = await Order.findById(id).lean();
    if (!updated) return fail("Order not found", 404);
    return ok({ order: await orderView(updated) });
  } catch (error) {
    return handleError(error);
  }
}
