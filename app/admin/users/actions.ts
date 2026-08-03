"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalUser, type ProjectRole, type PortalUser } from "@/lib/access";

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
  await requireAdmin();

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

  const { error: upsertError } = await admin
    .from("users")
    .upsert({ id: authUserId, email, name, is_admin: isAdmin }, { onConflict: "id" });

  if (upsertError) throw upsertError;

  revalidatePath("/admin/users");
}

export async function grantAccess(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const role = String(formData.get("role") ?? "") as ProjectRole;
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();

  if (!userId || !projectId || !role) return;

  const admin = createAdminClient();
  // Upsert on the same (user, project, role) uniqueness as the schema —
  // re-granting an existing role just updates its expiry instead of erroring.
  const { error } = await admin.from("project_access").upsert(
    {
      user_id: userId,
      project_id: projectId,
      role,
      expires_at: expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null,
    },
    { onConflict: "user_id,project_id,role" }
  );

  if (error) throw error;

  revalidatePath("/admin/users");
}

export async function revokeAccess(formData: FormData) {
  await requireAdmin();

  const accessId = String(formData.get("accessId") ?? "");
  if (!accessId) return;

  const admin = createAdminClient();
  const { error } = await admin.from("project_access").delete().eq("id", accessId);
  if (error) throw error;

  revalidatePath("/admin/users");
}

export async function toggleAdmin(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const nextValue = formData.get("nextValue") === "true";
  if (!userId) return;

  const admin = createAdminClient();
  const { error } = await admin.from("users").update({ is_admin: nextValue }).eq("id", userId);
  if (error) throw error;

  revalidatePath("/admin/users");
}

export async function removeUser(formData: FormData) {
  const currentAdmin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  // Cheap guard against an admin locking themselves out by mis-clicking.
  if (userId === currentAdmin.id) {
    throw new Error("You can't remove your own account.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("users").delete().eq("id", userId);
  if (error) throw error;

  revalidatePath("/admin/users");
}
