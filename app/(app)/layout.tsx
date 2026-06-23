import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/lib/auth-helpers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: every page under this group requires authentication.
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-col bg-slate-950 text-slate-100">
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
