import { requireProjectAccess, canUploadToArea } from "@/lib/access";
import { DocumentsPanel } from "../DocumentsPanel";

export default async function PartnersTabPage({ params }: { params: { slug: string } }) {
  const { user, project, roles } = await requireProjectAccess(params.slug, ["partner"]);

  return (
    <div className="space-y-4">
      <DocumentsPanel
        projectId={project.id}
        area="partners"
        title="Partner documents"
        canUpload={canUploadToArea(user, roles, "partners")}
      />

      <section className="border border-ink/10 bg-paper p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink/50">Announcements</h2>
        <p className="mt-2 text-sm text-ink/40">Not built yet — placeholder for a future milestone.</p>
      </section>
    </div>
  );
}
