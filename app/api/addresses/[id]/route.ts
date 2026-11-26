import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { addressPatchSchema, objectId } from "@/lib/schemas";
import { toAddress } from "@/lib/serialize";
import { Address } from "@/models/Address";
import { Order } from "@/models/Order";

const paramsSchema = z.object({ id: objectId });

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/addresses/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const body = addressPatchSchema.parse(await request.json());
    await connectDB();

    const address = await Address.findById(id);
    if (!address) return fail("Address not found", 404);
    if (address.user.toString() !== session.userId) {
      return fail("You can only edit your own addresses", 403);
    }

    if (body.isDefault === true) {
      await Address.updateMany(
        { user: session.userId, _id: { $ne: address._id } },
        { $set: { isDefault: false } },
      );
    }
    Object.assign(address, body);
    await address.save();
    return ok(toAddress(address));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/addresses/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    await connectDB();

    const address = await Address.findById(id);
    if (!address) return fail("Address not found", 404);
    if (address.user.toString() !== session.userId) {
      return fail("You can only delete your own addresses", 403);
    }

    const openOrder = await Order.exists({
      address: address._id,
      status: { $nin: ["delivered", "cancelled"] },
    });
    if (openOrder) {
      return fail(
        "This address is used by an active order and cannot be deleted",
        409,
      );
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();
    if (wasDefault) {
      await Address.updateOne(
        { user: session.userId },
        { $set: { isDefault: true } },
      );
    }
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
