import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { objectId } from "@/lib/schemas";
import { Favorite } from "@/models/Favorite";

const paramsSchema = z.object({ restaurantId: objectId });

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/favorites/[restaurantId]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { restaurantId } = paramsSchema.parse(await context.params);
    await connectDB();

    const deleted = await Favorite.findOneAndDelete({
      user: session.userId,
      restaurant: restaurantId,
    });
    if (!deleted) return fail("Favorite not found", 404);
    return ok({ favorited: false, restaurantId });
  } catch (error) {
    return handleError(error);
  }
}
