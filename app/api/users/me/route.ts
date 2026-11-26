import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  becomePartner: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return fail("You must be signed in", 401);

  await connectDB();
  const user = await User.findById(session.userId)
    .select("name email roles phone avatarUrl createdAt")
    .lean();
  if (!user) return fail("Account not found", 404);

  return ok({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      roles: user.roles,
      phone: user.phone ?? "",
      avatarUrl: user.avatarUrl ?? "",
      joinedAt: user.createdAt.toISOString(),
    },
  });
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const body = patchSchema.parse(await readJson(request));
    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) return fail("Account not found", 404);

    if (body.name !== undefined) user.name = body.name;
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl;
    if (body.becomePartner && !user.roles.includes("partner")) {
      user.roles = Array.from(new Set([...user.roles, "partner"]));
    }
    await user.save();

    return ok({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        roles: user.roles,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      return fail("Invalid profile data", 400);
    }
    return handleError(error);
  }
}
