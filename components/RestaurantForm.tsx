"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RestaurantCardDTO } from "@/lib/serialize";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-[#e23744]/20";

export function RestaurantForm({ restaurant }: { restaurant?: RestaurantCardDTO }) {
  const router = useRouter();
  const editing = Boolean(restaurant);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      cuisines: String(form.get("cuisines") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      area: String(form.get("area") ?? ""),
      address: String(form.get("address") ?? ""),
      description: String(form.get("description") ?? ""),
      etaMinutes: Number(form.get("etaMinutes") ?? 0),
      deliveryFee: Number(form.get("deliveryFee") ?? 0),
      minimumOrder: Number(form.get("minimumOrder") ?? 0),
      isActive: form.get("isActive") === "on",
    };

    try {
      const response = await fetch(
        editing ? `/api/restaurants/${restaurant!.id}` : "/api/restaurants",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save restaurant");
        return;
      }
      if (editing) {
        router.refresh();
      } else if (data.id) {
        router.push(`/partner/restaurants/${data.id}`);
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Name
          <input name="name" required minLength={2} defaultValue={restaurant?.name} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Cuisines (comma separated)
          <input
            name="cuisines"
            required
            defaultValue={restaurant?.cuisines.join(", ")}
            placeholder="North Indian, Biryani"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Area
          <input name="area" required minLength={2} defaultValue={restaurant?.area} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Street address
          <input name="address" defaultValue={restaurant?.address} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          ETA (minutes)
          <input name="etaMinutes" type="number" min={5} max={180} required defaultValue={restaurant?.etaMinutes ?? 30} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Delivery fee (₹)
          <input name="deliveryFee" type="number" min={0} step={1} required defaultValue={restaurant?.deliveryFee ?? 29} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Minimum order (₹)
          <input name="minimumOrder" type="number" min={0} step={1} required defaultValue={restaurant?.minimumOrder ?? 199} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
          <input name="isActive" type="checkbox" defaultChecked={restaurant?.isActive ?? true} className="accent-[#e23744]" />
          Accepting orders
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Description
        <textarea name="description" rows={3} defaultValue={restaurant?.description} className={inputClass} />
      </label>
      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-[#e23744] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c72d39] disabled:opacity-60"
      >
        {loading ? "Saving..." : editing ? "Save changes" : "Create restaurant"}
      </button>
    </form>
  );
}
