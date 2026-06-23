import { LifeBuoy } from "lucide-react";
import { redirect } from "next/navigation";

import { SeedButton } from "@/components/seed-button";
import { SignInForm } from "@/components/sign-in-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function SignInPage() {
  // Already authenticated users skip the sign-in screen.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <LifeBuoy className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold text-slate-900">XenDesk</h1>
          <p className="mt-1 text-sm text-slate-500">
            Internal support &amp; ticketing for XenFi Systems
          </p>
        </div>

        <Card>
          <CardContent className="space-y-5 py-6">
            <SignInForm />
            <div className="border-t border-slate-100 pt-4">
              <SeedButton />
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg bg-slate-100 p-3 text-center text-xs text-slate-500">
          Demo password for all seeded accounts:{" "}
          <code className="font-mono text-slate-700">Password123!</code>
        </div>
      </div>
    </div>
  );
}
