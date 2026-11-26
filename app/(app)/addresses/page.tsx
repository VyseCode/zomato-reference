import { AddressManager } from "@/components/AddressManager";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { toAddress } from "@/lib/serialize";
import { Address } from "@/models/Address";

export const metadata = { title: "Delivery addresses" };

export default async function AddressesPage() {
  const session = await getSession();
  if (!session) return null;

  await connectDB();
  const addresses = await Address.find({ user: session.userId })
    .sort({ isDefault: -1, createdAt: -1 })
    .limit(50)
    .lean();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Delivery addresses</h1>
        <p className="mt-1 text-sm text-slate-500">
          Addresses attached to an active order cannot be deleted.
        </p>
      </div>
      <AddressManager initial={addresses.map(toAddress)} />
    </div>
  );
}
