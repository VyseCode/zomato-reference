import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { menuItemSchema, objectId } from "@/lib/schemas";
import { toMenuItem } from "@/lib/serialize";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";

const paramsSchema = z.object({ id: objectId });

export async function GET(
  request: Request,
  context: RouteContext<"/api/restaurants/[id]/menu">,
) {
  try {
    const { id } = paramsSchema.parse(await context.params);
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") ?? "").trim();
    const availableOnly = searchParams.get("availableOnly") === "1";

    await connectDB();
    if (!(await Restaurant.exists({ _id: id }))) {
      return fail("Restaurant not found", 404);
    }

    const filter: Record<string, unknown> = { restaurant: id };
    if (category) filter.category = category;
    if (availableOnly) filter.isAvailable = true;

    const docs = await MenuItem.find(filter).sort({ category: 1, name: 1 }).limit(100).lean();
    return ok({ items: docs.map(toMenuItem), total: docs.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/restaurants/[id]/menu">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const body = menuItemSchema.parse(await readJson(request));
    await connectDB();

    const restaurant = await Restaurant.findById(id).select("owner").lean();
    if (!restaurant) return fail("Restaurant not found", 404);
    if (restaurant.owner.toString() !== session.userId) {
      return fail("Only the restaurant owner can manage the menu", 403);
    }

    const item = await MenuItem.create({ ...body, restaurant: id });
    return ok(toMenuItem(item), 201);
  } catch (error) {
    return handleError(error);
  }
}
