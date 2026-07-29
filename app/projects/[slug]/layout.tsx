import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPortalUser, getProjectBySlug, getProjectRoles } from "@/lib/access";
import { ProjectTabsNav } from "./ProjectTabsNav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const user = await getPortalUser(authUser.id);
  if (!user) redirect("/login");

  const project = await getProjectBySlug(params.slug);
  if (!project) redirect("/dashboard");

  const roles = await getProjectRoles(user.id, project.id);

  if (!user.isAdmin && roles.length === 0) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/dashboard" className="font-display text-xs uppercase tracking-wider text-ink/40 hover:text-ink">
        ← Dashboard
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-ink">{project.name}</h1>
        <span className="font-display text-[10px] uppercase tracking-wider text-ink/40">{project.status}</span>
      </div>
      {project.summary && <p className="mt-1 text-sm text-ink/55">{project.summary}</p>}

      <ProjectTabsNav slug={project.slug} roles={roles} isAdmin={user.isAdmin} />

      <div className="mt-8">{children}</div>
    </main>
  );
}
