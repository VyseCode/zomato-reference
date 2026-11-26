import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { menuItemPatchSchema, objectId } from "@/lib/schemas";
import { refreshMenuNames } from "@/lib/search";
import { toMenuItem } from "@/lib/serialize";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";

const paramsSchema = z.object({ itemId: objectId });

async function ownedItem(itemId: string, userId: string) {
  const item = await MenuItem.findById(itemId);
  if (!item) return fail("Menu item not found", 404);
  const restaurant = await Restaurant.findById(item.restaurant).select("owner").lean();
  if (!restaurant || restaurant.owner.toString() !== userId) {
    return fail("Only the restaurant owner can manage the menu", 403);
  }
  return item;
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/menu/[itemId]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { itemId } = paramsSchema.parse(await context.params);
    const body = menuItemPatchSchema.parse(await readJson(request));
    await connectDB();

    const item = await ownedItem(itemId, session.userId);
    if (item instanceof Response) return item;

    Object.assign(item, body);
    await item.save();
    await refreshMenuNames(item.restaurant.toString());
    return ok(toMenuItem(item));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/menu/[itemId]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { itemId } = paramsSchema.parse(await context.params);
    await connectDB();

    const item = await ownedItem(itemId, session.userId);
    if (item instanceof Response) return item;

    await item.deleteOne();
    await refreshMenuNames(item.restaurant.toString());
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
