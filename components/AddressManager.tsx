"use client";

import { useState } from "react";
import type { AddressDTO } from "@/lib/serialize";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#e23744]";

const emptyForm = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  pincode: "",
  phone: "",
  isDefault: false,
};

export function AddressManager({ initial }: { initial: AddressDTO[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    const response = await fetch("/api/addresses");
    if (response.ok) {
      const data = (await response.json()) as { addresses: AddressDTO[] };
      setAddresses(data.addresses);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        editingId ? `/api/addresses/${editingId}` : "/api/addresses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save address");
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

  async function remove(address: AddressDTO) {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/addresses/${address.id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) setError(data.error ?? "Could not delete address");
    await reload();
    setBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-3">
        {addresses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No addresses yet. Add your first delivery address.
          </p>
        ) : (
          addresses.map((address) => (
            <div key={address.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{address.label}</span>
                  {address.isDefault && (
                    <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Default</span>
                  )}
                </div>
                <p className="mt-1 text-slate-600">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                <p className="text-slate-500">{address.city} {address.pincode} · {address.phone}</p>
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(address.id);
                    setForm({
                      label: address.label,
                      line1: address.line1,
                      line2: address.line2,
                      city: address.city,
                      pincode: address.pincode,
                      phone: address.phone,
                      isDefault: address.isDefault,
                    });
                  }}
                  className="font-medium text-[#e23744] hover:underline"
                >
                  Edit
                </button>
                <button type="button" disabled={busy} onClick={() => remove(address)} className="font-medium text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <form onSubmit={submit} className="space-y-3 self-start rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-800">
          {editingId ? "Edit address" : "Add a new address"}
        </h2>
        <label className="block text-sm font-medium text-slate-700">
          Label
          <select className={inputClass} value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })}>
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Address line 1
          <input required minLength={2} className={inputClass} value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value })} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Address line 2
          <input className={inputClass} value={form.line2} onChange={(event) => setForm({ ...form, line2: event.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">
            City
            <input required minLength={2} className={inputClass} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            PIN code
            <input required className={inputClass} value={form.pincode} onChange={(event) => setForm({ ...form, pincode: event.target.value })} />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Phone
          <input required minLength={7} className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} className="accent-[#e23744]" />
          Make this my default
        </label>
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="rounded-full bg-[#e23744] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {editingId ? "Save address" : "Add address"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
