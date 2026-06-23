"use client";

import { Database } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SeedButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  async function handleSeed() {
    setState("loading");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleSeed}
        disabled={state === "loading"}
      >
        <Database className="h-4 w-4" />
        {state === "loading" ? "Seeding…" : "Seed sample data"}
      </Button>
      {state === "done" && (
        <p className="text-center text-xs text-emerald-600">
          Sample data loaded. Use the demo accounts to sign in.
        </p>
      )}
      {state === "error" && (
        <p className="text-center text-xs text-red-600">
          Seeding failed. Check the database connection.
        </p>
      )}
    </div>
  );
}
