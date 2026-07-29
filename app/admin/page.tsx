import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPortalUser } from "@/lib/access";

export default async function AdminHubPage() {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const user = await getPortalUser(authUser.id);
  if (!user || !user.isAdmin) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/dashboard" className="font-display text-xs uppercase tracking-wider text-ink/40 hover:text-ink">
        ← Dashboard
      </Link>

      <h1 className="mt-4 font-display text-2xl font-medium text-ink">Internal hub</h1>
      <p className="mt-2 text-sm text-ink/55">
        Cross-project tracker, user & access management, and the audit log viewer land here next — after we confirm
        the data model and build document storage. For now, use SQL (see README) to add users and grant project
        access.
      </p>
    </main>
  );
}
