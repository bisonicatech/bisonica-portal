import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPortalUser } from "@/lib/access";
import { getAllProjectsWithStats } from "@/lib/admin";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export default async function AdminHubPage() {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const user = await getPortalUser(authUser.id);
  if (!user || !user.isAdmin) redirect("/dashboard");

  const projects = await getAllProjectsWithStats();
  const activeCount = projects.filter((p) => p.status === "active").length;
  const totalAccess = projects.reduce((sum, p) => sum + p.accessCount, 0);
  const totalDocuments = projects.reduce((sum, p) => sum + p.documentCount, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/dashboard" className="font-display text-xs uppercase tracking-wider text-ink/40 hover:text-ink">
        ← Dashboard
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-ink">Internal hub</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/projects"
            className="border border-ink/10 bg-paper px-4 py-2 font-display text-xs uppercase tracking-wider text-ink transition hover:border-accent"
          >
            Projects
          </Link>
          <Link
            href="/admin/users"
            className="border border-ink/10 bg-paper px-4 py-2 font-display text-xs uppercase tracking-wider text-ink transition hover:border-accent"
          >
            Users
          </Link>
          <Link
            href="/admin/audit"
            className="border border-ink/10 bg-paper px-4 py-2 font-display text-xs uppercase tracking-wider text-ink transition hover:border-accent"
          >
            Audit log
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="border border-ink/10 bg-paper p-4">
          <p className="font-display text-2xl text-ink">{activeCount}</p>
          <p className="text-xs text-ink/50">active of {projects.length} projects</p>
        </div>
        <div className="border border-ink/10 bg-paper p-4">
          <p className="font-display text-2xl text-ink">{totalAccess}</p>
          <p className="text-xs text-ink/50">access grants total</p>
        </div>
        <div className="border border-ink/10 bg-paper p-4">
          <p className="font-display text-2xl text-ink">{totalDocuments}</p>
          <p className="text-xs text-ink/50">documents total</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto border border-ink/10 bg-paper">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10">
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">Project</th>
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">Status</th>
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">People</th>
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">
                Documents
              </th>
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">Created</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-ink/10 last:border-b-0">
                <td className="px-4 py-2.5">
                  <Link href={`/projects/${p.slug}`} className="text-ink hover:text-brand">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-ink/60">{STATUS_LABEL[p.status] ?? p.status}</td>
                <td className="px-4 py-2.5 text-ink/60">{p.accessCount}</td>
                <td className="px-4 py-2.5 text-ink/60">{p.documentCount}</td>
                <td className="px-4 py-2.5 text-ink/50">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <p className="p-5 text-sm text-ink/50">
            No projects yet — head to <Link href="/admin/projects" className="text-brand hover:text-rust">Projects</Link>{" "}
            to create one.
          </p>
        )}
      </div>
    </main>
  );
}
