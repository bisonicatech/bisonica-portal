import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProjectRole = "investor" | "developer" | "partner" | "internal" | "staff";

export type DocumentArea = "overview" | "investors" | "developers" | "partners" | "internal";

const AREA_TO_ROLE: Record<Exclude<DocumentArea, "overview">, ProjectRole> = {
  investors: "investor",
  developers: "developer",
  partners: "partner",
  internal: "internal",
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  status: string;
  summary: string | null;
};

export type PortalUser = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
};

export type ProjectAccessRow = {
  projectId: string;
  role: ProjectRole;
  expiresAt: string | null;
};

// Looks up the portal-side user row (allowlist + admin flag) for a signed-in
// auth.users id. Uses the service-role client because RLS only lets a user read
// their *own* row, and this needs to run before we know whether they're an admin.
export async function getPortalUser(authUserId: string): Promise<PortalUser | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, email, name, is_admin")
    .eq("id", authUserId)
    .maybeSingle();

  if (!data) return null;

  return { id: data.id, email: data.email, name: data.name, isAdmin: data.is_admin };
}

// Active (non-expired) roles a user holds on a given project. Admins get every
// role implicitly, so callers should also check `PortalUser.isAdmin` for
// "sees everything" behavior rather than relying solely on this list.
export async function getProjectRoles(userId: string, projectId: string): Promise<ProjectRole[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("project_access")
    .select("role, expires_at")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  const now = Date.now();
  return (data ?? [])
    .filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > now)
    .map((row) => row.role as ProjectRole);
}

// Every project a user can see on their dashboard: anything with a live
// project_access row, or every project at all if they're an admin.
export async function getAccessibleProjects(user: PortalUser) {
  const admin = createAdminClient();

  if (user.isAdmin) {
    const { data } = await admin
      .from("projects")
      .select("id, name, slug, status, summary")
      .order("created_at", { ascending: false });
    return data ?? [];
  }

  const { data: access } = await admin
    .from("project_access")
    .select("project_id, expires_at")
    .eq("user_id", user.id);

  const now = Date.now();
  const liveProjectIds = [
    ...new Set(
      (access ?? [])
        .filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > now)
        .map((row) => row.project_id)
    ),
  ];

  if (liveProjectIds.length === 0) return [];

  const { data: projects } = await admin
    .from("projects")
    .select("id, name, slug, status, summary")
    .in("id", liveProjectIds)
    .order("created_at", { ascending: false });

  return projects ?? [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("projects")
    .select("id, name, slug, status, summary")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

// Resolves the signed-in portal user + a project by slug, and redirects away
// if the user has none of `allowedRoles` on it (admins always pass). Every
// project tab page calls this directly — the layout's nav already hides links
// the user can't see, but a page must not trust that alone (someone could type
// the URL), so each server component re-checks on its own.
export async function requireProjectAccess(
  slug: string,
  allowedRoles: ProjectRole[]
): Promise<{ user: PortalUser; project: Project; roles: ProjectRole[] }> {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const user = await getPortalUser(authUser.id);
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  if (!project) redirect("/dashboard");

  const roles = await getProjectRoles(user.id, project.id);

  // 'staff' unlocks every tab on this specific project, same as isAdmin does
  // globally across every project.
  const hasAccess = user.isAdmin || roles.includes("staff") || allowedRoles.some((role) => roles.includes(role));
  if (!hasAccess) redirect(`/projects/${slug}`);

  return { user, project, roles };
}

// Can this user see documents posted in `area`? Overview documents are visible
// to anyone with any live role on the project (it's the shared summary area);
// every other area requires the matching role, staff, or admin. Mirrors the
// "users view documents for their project areas" RLS policy in
// supabase/migrations/0001_init.sql — keep both in sync.
export function hasAreaAccess(user: PortalUser, roles: ProjectRole[], area: DocumentArea): boolean {
  if (user.isAdmin || roles.includes("staff")) return true;
  if (area === "overview") return roles.length > 0;
  return roles.includes(AREA_TO_ROLE[area]);
}

// Can this user upload into `area`? Same as view access, except Overview is
// deliberately tighter: it's the shared cross-role summary, so only staff/admin
// post there — any random viewer having any role could otherwise upload to it.
export function canUploadToArea(user: PortalUser, roles: ProjectRole[], area: DocumentArea): boolean {
  if (user.isAdmin || roles.includes("staff")) return true;
  if (area === "overview") return false;
  return roles.includes(AREA_TO_ROLE[area]);
}
