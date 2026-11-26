"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavbarProps = { name: string; isPartner: boolean };

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/orders", label: "Orders" },
  { href: "/cart", label: "Cart" },
  { href: "/favorites", label: "Favorites" },
];

export function Navbar({ name, isPartner }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/browse" className="flex items-center gap-2 font-bold text-[#e23744]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e23744] text-white">
            Z
          </span>
          <span className="hidden sm:inline">Zomato</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-3">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-2 py-1.5 text-xs font-medium sm:px-3 sm:text-sm ${
                  active ? "bg-[#fff1f2] text-[#e23744]" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e23744] text-white">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden sm:inline">Account</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="text-xs text-slate-500">
                    {isPartner ? "Customer & partner" : "Customer"}
                  </p>
                </div>
                <Link
                  href="/addresses"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Addresses
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
