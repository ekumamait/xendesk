"use client";

import { LayoutDashboard, LifeBuoy, LogOut, Plus } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/generated/prisma/enums";
import { initials } from "@/lib/utils";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: Role;
};

export function AppNav({ user }: { user: NavUser }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-slate-900">
              XenDesk
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/tickets/new"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              New ticket
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">
              {user.role.toLowerCase()}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {initials(user.name ?? user.email ?? "U")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            title="Sign out"
            onClick={() => signOut({ callbackUrl: "/signin" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
