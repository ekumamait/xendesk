import { CustomerDashboard } from "@/components/customer-dashboard";
import { isAgent, requireUser } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const user = await requireUser();

  if (isAgent(user)) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Agent dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">Coming up next.</p>
      </div>
    );
  }

  return <CustomerDashboard user={user} />;
}
