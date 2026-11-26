"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm({
  restaurantId,
  orderId,
}: {
  restaurantId: string;
  orderId: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, text }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not submit your review");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="text-sm text-green-700">Thanks for your review!</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Rating</span>
        <select
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{value} star{value > 1 ? "s" : ""}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Your review</span>
        <textarea
          value={text}
          maxLength={1000}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="How was the food?"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-full bg-[#e23744] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {busy ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
