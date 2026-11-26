"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PartnerUpgrade() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function upgrade() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ becomePartner: true }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not enable partner features");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-800">Become a partner</h2>
      <p className="text-sm text-slate-500">
        List your restaurant, manage its menu and process incoming orders.
      </p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={upgrade}
        className="rounded-full bg-[#e23744] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Enabling..." : "Enable partner account"}
      </button>
    </div>
  );
}
