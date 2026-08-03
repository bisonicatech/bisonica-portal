import { createAdminClient } from "@/lib/supabase/admin";
import type { ProjectRole } from "@/lib/access";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  access: {
    id: string;
    projectId: string;
    projectName: string;
    projectSlug: string;
    role: ProjectRole;
    expiresAt: string | null;
  }[];
};

// Everything the /admin/users page needs in two queries: every allow-listed
// person, and every project_access grant (joined to its project name) —
// grouped together in memory rather than doing one query per user.
export async function getAllUsersWithAccess(): Promise<AdminUserRow[]> {
  const admin = createAdminClient();

  const [{ data: users }, { data: access }] = await Promise.all([
    admin.from("users").select("id, email, name, is_admin, created_at").order("created_at", { ascending: false }),
    admin
      .from("project_access")
      .select("id, user_id, role, expires_at, projects(id, name, slug)")
      .order("created_at", { ascending: false }),
  ]);

  const accessByUser = new Map<string, AdminUserRow["access"]>();
  for (const row of (access ?? []) as any[]) {
    const list = accessByUser.get(row.user_id) ?? [];
    list.push({
      id: row.id,
      projectId: row.projects?.id ?? "",
      projectName: row.projects?.name ?? "Unknown project",
      projectSlug: row.projects?.slug ?? "",
      role: row.role,
      expiresAt: row.expires_at,
    });
    accessByUser.set(row.user_id, list);
  }

  return (users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isAdmin: u.is_admin,
    createdAt: u.created_at,
    access: accessByUser.get(u.id) ?? [],
  }));
}

export async function getAllProjectsForAdmin() {
  const admin = createAdminClient();
  const { data } = await admin.from("projects").select("id, name, slug").order("name");
  return data ?? [];
}
