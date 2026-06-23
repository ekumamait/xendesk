import { redirect } from "next/navigation";

export default function HomePage() {
  // The (app)/dashboard guard redirects unauthenticated users to /signin.
  redirect("/dashboard");
}
