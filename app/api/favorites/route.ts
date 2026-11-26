import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, paginationFrom, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { objectId } from "@/lib/schemas";
import { toRestaurantCard } from "@/lib/serialize";
import { Favorite } from "@/models/Favorite";
import { Restaurant } from "@/models/Restaurant";

const bodySchema = z.object({ restaurantId: objectId });

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return fail("You must be signed in", 401);

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = paginationFrom(searchParams);
    await connectDB();

    const [docs, total] = await Promise.all([
      Favorite.find({ user: session.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Favorite.countDocuments({ user: session.userId }),
    ]);
    const ids = docs.map((doc) => doc.restaurant);
    const restaurants = await Restaurant.find({ _id: { $in: ids } }).lean();
    const favoriteIds = new Set(ids.map((id) => id.toString()));

    return ok({
      restaurants: restaurants.map((restaurant) =>
        toRestaurantCard(restaurant, favoriteIds),
      ),
      page,
      limit,
      total,
      hasMore: skip + docs.length < total,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { restaurantId } = bodySchema.parse(await readJson(request));
    await connectDB();

    if (!(await Restaurant.exists({ _id: restaurantId }))) {
      return fail("Restaurant not found", 404);
    }
    if (await Favorite.exists({ user: session.userId, restaurant: restaurantId })) {
      return fail("This restaurant is already a favorite", 409);
    }
    await Favorite.create({ user: session.userId, restaurant: restaurantId });
    return ok({ favorited: true, restaurantId }, 201);
  } catch (error) {
    return handleError(error);
  }
}
