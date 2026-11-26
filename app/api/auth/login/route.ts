import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await readJson(request));
    await connectDB();

    const user = await User.findOne({ email: body.email }).select("+password");
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      return fail("Invalid email or password", 401);
    }

    const token = await signSession({
      userId: user._id.toString(),
      email: user.email,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return ok({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
