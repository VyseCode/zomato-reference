import { Types } from "mongoose";
import { Favorite } from "@/models/Favorite";
import { Restaurant } from "@/models/Restaurant";
import { toRestaurantCard, type RestaurantCardDTO } from "@/lib/serialize";

type ListOptions = {
  viewerId?: string;
  q?: string;
  area?: string;
  cuisine?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listRestaurants(options: ListOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };
  const q = (options.q ?? "").trim();
  const area = (options.area ?? "").trim();
  const cuisine = (options.cuisine ?? "").trim();

  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: regex }, { cuisines: regex }, { area: regex }];
  }
  if (area) filter.area = new RegExp(`^${escapeRegex(area)}$`, "i");
  if (cuisine) filter.cuisines = new RegExp(escapeRegex(cuisine), "i");

  const sort =
    options.sort === "rating"
      ? ({ ratingAvg: -1, ratingCount: -1 } as Record<string, 1 | -1>)
      : options.sort === "eta"
        ? ({ etaMinutes: 1 } as Record<string, 1 | -1>)
        : ({ createdAt: -1 } as Record<string, 1 | -1>);

  const favoriteDocs =
    options.viewerId && Types.ObjectId.isValid(options.viewerId)
      ? await Favorite.find({ user: options.viewerId }).select("restaurant").lean()
      : [];
  const favoriteIds = new Set(
    favoriteDocs.map((favorite) => favorite.restaurant.toString()),
  );

  const [docs, total] = await Promise.all([
    Restaurant.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Restaurant.countDocuments(filter),
  ]);

  return {
    restaurants: docs.map((doc) => toRestaurantCard(doc, favoriteIds)),
    page,
    limit,
    total,
    hasMore: skip + docs.length < total,
  };
}

export function areaOptions(cards: RestaurantCardDTO[]): string[] {
  return Array.from(new Set(cards.map((card) => card.area))).sort();
}
