import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPortalUser } from "@/lib/access";
import { getRecentAuditLog } from "@/lib/admin";
import type { AuditAction } from "@/lib/audit";

const ACTION_LABELS: Record<AuditAction, string> = {
  document_upload: "Uploaded document",
  document_view: "Viewed/downloaded document",
  user_invited: "Invited user",
  user_removed: "Removed user",
  access_granted: "Granted access",
  access_revoked: "Revoked access",
  admin_granted: "Made admin",
  admin_revoked: "Removed admin",
  project_created: "Created project",
  project_updated: "Updated project",
  project_deleted: "Deleted project",
};

export default async function AdminAuditPage() {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const currentUser = await getPortalUser(authUser.id);
  if (!currentUser || !currentUser.isAdmin) redirect("/dashboard");

  const entries = await getRecentAuditLog();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin" className="font-display text-xs uppercase tracking-wider text-ink/40 hover:text-ink">
        ← Internal hub
      </Link>

      <h1 className="mt-4 font-display text-2xl font-medium text-ink">Audit log</h1>
      <p className="mt-2 text-sm text-ink/55">
        Every document view/upload and every access change, most recent first. Showing the last {entries.length}{" "}
        entries.
      </p>

      <div className="mt-8 overflow-x-auto border border-ink/10 bg-paper">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10">
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">When</th>
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">Who</th>
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">Action</th>
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">Target</th>
              <th className="px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-ink/50">Project</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-ink/10 last:border-b-0">
                <td className="whitespace-nowrap px-4 py-2.5 text-ink/50">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-ink">{entry.actorEmail}</td>
                <td className="px-4 py-2.5 text-ink/70">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                <td className="px-4 py-2.5 text-ink/70">{entry.target}</td>
                <td className="px-4 py-2.5 text-ink/50">{entry.projectName ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="p-5 text-sm text-ink/50">No activity recorded yet.</p>}
      </div>
    </main>
  );
}
