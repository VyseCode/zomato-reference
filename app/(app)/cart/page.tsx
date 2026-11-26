import { CartView } from "@/components/CartView";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getCartView } from "@/lib/cart";
import { toAddress } from "@/lib/serialize";
import { Address } from "@/models/Address";

export const metadata = { title: "Your cart" };

export default async function CartPage() {
  const session = await getSession();
  if (!session) return null;

  await connectDB();
  const [cart, addresses] = await Promise.all([
    getCartView(session.userId),
    Address.find({ user: session.userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Your cart</h1>
        <p className="mt-1 text-sm text-slate-500">One restaurant at a time, with transparent fees.</p>
      </div>
      <CartView initialCart={cart} addresses={addresses.map(toAddress)} />
    </div>
  );
}
