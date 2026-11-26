import { Types } from "mongoose";
import { Favorite } from "@/models/Favorite";
import { Restaurant } from "@/models/Restaurant";
import { toRestaurantCard, type RestaurantCardDTO } from "@/lib/serialize";
import {
  distanceKm,
  geoCenter,
  parseGeo,
  resolveSort,
  textQuery,
  type SortMode,
} from "@/lib/search";

type ListOptions = {
  viewerId?: string;
  q?: string;
  area?: string;
  cuisine?: string;
  sort?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
};

type SortSpec = Record<string, 1 | -1 | { $meta: "textScore" }>;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listRestaurants(options: ListOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isActive: true };
  const projection: Record<string, unknown> = {};
  const q = (options.q ?? "").trim();
  const area = (options.area ?? "").trim();
  const cuisine = (options.cuisine ?? "").trim();
  const search = textQuery(q);
  const geo = parseGeo(options.lat ?? NaN, options.lng ?? NaN, options.radiusKm ?? 10);
  const sortMode = resolveSort(options.sort ?? "", Boolean(search), Boolean(geo));
  const rankedByDistance = Boolean(geo) && sortMode === "distance" && !search;

  if (search) {
    filter.$text = { $search: search };
    projection.score = { $meta: "textScore" };
  } else if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: regex }, { cuisines: regex }, { area: regex }, { menuNames: regex }];
  }
  if (area) filter.area = new RegExp(`^${escapeRegex(area)}$`, "i");
  if (cuisine) filter.cuisines = new RegExp(escapeRegex(cuisine), "i");

  if (geo) {
    const center = geoCenter(geo);
    filter.location = rankedByDistance
      ? {
          $near: {
            $geometry: { type: "Point", coordinates: center },
            $maxDistance: geo.radiusKm * 1000,
          },
        }
      : { $geoWithin: { $centerSphere: [center, geo.radiusKm / 6371] } };
  }

  let sort: SortSpec | undefined;
  if (sortMode === "relevance") {
    sort = search
      ? { score: { $meta: "textScore" }, ratingAvg: -1, createdAt: -1 }
      : { ratingAvg: -1, ratingCount: -1, createdAt: -1 };
  } else if (sortMode === "rating") {
    sort = { ratingAvg: -1, ratingCount: -1 };
  } else if (sortMode === "eta") {
    sort = { etaMinutes: 1, ratingAvg: -1 };
  } else if (sortMode === "newest") {
    sort = { createdAt: -1 };
  }

  const favoriteDocs =
    options.viewerId && Types.ObjectId.isValid(options.viewerId)
      ? await Favorite.find({ user: options.viewerId }).select("restaurant").lean()
      : [];
  const favoriteIds = new Set(
    favoriteDocs.map((favorite) => favorite.restaurant.toString()),
  );

  const countFilter = rankedByDistance && geo
    ? {
        ...filter,
        location: {
          $geoWithin: { $centerSphere: [geoCenter(geo), geo.radiusKm / 6371] },
        },
      }
    : filter;
  const query = Restaurant.find(filter, projection);
  if (sort && !rankedByDistance) query.sort(sort);

  const [docs, total] = await Promise.all([
    query.skip(skip).limit(limit).lean(),
    Restaurant.countDocuments(countFilter),
  ]);

  const restaurants: RestaurantCardDTO[] = docs.map((doc) => {
    const card = toRestaurantCard(doc, favoriteIds);
    if (geo && doc.location?.coordinates?.length === 2) {
      const [lng, lat] = doc.location.coordinates;
      card.distanceKm = Math.round(distanceKm(geo.lat, geo.lng, lat, lng) * 10) / 10;
    }
    return card;
  });

  return {
    restaurants,
    page,
    limit,
    total,
    hasMore: skip + docs.length < total,
    sort: sortMode satisfies SortMode,
  };
}

export function areaOptions(cards: RestaurantCardDTO[]): string[] {
  return Array.from(new Set(cards.map((card) => card.area))).sort();
}
