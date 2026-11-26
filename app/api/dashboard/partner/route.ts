import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getPartnerDashboard } from "@/lib/dashboards";
import { User } from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("You must be signed in", 401);

  try {
    await connectDB();
    const user = await User.findById(session.userId).select("roles").lean();
    if (!user?.roles.includes("partner")) {
      return fail("A partner account is required", 403);
    }
    return ok(await getPartnerDashboard(session.userId));
  } catch (error) {
    return handleError(error);
  }
}
