import { requireUser } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome back, {user.name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Your role-specific dashboard will appear here.
      </p>
    </div>
  );
}
