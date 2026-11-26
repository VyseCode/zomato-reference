"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            roles: form.get("partner") ? ["customer", "partner"] : ["customer"],
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/browse");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen flex-col bg-[#fff8f8]">
      <div className="flex items-center gap-2 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e23744] text-xl font-bold text-white">
          Z
        </span>
        <span className="text-lg font-semibold text-slate-800">Zomato Reference</span>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center">
        <div className="w-full max-w-sm">
          <h1 className="mb-5 text-center text-3xl font-semibold text-slate-800">
            {isRegister ? "Create your account" : "Sign in to order"}
          </h1>

          <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {isRegister && (
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  autoComplete="name"
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-[#e23744]/20"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-[#e23744]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={isRegister ? 8 : 1}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-[#e23744]/20"
              />
              {isRegister && (
                <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
              )}
            </div>

            {isRegister && (
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" name="partner" className="mt-0.5 accent-[#e23744]" />
                I also want to list restaurants as a partner
              </label>
            )}

            {error && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#e23744] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c72d39] disabled:opacity-60"
            >
              {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            {isRegister ? "Already have an account? " : "New here? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-[#e23744] hover:underline"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>

          {!isRegister && (
            <p className="mt-6 rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-center text-xs text-slate-600">
              Demo: <strong>alex@example.com</strong> / <strong>password123</strong> · partner:{" "}
              <strong>priya@example.com</strong>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
