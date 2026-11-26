"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FavoriteButton({
  restaurantId,
  initialFavorite,
  className = "absolute right-3 top-3 z-10",
}: {
  restaurantId: string;
  initialFavorite: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        favorite ? `/api/favorites/${restaurantId}` : "/api/favorites",
        {
          method: favorite ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: favorite ? undefined : JSON.stringify({ restaurantId }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not update favorites");
        return;
      }
      setFavorite(!favorite);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        title={favorite ? "Remove from favorites" : "Add to favorites"}
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg font-bold shadow-sm transition hover:scale-105 disabled:opacity-50 ${favorite ? "text-[#e23744]" : "text-slate-500"}`}
      >
        {favorite ? "♥" : "♡"}
      </button>
      {error && (
        <span role="alert" className="absolute right-0 top-9 z-10 w-44 rounded bg-red-50 px-2 py-1 text-xs text-red-700 shadow">
          {error}
        </span>
      )}
    </span>
  );
}
