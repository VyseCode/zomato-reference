import { getSession } from "@/lib/auth";
import { fail, handleError, ok, paginationFrom, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { restaurantSchema } from "@/lib/schemas";
import { toRestaurantCard } from "@/lib/serialize";
import { Favorite } from "@/models/Favorite";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = paginationFrom(searchParams);
    const q = (searchParams.get("q") ?? "").trim();
    const area = (searchParams.get("area") ?? "").trim();
    const cuisine = (searchParams.get("cuisine") ?? "").trim();
    const sort = searchParams.get("sort") ?? "newest";

    await connectDB();
    const filter: Record<string, unknown> = { isActive: true };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ name: regex }, { cuisines: regex }, { area: regex }];
    }
    if (area) {
      filter.area = new RegExp(`^${area.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }
    if (cuisine) {
      filter.cuisines = new RegExp(
        cuisine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
    }

    const sortSpec: Record<string, 1 | -1> =
      sort === "rating"
        ? { ratingAvg: -1, ratingCount: -1 }
        : sort === "eta"
          ? { etaMinutes: 1 }
          : { createdAt: -1 };

    const [docs, total, favorites] = await Promise.all([
      Restaurant.find(filter).sort(sortSpec).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments(filter),
      session
        ? Favorite.find({ user: session.userId }).select("restaurant").lean()
        : Promise.resolve([]),
    ]);
    const favoriteIds = new Set(
      favorites.map((favorite) => favorite.restaurant.toString()),
    );

    return ok({
      restaurants: docs.map((doc) => toRestaurantCard(doc, favoriteIds)),
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

    await connectDB();
    const actor = await User.findById(session.userId).select("roles").lean();
    if (!actor?.roles.includes("partner")) {
      return fail("A partner account is required to list restaurants", 403);
    }

    const body = restaurantSchema.parse(await readJson(request));
    const restaurant = await Restaurant.create({
      ...body,
      owner: session.userId,
      ratingAvg: 0,
      ratingCount: 0,
    });
    return ok(toRestaurantCard(restaurant), 201);
  } catch (error) {
    return handleError(error);
  }
}
