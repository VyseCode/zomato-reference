"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AddressDTO, CartDTO } from "@/lib/serialize";

export function CartView({
  initialCart,
  addresses,
}: {
  initialCart: CartDTO;
  addresses: AddressDTO[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [addressId, setAddressId] = useState(
    addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await response.json()) as { cart?: CartDTO; error?: string };
      if (data.cart) setCart(data.cart);
      else if (data.error) setError(data.error);
      return response.ok;
    } catch {
      setError("Unable to reach the server. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    if (!addressId) {
      setError("Add a delivery address first");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId }),
      });
      const data = (await response.json()) as {
        order?: { id: string };
        error?: string;
      };
      if (!response.ok || !data.order) {
        setError(data.error ?? "Could not place the order");
        return;
      }
      router.push(`/orders/${data.order.id}`);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h2 className="text-lg font-semibold text-slate-800">Your cart is empty</h2>
        <p className="mt-1 text-sm text-slate-500">Add dishes from a restaurant to get started.</p>
        <Link href="/browse" className="mt-4 inline-block rounded-full bg-[#e23744] px-5 py-2.5 text-sm font-semibold text-white">
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <h2 className="font-semibold text-slate-800">{cart.restaurant?.name}</h2>
            <p className="text-xs text-slate-500">
              {cart.restaurant?.etaMinutes} min · ₹{cart.restaurant?.deliveryFee} delivery
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => update("/api/cart", "DELETE")}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Clear cart
          </button>
        </div>

        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-500">₹{item.price} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => update(`/api/cart/items/${item.id}`, "PATCH", { qty: item.qty - 1 })}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-lg text-slate-700"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => update(`/api/cart/items/${item.id}`, "PATCH", { qty: item.qty + 1 })}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-lg text-slate-700"
              >
                +
              </button>
            </div>
            <span className="w-16 text-right text-sm font-semibold">₹{item.price * item.qty}</span>
          </div>
        ))}
      </section>

      <aside className="space-y-3">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div className="flex justify-between text-slate-600"><span>Item total</span><span>₹{cart.subtotal}</span></div>
          <div className="flex justify-between text-slate-600"><span>Delivery fee</span><span>₹{cart.deliveryFee}</span></div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-800"><span>To pay</span><span>₹{cart.total}</span></div>
          {cart.belowMinimum && (
            <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Add ₹{cart.minimumOrder - cart.subtotal} more to reach the ₹{cart.minimumOrder} minimum order.
            </p>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-800">Deliver to</h3>
          {addresses.length === 0 ? (
            <p className="text-sm text-slate-500">
              <Link href="/addresses" className="font-medium text-[#e23744] hover:underline">
                Add an address
              </Link>
            </p>
          ) : (
            <select
              aria-label="Delivery address"
              value={addressId}
              onChange={(event) => setAddressId(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} — {address.line1}, {address.city}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="button"
          disabled={busy || cart.belowMinimum || addresses.length === 0}
          onClick={checkout}
          className="w-full rounded-full bg-[#e23744] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c72d39] disabled:opacity-50"
        >
          {busy ? "Placing order..." : `Place order · ₹${cart.total}`}
        </button>
      </aside>
    </div>
  );
}
