import { Types } from "mongoose";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { reviewPatchSchema } from "@/lib/schemas";
import { Restaurant } from "@/models/Restaurant";
import { Review } from "@/models/Review";

const paramsSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid review id"),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/reviews/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const body = reviewPatchSchema.parse(await readJson(request));
    await connectDB();

    const review = await Review.findById(id);
    if (!review) return fail("Review not found", 404);
    if (review.user.toString() !== session.userId) {
      return fail("Only the author can edit this review", 403);
    }

    const oldRating = review.rating;
    if (body.rating !== undefined) review.rating = body.rating;
    if (body.text !== undefined) review.text = body.text;
    await review.save();

    if (body.rating !== undefined && body.rating !== oldRating) {
      const restaurant = await Restaurant.findById(review.restaurant);
      if (restaurant && restaurant.ratingCount > 0) {
        restaurant.ratingAvg =
          Math.round(
            Math.min(
              5,
              Math.max(
                0,
                restaurant.ratingAvg +
                  (body.rating - oldRating) / restaurant.ratingCount,
              ),
            ) * 10,
          ) / 10;
        await restaurant.save();
      }
    }

    return ok({
      review: {
        id: review._id.toString(),
        rating: review.rating,
        text: review.text,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
