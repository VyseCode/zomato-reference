"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MenuItemDTO } from "@/lib/serialize";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-[#e23744]/20";

const emptyForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  isVeg: true,
  isAvailable: true,
};

type FormState = typeof emptyForm;

export function MenuManager({
  restaurantId,
  initialItems,
}: {
  restaurantId: string;
  initialItems: MenuItemDTO[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    const response = await fetch(`/api/restaurants/${restaurantId}/menu`);
    if (response.ok) {
      const data = (await response.json()) as { items: MenuItemDTO[] };
      setItems(data.items);
    }
    router.refresh();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      isVeg: form.isVeg,
      isAvailable: form.isAvailable,
    };
    try {
      const response = await fetch(
        editingId ? `/api/menu/${editingId}` : `/api/restaurants/${restaurantId}/menu`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not save item");
        return;
      }
      setForm(emptyForm);
      setEditingId(null);
      await reload();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: MenuItemDTO) {
    setBusy(true);
    await fetch(`/api/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    await reload();
    setBusy(false);
  }

  async function remove(item: MenuItemDTO) {
    if (!confirm(`Delete ${item.name}?`)) return;
    setBusy(true);
    await fetch(`/api/menu/${item.id}`, { method: "DELETE" });
    await reload();
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-800">
          {editingId ? "Edit menu item" : "Add a menu item"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Name
            <input required minLength={2} className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Category
            <input required className={inputClass} placeholder="Biryani" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Price (₹)
            <input required type="number" min={1} step={1} className={inputClass} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Description
            <input className={inputClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.isVeg} onChange={(event) => setForm({ ...form, isVeg: event.target.checked })} className="accent-green-600" />
            Vegetarian
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} className="accent-[#e23744]" />
            Available
          </label>
        </div>
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="rounded-full bg-[#e23744] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {editingId ? "Save item" : "Add item"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {items.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No menu items yet. Add your first dish above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full border border-green-600 align-middle" style={{ background: item.isVeg ? "#16a34a" : "#dc2626" }} />
                    <span className="align-middle">{item.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                  <td className="px-4 py-3">₹{item.price}</td>
                  <td className="px-4 py-3">
                    <span className={item.isAvailable ? "text-green-700" : "text-slate-400"}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" disabled={busy} onClick={() => toggle(item)} className="text-[#e23744] hover:underline">
                        {item.isAvailable ? "Hide" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            name: item.name,
                            description: item.description,
                            category: item.category,
                            price: String(item.price),
                            isVeg: item.isVeg,
                            isAvailable: item.isAvailable,
                          });
                        }}
                        className="text-slate-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button type="button" disabled={busy} onClick={() => remove(item)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
