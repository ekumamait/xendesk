"use client";

import { ChevronDown, LifeBuoy, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/generated/prisma/enums";
import { initials } from "@/lib/utils";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: Role;
};

export function AppNav({ user }: { user: NavUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-slate-100">
              XenDesk
            </span>
          </Link>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 pr-3 pl-1 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {initials(user.name ?? user.email ?? "U")}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute top-12 right-0 min-w-56 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-lg shadow-black/40"
            >
              <div className="rounded-lg px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-100">
                  {user.name ?? user.email}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 capitalize">
                  {user.role.toLowerCase()}
                </p>
              </div>
              <Button
                role="menuitem"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => signOut({ callbackUrl: "/signin" })}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
