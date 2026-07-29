import { createAdminClient } from "@/lib/supabase/admin";
import type { DocumentArea } from "@/lib/access";

export const DOCUMENTS_BUCKET = "documents";

export type DocumentRow = {
  id: string;
  title: string;
  area: DocumentArea;
  filePath: string;
  uploadedBy: string | null;
  createdAt: string;
};

export async function listDocuments(projectId: string, area: DocumentArea): Promise<DocumentRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("documents")
    .select("id, title, area, file_url, uploaded_by, created_at")
    .eq("project_id", projectId)
    .eq("area", area)
    .order("created_at", { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    area: d.area as DocumentArea,
    filePath: d.file_url,
    uploadedBy: d.uploaded_by,
    createdAt: d.created_at,
  }));
}

// Appends one row to the audit trail. Never throws — a logging failure
// shouldn't block the upload/download it's describing.
export async function logAudit(params: {
  userId: string;
  projectId: string;
  action: "document_upload" | "document_view";
  target: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_log").insert({
    user_id: params.userId,
    project_id: params.projectId,
    action: params.action,
    target: params.target,
  });
  if (error) console.error("audit_log insert failed", error);
}
