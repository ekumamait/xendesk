import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { NewTicketForm } from "@/components/new-ticket-form";
import { requireUser } from "@/lib/auth-helpers";
import { listTags } from "@/lib/services/tags";

export default async function NewTicketPage() {
  await requireUser();
  const tags = await listTags();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Create a new ticket
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tell us what is going on and we will get back to you.
        </p>
      </div>

      <NewTicketForm tags={tags} />
    </div>
  );
}
