import { AppShell } from "@/components/AppShell";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AppShell currentUser={user} />;
}
