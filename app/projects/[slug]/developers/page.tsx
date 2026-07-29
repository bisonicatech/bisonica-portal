import { requireProjectAccess, canUploadToArea } from "@/lib/access";
import { DocumentsPanel } from "../DocumentsPanel";

export default async function DevelopersTabPage({ params }: { params: { slug: string } }) {
  const { user, project, roles } = await requireProjectAccess(params.slug, ["developer"]);

  return (
    <div className="space-y-4">
      <DocumentsPanel
        projectId={project.id}
        area="developers"
        title="Developer documents"
        canUpload={canUploadToArea(user, roles, "developers")}
      />

      <section className="border border-ink/10 bg-paper p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink/50">Issue tracker link</h2>
        <p className="mt-2 text-sm text-ink/40">Not built yet — placeholder for a future milestone.</p>
      </section>
    </div>
  );
}
