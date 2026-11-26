import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { objectId, restaurantPatchSchema } from "@/lib/schemas";
import { toRestaurantCard } from "@/lib/serialize";
import { Favorite } from "@/models/Favorite";
import { Restaurant } from "@/models/Restaurant";

const paramsSchema = z.object({
  id: objectId,
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/restaurants/[id]">,
) {
  try {
    const { id } = paramsSchema.parse(await context.params);
    const session = await getSession();
    await connectDB();

    const restaurant = await Restaurant.findById(id).lean();
    if (!restaurant) return fail("Restaurant not found", 404);

    let favorite = false;
    if (session) {
      favorite = Boolean(
        await Favorite.exists({ user: session.userId, restaurant: id }),
      );
    }
    return ok(toRestaurantCard(restaurant, new Set(favorite ? [id] : [])));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/restaurants/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const body = restaurantPatchSchema.parse(await readJson(request));
    await connectDB();

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return fail("Restaurant not found", 404);
    if (restaurant.owner.toString() !== session.userId) {
      return fail("Only the restaurant owner can edit it", 403);
    }

    Object.assign(restaurant, body);
    await restaurant.save();
    return ok(toRestaurantCard(restaurant));
  } catch (error) {
    return handleError(error);
  }
}
