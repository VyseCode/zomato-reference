"use client";

import Link from "next/link";
import { useState } from "react";
import type { CartDTO, MenuItemDTO } from "@/lib/serialize";

export function MenuBrowser({
  items,
  initialCart,
}: {
  items: MenuItemDTO[];
  initialCart: CartDTO;
}) {
  const [cart, setCart] = useState(initialCart);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const categories = Array.from(new Set(items.map((item) => item.category)));

  async function send(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await response.json()) as { cart?: CartDTO; error?: string };
      if (!response.ok || !data.cart) {
        setError(data.error ?? "Could not update your cart");
        return false;
      }
      setCart(data.cart);
      return true;
    } catch {
      setError("Unable to reach the server. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function qtyOf(itemId: string) {
    return cart.items.find((item) => item.menuItem === itemId)?.qty ?? 0;
  }

  return (
    <div className="space-y-6">
      {cart.items.length > 0 && (
        <div className="sticky top-16 z-20 flex items-center justify-between rounded-lg border border-[#e23744]/30 bg-[#fff5f5] px-4 py-3 text-sm shadow-sm">
          <span>
            <strong>{cart.items.reduce((sum, item) => sum + item.qty, 0)} items</strong> from{" "}
            {cart.restaurant?.name} · ₹{cart.subtotal}
          </span>
          <Link href="/cart" className="rounded-full bg-[#e23744] px-4 py-2 font-semibold text-white">
            View cart
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          This restaurant has no menu items yet.
        </p>
      ) : (
        categories.map((category) => (
          <section key={category} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
              {category}
            </h2>
            <div className="divide-y divide-slate-100">
              {items
                .filter((item) => item.category === category)
                .map((item) => {
                  const qty = qtyOf(item.id);
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-4 w-4 items-center justify-center rounded-sm border-2"
                            style={{ borderColor: item.isVeg ? "#16a34a" : "#dc2626" }}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: item.isVeg ? "#16a34a" : "#dc2626" }}
                            />
                          </span>
                          <h3 className="font-medium text-slate-800">{item.name}</h3>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {item.description}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">₹{item.price}</p>
                      </div>
                      {!item.isAvailable ? (
                        <span className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                          Unavailable
                        </span>
                      ) : qty > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={async () => {
                              const cartItem = cart.items.find((entry) => entry.menuItem === item.id);
                              if (cartItem) await send(`/api/cart/items/${cartItem.id}`, "PATCH", { qty: cartItem.qty - 1 });
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e23744] text-lg font-semibold text-[#e23744] disabled:opacity-50"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => send("/api/cart/items", "POST", { menuItemId: item.id, qty: 1 })}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e23744] text-lg font-semibold text-white disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => send("/api/cart/items", "POST", { menuItemId: item.id, qty: 1 })}
                          className="rounded-md border border-[#e23744] px-4 py-2 text-sm font-semibold text-[#e23744] hover:bg-[#fff5f5] disabled:opacity-50"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
