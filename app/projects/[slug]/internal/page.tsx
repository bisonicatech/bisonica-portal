import { requireProjectAccess, canUploadToArea } from "@/lib/access";
import { DocumentsPanel } from "../DocumentsPanel";

export default async function InternalTabPage({ params }: { params: { slug: string } }) {
  const { user, project, roles } = await requireProjectAccess(params.slug, ["internal"]);

  return (
    <div className="space-y-4">
      <DocumentsPanel
        projectId={project.id}
        area="internal"
        title="Internal documents"
        canUpload={canUploadToArea(user, roles, "internal")}
      />
    </div>
  );
}
