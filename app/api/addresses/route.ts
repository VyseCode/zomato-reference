import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { addressSchema } from "@/lib/schemas";
import { toAddress } from "@/lib/serialize";
import { Address } from "@/models/Address";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("You must be signed in", 401);

  try {
    await connectDB();
    const docs = await Address.find({ user: session.userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .limit(50)
      .lean();
    return ok({ addresses: docs.map(toAddress) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const body = addressSchema.parse(await request.json());
    await connectDB();

    const count = await Address.countDocuments({ user: session.userId });
    if (body.isDefault || count === 0) {
      await Address.updateMany(
        { user: session.userId },
        { $set: { isDefault: false } },
      );
    }
    const address = await Address.create({
      ...body,
      user: session.userId,
      isDefault: body.isDefault || count === 0,
    });
    return ok(toAddress(address), 201);
  } catch (error) {
    return handleError(error);
  }
}
