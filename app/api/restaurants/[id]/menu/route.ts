import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, isDuplicateKeyError, ok, paginationFrom, readJson } from "@/lib/api";
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
    const { page, limit, skip } = paginationFrom(searchParams, 50);

    await connectDB();
    if (!(await Restaurant.exists({ _id: id }))) {
      return fail("Restaurant not found", 404);
    }

    const filter: Record<string, unknown> = { restaurant: id };
    if (category) filter.category = category;
    if (availableOnly) filter.isAvailable = true;

    const [docs, total] = await Promise.all([
      MenuItem.find(filter).sort({ category: 1, name: 1 }).skip(skip).limit(limit).lean(),
      MenuItem.countDocuments(filter),
    ]);
    return ok({
      items: docs.map(toMenuItem),
      page,
      limit,
      total,
      hasMore: skip + docs.length < total,
    });
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
    if (isDuplicateKeyError(error)) {
      return fail("A menu item with that name already exists", 409);
    }
    return handleError(error);
  }
}
