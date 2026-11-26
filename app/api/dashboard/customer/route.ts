import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getCustomerDashboard } from "@/lib/dashboards";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("You must be signed in", 401);

  try {
    await connectDB();
    return ok(await getCustomerDashboard(session.userId));
  } catch (error) {
    return handleError(error);
  }
}
