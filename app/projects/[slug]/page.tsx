import { requireProjectAccess, canUploadToArea } from "@/lib/access";
import { DocumentsPanel } from "./DocumentsPanel";

export default async function ProjectOverviewPage({ params }: { params: { slug: string } }) {
  const { project, roles, user } = await requireProjectAccess(params.slug, [
    "investor",
    "developer",
    "partner",
    "internal",
  ]);

  return (
    <div className="space-y-6">
      <section className="border border-ink/10 bg-paper p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink/50">Your access</h2>
        <p className="mt-2 text-sm text-ink/70">
          {user.isAdmin ? "Admin — full access to every tab." : `Roles on this project: ${roles.join(", ") || "none"}`}
        </p>
      </section>

      <section className="border border-ink/10 bg-paper p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink/50">Summary</h2>
        <p className="mt-2 text-sm text-ink/70">{project.summary ?? "No summary yet."}</p>
      </section>

      <section className="border border-ink/10 bg-paper p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink/50">Timeline & key contacts</h2>
        <p className="mt-2 text-sm text-ink/40">Not populated yet — placeholder for milestone 2.</p>
      </section>

      <DocumentsPanel
        projectId={project.id}
        area="overview"
        title="Project documents"
        canUpload={canUploadToArea(user, roles, "overview")}
      />
    </div>
  );
}
