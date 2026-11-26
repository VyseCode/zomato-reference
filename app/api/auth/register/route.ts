import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User, type Role } from "@/models/User";
import { fail, handleError, isDuplicateKeyError, ok, readJson } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  roles: z
    .array(z.enum(["customer", "partner"]))
    .min(1)
    .max(2)
    .default(["customer"]),
});

function publicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  roles: string[];
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    roles: user.roles,
  };
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await readJson(request));
    await connectDB();

    if (await User.exists({ email: body.email })) {
      return fail("An account with that email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const roles: Role[] = Array.from(new Set<Role>(["customer", ...body.roles]));
    const user = await User.create({
      name: body.name,
      email: body.email,
      password: passwordHash,
      roles,
    });

    const token = await signSession({
      userId: user._id.toString(),
      email: user.email,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return ok({ user: publicUser(user) }, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return fail("An account with that email already exists", 409);
    }
    return handleError(error);
  }
}
