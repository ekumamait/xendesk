import { AgentDashboard } from "@/components/agent-dashboard";
import { CustomerDashboard } from "@/components/customer-dashboard";
import { isAgent, requireUser } from "@/lib/auth-helpers";
import { listTicketsQuerySchema } from "@/lib/validations";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();

  if (!isAgent(user)) {
    return <CustomerDashboard user={user} />;
  }

  // Parse only present, scalar filter params so enum validation stays clean.
  const sp = await searchParams;
  const raw: Record<string, string> = {};
  for (const key of ["status", "priority", "tagId", "q"]) {
    const value = sp[key];
    if (typeof value === "string" && value) raw[key] = value;
  }
  const filters = listTicketsQuerySchema.parse(raw);

  return <AgentDashboard user={user} filters={filters} />;
}
