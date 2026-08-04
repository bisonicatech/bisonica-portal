import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalUser, getProjectRoles, hasAreaAccess, type DocumentArea } from "@/lib/access";
import { DOCUMENTS_BUCKET } from "@/lib/documents";
import { logAudit } from "@/lib/audit";

// Every hit here is a real view/download — the link on the page always points
// through this route (never a direct storage URL), so the auth check + audit
// log below run every time, not just at page-render time.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return NextResponse.redirect(new URL("/login", request.url));

  const user = await getPortalUser(authUser.id);
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("id, project_id, area, title, file_url")
    .eq("id", params.id)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const roles = await getProjectRoles(user.id, doc.project_id);
  if (!hasAreaAccess(user, roles, doc.area as DocumentArea)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { data: signed, error: signError } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.file_url, 60);

  if (signError || !signed) {
    return NextResponse.json({ error: signError?.message ?? "Could not generate download link" }, { status: 500 });
  }

  // Fail closed: only hand back the signed URL if the view was actually
  // recorded — an unlogged download defeats the point of the audit trail.
  try {
    await logAudit({ userId: user.id, projectId: doc.project_id, action: "document_view", target: doc.title });
  } catch {
    return NextResponse.json({ error: "Could not record this download — please try again" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
