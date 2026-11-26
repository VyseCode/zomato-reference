import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session || !Types.ObjectId.isValid(session.userId)) {
    return ok({ user: null });
  }

  await connectDB();
  const user = await User.findById(session.userId)
    .select("name email roles phone")
    .lean();

  if (!user) return ok({ user: null });

  return ok({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      roles: user.roles,
      phone: user.phone ?? "",
    },
  });
}
