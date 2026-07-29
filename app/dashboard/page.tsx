import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPortalUser, getAccessibleProjects } from "@/lib/access";
import { LogoutButton } from "./LogoutButton";

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const portalUser = await getPortalUser(authUser.id);

  // Signed in via Supabase but no matching allowlist row — shouldn't happen
  // through the normal invite flow, but guards against orphaned auth users.
  if (!portalUser) {
    redirect("/login");
  }

  const projects = await getAccessibleProjects(portalUser);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">Bisonica Portal</h1>
          <p className="mt-1 text-sm text-ink/55">Signed in as {portalUser.email}</p>
        </div>
        <div className="flex items-center gap-4">
          {portalUser.isAdmin && (
            <Link href="/admin" className="font-display text-xs uppercase tracking-wider text-brand hover:text-rust">
              Internal hub
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.slug}`}
            className="border border-ink/10 bg-paper p-5 transition hover:border-accent"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">{project.name}</h2>
              <span className="font-display text-[10px] uppercase tracking-wider text-ink/40">
                {project.status}
              </span>
            </div>
            {project.summary && <p className="mt-2 text-sm text-ink/60">{project.summary}</p>}
          </Link>
        ))}

        {projects.length === 0 && (
          <p className="text-sm text-ink/50">
            You don&apos;t have access to any projects yet. Contact an admin to be added.
          </p>
        )}
      </div>
    </main>
  );
}
