import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPortalUser } from "@/lib/access";
import { getAllUsersWithAccess, getAllProjectsForAdmin } from "@/lib/admin";
import { inviteUser, grantAccess, revokeAccess, toggleAdmin, removeUser } from "./actions";
import { ConfirmButton } from "../ConfirmButton";

const ROLES = ["investor", "developer", "partner", "internal", "staff"] as const;

export default async function AdminUsersPage() {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const currentUser = await getPortalUser(authUser.id);
  if (!currentUser || !currentUser.isAdmin) redirect("/dashboard");

  const [users, projects] = await Promise.all([getAllUsersWithAccess(), getAllProjectsForAdmin()]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin" className="font-display text-xs uppercase tracking-wider text-ink/40 hover:text-ink">
        ← Internal hub
      </Link>

      <h1 className="mt-4 font-display text-2xl font-medium text-ink">Users</h1>
      <p className="mt-2 text-sm text-ink/55">Add people, grant or revoke project roles, and manage admin status.</p>

      <section className="mt-8 border border-ink/10 bg-paper p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink/50">Invite a new user</h2>
        <form action={inviteUser} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Email</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-56 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">
              Name (optional)
            </label>
            <input
              type="text"
              name="name"
              className="mt-1 w-40 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-ink/70">
            <input type="checkbox" name="isAdmin" className="h-4 w-4" />
            Admin
          </label>
          <button
            type="submit"
            className="bg-accent px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-on-accent transition hover:bg-rust"
          >
            Invite
          </button>
        </form>
        <p className="mt-2 text-xs text-ink/40">
          Creates their login and adds them to the allow-list. Tell them to sign in at portal.bisonica.tech once
          added.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        {users.map((u) => (
          <div key={u.id} className="border border-ink/10 bg-paper p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-ink">
                  {u.email} {u.name && <span className="text-ink/50">— {u.name}</span>}
                </p>
                <p className="text-xs text-ink/40">
                  {u.isAdmin ? "Global admin" : "Standard user"} · joined{" "}
                  {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <form action={toggleAdmin}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="nextValue" value={(!u.isAdmin).toString()} />
                  <button
                    type="submit"
                    className="font-display text-[10px] uppercase tracking-wider text-brand hover:text-rust"
                  >
                    {u.isAdmin ? "Remove admin" : "Make admin"}
                  </button>
                </form>
                {u.id !== currentUser.id && (
                  <form action={removeUser}>
                    <input type="hidden" name="userId" value={u.id} />
                    <ConfirmButton
                      confirmMessage={`Remove ${u.email} from the portal? This deletes all their project access.`}
                      className="font-display text-[10px] uppercase tracking-wider text-ink/40 hover:text-red-500"
                    >
                      Remove
                    </ConfirmButton>
                  </form>
                )}
              </div>
            </div>

            {u.access.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-ink/10 pt-3">
                {u.access.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink/70">
                      <span className="font-display text-[10px] uppercase tracking-wider text-brand">{a.role}</span>{" "}
                      on {a.projectName}
                      {a.expiresAt && (
                        <span className="text-ink/40"> · expires {new Date(a.expiresAt).toLocaleDateString()}</span>
                      )}
                    </span>
                    <form action={revokeAccess}>
                      <input type="hidden" name="accessId" value={a.id} />
                      <ConfirmButton confirmMessage="Revoke this access?" className="text-xs text-ink/40 hover:text-red-500">
                        Revoke
                      </ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form action={grantAccess} className="mt-4 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-3">
              <input type="hidden" name="userId" value={u.id} />
              <div>
                <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">
                  Project
                </label>
                <select
                  name="projectId"
                  required
                  className="mt-1 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Role</label>
                <select
                  name="role"
                  required
                  className="mt-1 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">
                  Expires (optional)
                </label>
                <input
                  type="date"
                  name="expiresAt"
                  className="mt-1 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-accent px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-on-accent transition hover:bg-rust"
              >
                Grant
              </button>
            </form>
          </div>
        ))}

        {users.length === 0 && <p className="text-sm text-ink/50">No users yet.</p>}
        {projects.length === 0 && (
          <p className="text-sm text-ink/40">
            No projects exist yet, so access can't be granted — create one first (see the operations manual).
          </p>
        )}
      </section>
    </main>
  );
}
