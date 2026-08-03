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
        Cross-project tracker and the audit log viewer land here next. User & access management is ready —
        no more SQL needed for adding people or changing roles.
      </p>

      <Link
        href="/admin/users"
        className="mt-6 inline-block border border-ink/10 bg-paper px-5 py-4 font-display text-sm text-ink transition hover:border-accent"
      >
        Users →
      </Link>
    </main>
  );
}
