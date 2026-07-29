import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalUser, getProjectRoles, canUploadToArea, type DocumentArea } from "@/lib/access";
import { DOCUMENTS_BUCKET, logAudit } from "@/lib/documents";

const VALID_AREAS: DocumentArea[] = ["overview", "investors", "developers", "partners", "internal"];
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = await getPortalUser(authUser.id);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const title = form.get("title");
  const projectId = form.get("projectId");
  const area = form.get("area");

  if (!(file instanceof File) || typeof title !== "string" || typeof projectId !== "string" || typeof area !== "string") {
    return NextResponse.json({ error: "Missing file, title, projectId, or area" }, { status: 400 });
  }

  if (!VALID_AREAS.includes(area as DocumentArea)) {
    return NextResponse.json({ error: "Invalid area" }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File must be non-empty and under 25MB" }, { status: 400 });
  }

  const roles = await getProjectRoles(user.id, projectId);
  if (!canUploadToArea(user, roles, area as DocumentArea)) {
    return NextResponse.json({ error: "Not allowed to upload here" }, { status: 403 });
  }

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${projectId}/${area}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await admin.from("documents").insert({
    project_id: projectId,
    area,
    title,
    file_url: path,
    uploaded_by: user.id,
  });

  if (insertError) {
    await admin.storage.from(DOCUMENTS_BUCKET).remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await logAudit({ userId: user.id, projectId, action: "document_upload", target: title });

  return NextResponse.json({ ok: true });
}
