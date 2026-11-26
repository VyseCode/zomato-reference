import { Types } from "mongoose";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, paginationFrom, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { reviewCreateSchema } from "@/lib/schemas";
import { Order } from "@/models/Order";
import { Restaurant } from "@/models/Restaurant";
import { Review } from "@/models/Review";
import { User } from "@/models/User";

const paramsSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid restaurant id"),
});

export type ReviewDTO = {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  user: { id: string; name: string };
};

function toReview(doc: {
  _id: Types.ObjectId;
  rating: number;
  text: string;
  createdAt: Date;
  user: { _id: Types.ObjectId; name: string };
}): ReviewDTO {
  return {
    id: doc._id.toString(),
    rating: doc.rating,
    text: doc.text ?? "",
    createdAt: doc.createdAt.toISOString(),
    user: {
      id: doc.user?._id.toString() ?? "",
      name: doc.user?.name ?? "Diner",
    },
  };
}

export async function GET(
  request: Request,
  context: RouteContext<"/api/restaurants/[id]/reviews">,
) {
  try {
    const { id } = paramsSchema.parse(await context.params);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = paginationFrom(searchParams, 10);
    await connectDB();

    if (!(await Restaurant.exists({ _id: id }))) {
      return fail("Restaurant not found", 404);
    }
    const [rawDocs, total] = await Promise.all([
      Review.find({ restaurant: id })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ restaurant: id }),
    ]);
    const docs = rawDocs as unknown as Array<{
      _id: Types.ObjectId;
      rating: number;
      text: string;
      createdAt: Date;
      user: { _id: Types.ObjectId; name: string };
    }>;
    return ok({
      reviews: docs.map((doc) => toReview(doc)),
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
  context: RouteContext<"/api/restaurants/[id]/reviews">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const body = reviewCreateSchema.parse(await readJson(request));
    await connectDB();

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return fail("Restaurant not found", 404);

    const order = await Order.findById(body.orderId).lean();
    if (!order) return fail("Order not found", 404);
    if (order.user.toString() !== session.userId) {
      return fail("You can only review your own orders", 403);
    }
    if (order.restaurant.toString() !== id) {
      return fail("This order was not placed at this restaurant", 400);
    }
    if (order.status !== "delivered") {
      return fail("You can only review a delivered order", 409);
    }
    if (await Review.exists({ order: order._id })) {
      return fail("You already reviewed this order", 409);
    }

    const review = await Review.create({
      order: order._id,
      user: session.userId,
      restaurant: restaurant._id,
      rating: body.rating,
      text: body.text,
    });
    const count = restaurant.ratingCount;
    restaurant.ratingAvg =
      Math.round(((restaurant.ratingAvg * count + body.rating) / (count + 1)) * 10) / 10;
    restaurant.ratingCount = count + 1;
    await restaurant.save();

    const author = await User.findById(session.userId).select("name").lean();
    return ok(
      toReview({
        _id: review._id,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
        user: { _id: review.user, name: author?.name ?? "Diner" },
      }),
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
