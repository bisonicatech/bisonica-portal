import { createAdminClient } from "@/lib/supabase/admin";
import type { ProjectRole } from "@/lib/access";
import type { AuditAction } from "@/lib/audit";

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

export type AdminProjectRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  summary: string | null;
  createdAt: string;
  accessCount: number;
  documentCount: number;
};

// Full project list for /admin/projects, with a cheap per-project count of
// people-with-access and documents — enough to see at a glance which
// projects are actually in use versus dormant.
export async function getAllProjectsWithStats(): Promise<AdminProjectRow[]> {
  const admin = createAdminClient();

  const [{ data: projects }, { data: access }, { data: documents }] = await Promise.all([
    admin.from("projects").select("id, name, slug, status, summary, created_at").order("created_at", { ascending: false }),
    admin.from("project_access").select("project_id"),
    admin.from("documents").select("project_id"),
  ]);

  const accessCounts = new Map<string, number>();
  for (const row of access ?? []) {
    accessCounts.set(row.project_id, (accessCounts.get(row.project_id) ?? 0) + 1);
  }

  const documentCounts = new Map<string, number>();
  for (const row of documents ?? []) {
    documentCounts.set(row.project_id, (documentCounts.get(row.project_id) ?? 0) + 1);
  }

  return (projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    summary: p.summary,
    createdAt: p.created_at,
    accessCount: accessCounts.get(p.id) ?? 0,
    documentCount: documentCounts.get(p.id) ?? 0,
  }));
}

export type AuditLogRow = {
  id: string;
  actorEmail: string;
  action: AuditAction;
  target: string;
  projectName: string | null;
  createdAt: string;
};

// Most recent audit_log entries, joined to a human-readable actor email and
// project name. Capped at 200 — this is a viewer for recent activity, not a
// full export tool.
export async function getRecentAuditLog(limit = 200): Promise<AuditLogRow[]> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("audit_log")
    .select("id, action, target, created_at, users(email), projects(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    actorEmail: row.users?.email ?? "unknown",
    action: row.action,
    target: row.target,
    projectName: row.projects?.name ?? null,
    createdAt: row.created_at,
  }));
}
