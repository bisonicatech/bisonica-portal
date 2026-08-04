"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalUser, type PortalUser } from "@/lib/access";
import { logAudit } from "@/lib/audit";

async function requireAdmin(): Promise<PortalUser> {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await getPortalUser(authUser.id);
  if (!user || !user.isAdmin) redirect("/dashboard");
  return user;
}

const VALID_STATUSES = ["active", "paused", "archived"];

export async function createProject(formData: FormData) {
  const actor = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const status = String(formData.get("status") ?? "active");
  const summary = String(formData.get("summary") ?? "").trim() || null;

  if (!name || !slug) return;
  if (!VALID_STATUSES.includes(status)) return;

  const admin = createAdminClient();

  const { data: inserted, error } = await admin
    .from("projects")
    .insert({ name, slug, status, summary })
    .select("id")
    .single();

  if (error) throw error;

  try {
    await logAudit({ userId: actor.id, projectId: inserted.id, action: "project_created", target: name });
  } catch {
    await admin.from("projects").delete().eq("id", inserted.id);
    throw new Error("Could not record this change — please try again");
  }

  revalidatePath("/admin/projects");
  revalidatePath("/dashboard");
}

export async function updateProject(formData: FormData) {
  const actor = await requireAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const status = String(formData.get("status") ?? "active");
  const summary = String(formData.get("summary") ?? "").trim() || null;

  if (!projectId || !name || !slug) return;
  if (!VALID_STATUSES.includes(status)) return;

  const admin = createAdminClient();

  const { data: previous } = await admin
    .from("projects")
    .select("name, slug, status, summary")
    .eq("id", projectId)
    .maybeSingle();
  if (!previous) return;

  const { error } = await admin.from("projects").update({ name, slug, status, summary }).eq("id", projectId);
  if (error) throw error;

  try {
    await logAudit({ userId: actor.id, projectId, action: "project_updated", target: name });
  } catch {
    await admin.from("projects").update(previous).eq("id", projectId);
    throw new Error("Could not record this change — please try again");
  }

  revalidatePath("/admin/projects");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${slug}`);
}

export async function deleteProject(formData: FormData) {
  const actor = await requireAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  const admin = createAdminClient();

  // Deleting a project cascades to its project_access and documents rows
  // (schema-level ON DELETE CASCADE) — snapshot everything first so a
  // failed audit write can restore the whole thing, not just the project row.
  const { data: project } = await admin.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) return;

  const [{ data: accessRows }, { data: documentRows }] = await Promise.all([
    admin.from("project_access").select("*").eq("project_id", projectId),
    admin.from("documents").select("*").eq("project_id", projectId),
  ]);

  const { error } = await admin.from("projects").delete().eq("id", projectId);
  if (error) throw error;

  try {
    await logAudit({ userId: actor.id, projectId: null, action: "project_deleted", target: project.name });
  } catch {
    await admin.from("projects").insert(project);
    if (accessRows && accessRows.length > 0) await admin.from("project_access").insert(accessRows);
    if (documentRows && documentRows.length > 0) await admin.from("documents").insert(documentRows);
    throw new Error("Could not record this deletion — please try again");
  }

  revalidatePath("/admin/projects");
  revalidatePath("/dashboard");
}
