import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "document_upload"
  | "document_view"
  | "user_invited"
  | "user_removed"
  | "access_granted"
  | "access_revoked"
  | "admin_granted"
  | "admin_revoked"
  | "project_created"
  | "project_updated"
  | "project_deleted";

// Appends one row to the audit trail. Throws on failure — deliberately
// fail-closed. This covers both document activity (views/uploads on
// material that can include cap tables and signed agreements) and access
// changes (who can grant/revoke/see what) — callers must not complete the
// action they're describing if this throws.
export async function logAudit(params: {
  userId: string;
  projectId: string | null;
  action: AuditAction;
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
