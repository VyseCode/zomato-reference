"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  status: string;
  canAdvance: boolean;
  canCancel: boolean;
};

export function OrderStatusControls({ orderId, status, canAdvance, canCancel }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const next: Record<string, { status: string; label: string }> = {
    placed: { status: "confirmed", label: "Accept order" },
    confirmed: { status: "preparing", label: "Start preparing" },
    preparing: { status: "out_for_delivery", label: "Mark out for delivery" },
    out_for_delivery: { status: "delivered", label: "Mark delivered" },
  };

  async function transition(target: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target, note: "" }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not update the order");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const advance = canAdvance ? next[status] : undefined;
  const showCancel = canCancel && ["placed", "confirmed"].includes(status);

  if (!advance && !showCancel) return null;

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-slate-800">Manage order</h2>
      <div className="flex flex-wrap gap-2">
        {advance && (
          <button
            type="button"
            disabled={busy}
            onClick={() => transition(advance.status)}
            className="rounded-full bg-[#e23744] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {advance.label}
          </button>
        )}
        {showCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() => transition("cancelled")}
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel order
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
