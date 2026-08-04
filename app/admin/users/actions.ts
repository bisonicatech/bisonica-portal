"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalUser, type ProjectRole, type PortalUser } from "@/lib/access";
import { logAudit } from "@/lib/audit";

// Every action below re-checks admin status itself — this page is gated by
// the layout/page too, but a Server Action is a public endpoint in its own
// right (reachable directly, not just via this page's rendered form), so it
// can't rely on the page's own gate alone.
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

export async function inviteUser(formData: FormData) {
  const actor = await requireAdmin();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const isAdmin = formData.get("isAdmin") === "on";

  if (!email) return;

  const admin = createAdminClient();

  // email_confirm: true — creates the auth.users row directly, no
  // confirmation email needed; they log in afterward via the normal
  // magic-link flow on /login.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  let authUserId = created?.user?.id;

  if (createError) {
    if (!createError.message.toLowerCase().includes("already been registered")) {
      throw createError;
    }
    const { data: list, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;
    authUserId = list.users.find((u) => u.email === email)?.id;
  }

  if (!authUserId) throw new Error("Could not resolve auth user id");

  // Track whether the allow-list row already existed, so a rollback only
  // removes what this call actually added.
  const { data: existingRow } = await admin.from("users").select("id").eq("id", authUserId).maybeSingle();

  const { error: upsertError } = await admin
    .from("users")
    .upsert({ id: authUserId, email, name, is_admin: isAdmin }, { onConflict: "id" });

  if (upsertError) throw upsertError;

  try {
    await logAudit({ userId: actor.id, projectId: null, action: "user_invited", target: email });
  } catch {
    if (!existingRow) {
      await admin.from("users").delete().eq("id", authUserId);
    }
    throw new Error("Could not record this invite — please try again");
  }

  revalidatePath("/admin/users");
}

export async function grantAccess(formData: FormData) {
  const actor = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const role = String(formData.get("role") ?? "") as ProjectRole;
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();

  if (!userId || !projectId || !role) return;

  const admin = createAdminClient();

  const [{ data: targetUser }, { data: project }, { data: existing }] = await Promise.all([
    admin.from("users").select("email").eq("id", userId).maybeSingle(),
    admin.from("projects").select("name").eq("id", projectId).maybeSingle(),
    admin
      .from("project_access")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .eq("role", role)
      .maybeSingle(),
  ]);

  const newExpiresAt = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null;

  // Upsert on the same (user, project, role) uniqueness as the schema —
  // re-granting an existing role just updates its expiry instead of erroring.
  const { error } = await admin
    .from("project_access")
    .upsert(
      { user_id: userId, project_id: projectId, role, expires_at: newExpiresAt },
      { onConflict: "user_id,project_id,role" }
    );

  if (error) throw error;

  try {
    await logAudit({
      userId: actor.id,
      projectId,
      action: "access_granted",
      target: `${role} → ${targetUser?.email ?? userId} on ${project?.name ?? projectId}`,
    });
  } catch {
    // Best-effort rollback: restore the prior expiry, or remove the row
    // entirely if this was a brand-new grant rather than an update.
    if (existing) {
      await admin
        .from("project_access")
        .update({ expires_at: existing.expires_at })
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("role", role);
    } else {
      await admin.from("project_access").delete().eq("user_id", userId).eq("project_id", projectId).eq("role", role);
    }
    throw new Error("Could not record this access change — please try again");
  }

  revalidatePath("/admin/users");
}

export async function revokeAccess(formData: FormData) {
  const actor = await requireAdmin();

  const accessId = String(formData.get("accessId") ?? "");
  if (!accessId) return;

  const admin = createAdminClient();

  const { data: row } = await admin
    .from("project_access")
    .select("user_id, project_id, role, expires_at, users(email), projects(name)")
    .eq("id", accessId)
    .maybeSingle();

  if (!row) return;

  const { error } = await admin.from("project_access").delete().eq("id", accessId);
  if (error) throw error;

  try {
    await logAudit({
      userId: actor.id,
      projectId: row.project_id,
      action: "access_revoked",
      target: `${row.role} → ${(row as any).users?.email ?? row.user_id} on ${
        (row as any).projects?.name ?? row.project_id
      }`,
    });
  } catch {
    // Best-effort rollback: re-create the exact grant we just deleted.
    await admin.from("project_access").insert({
      user_id: row.user_id,
      project_id: row.project_id,
      role: row.role,
      expires_at: row.expires_at,
    });
    throw new Error("Could not record this access change — please try again");
  }

  revalidatePath("/admin/users");
}

export async function toggleAdmin(formData: FormData) {
  const actor = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const nextValue = formData.get("nextValue") === "true";
  if (!userId) return;

  const admin = createAdminClient();

  const { data: targetUser } = await admin.from("users").select("email, is_admin").eq("id", userId).maybeSingle();
  if (!targetUser) return;

  const { error } = await admin.from("users").update({ is_admin: nextValue }).eq("id", userId);
  if (error) throw error;

  try {
    await logAudit({
      userId: actor.id,
      projectId: null,
      action: nextValue ? "admin_granted" : "admin_revoked",
      target: targetUser.email,
    });
  } catch {
    await admin.from("users").update({ is_admin: targetUser.is_admin }).eq("id", userId);
    throw new Error("Could not record this change — please try again");
  }

  revalidatePath("/admin/users");
}

export async function removeUser(formData: FormData) {
  const actor = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  // Cheap guard against an admin locking themselves out by mis-clicking.
  if (userId === actor.id) {
    throw new Error("You can't remove your own account.");
  }

  const admin = createAdminClient();

  const { data: targetUser } = await admin.from("users").select("*").eq("id", userId).maybeSingle();
  if (!targetUser) return;

  const { data: accessRows } = await admin.from("project_access").select("*").eq("user_id", userId);

  const { error } = await admin.from("users").delete().eq("id", userId);
  if (error) throw error;

  try {
    await logAudit({ userId: actor.id, projectId: null, action: "user_removed", target: targetUser.email });
  } catch {
    // Best-effort rollback: recreate the user row and every access grant
    // they had (the delete cascades, so both need restoring together).
    await admin.from("users").insert(targetUser);
    if (accessRows && accessRows.length > 0) {
      await admin.from("project_access").insert(accessRows);
    }
    throw new Error("Could not record this removal — please try again");
  }

  revalidatePath("/admin/users");
}
