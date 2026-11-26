import { getSession } from "@/lib/auth";
import { fail, handleError, ok, paginationFrom } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { restaurantSchema } from "@/lib/schemas";
import { toRestaurantCard } from "@/lib/serialize";
import { listRestaurants } from "@/lib/queries";
import { toLocation } from "@/lib/search";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const { page, limit } = paginationFrom(searchParams);
    const numberParam = (name: string) => {
      const raw = searchParams.get(name);
      return raw === null || raw === "" ? NaN : Number(raw);
    };

    await connectDB();
    return ok(
      await listRestaurants({
        viewerId: session?.userId,
        q: searchParams.get("q") ?? "",
        area: searchParams.get("area") ?? "",
        cuisine: searchParams.get("cuisine") ?? "",
        sort: searchParams.get("sort") ?? "",
        lat: numberParam("lat"),
        lng: numberParam("lng"),
        radiusKm: numberParam("radiusKm"),
        page,
        limit,
      }),
    );
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

    const { lat, lng, ...body } = restaurantSchema.parse(await request.json());
    const restaurant = await Restaurant.create({
      ...body,
      location: toLocation(lat, lng),
      owner: session.userId,
      ratingAvg: 0,
      ratingCount: 0,
    });
    return ok(toRestaurantCard(restaurant), 201);
  } catch (error) {
    return handleError(error);
  }
}
