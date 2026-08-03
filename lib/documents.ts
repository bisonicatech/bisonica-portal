import { createAdminClient } from "@/lib/supabase/admin";
import type { DocumentArea } from "@/lib/access";

export const DOCUMENTS_BUCKET = "documents";

// Extension → MIME allowlist for uploads. Checked against both the filename
// and the browser-declared content type (neither is a substitute for real
// magic-byte sniffing, but this blocks casual misuse — e.g. an uploaded
// .exe or .html — without a content-inspection dependency).
export const ALLOWED_DOCUMENT_TYPES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".csv": ["text/csv", "application/vnd.ms-excel"],
  ".txt": ["text/plain"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
};

export function isAllowedDocumentFile(filename: string, declaredType: string): boolean {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const allowedTypes = ALLOWED_DOCUMENT_TYPES[ext];
  if (!allowedTypes) return false;
  // Browsers sometimes send an empty content type for unrecognized files —
  // treat that as a mismatch rather than trusting the extension alone.
  return allowedTypes.includes(declaredType);
}

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

// Appends one row to the audit trail. Throws on failure — deliberately
// fail-closed, since "every view/download is logged" is a stated guarantee
// for documents that can include cap tables and signed agreements. Callers
// must not hand back a file (or leave one uploaded) if this throws.
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
  if (error) throw error;
}
