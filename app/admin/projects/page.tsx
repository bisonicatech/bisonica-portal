import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPortalUser } from "@/lib/access";
import { getAllProjectsWithStats } from "@/lib/admin";
import { createProject, updateProject, deleteProject } from "./actions";
import { ConfirmButton } from "../ConfirmButton";

export default async function AdminProjectsPage() {
  const supabase = createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const currentUser = await getPortalUser(authUser.id);
  if (!currentUser || !currentUser.isAdmin) redirect("/dashboard");

  const projects = await getAllProjectsWithStats();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin" className="font-display text-xs uppercase tracking-wider text-ink/40 hover:text-ink">
        ← Internal hub
      </Link>

      <h1 className="mt-4 font-display text-2xl font-medium text-ink">Projects</h1>
      <p className="mt-2 text-sm text-ink/55">Create, edit, and retire project spaces.</p>

      <section className="mt-8 border border-ink/10 bg-paper p-5">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink/50">Create a new project</h2>
        <form action={createProject} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Name</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 w-44 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Slug</label>
            <input
              type="text"
              name="slug"
              required
              pattern="[a-z0-9-]+"
              title="Lowercase letters, numbers, and hyphens only"
              className="mt-1 w-36 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Status</label>
            <select
              name="status"
              defaultValue="active"
              className="mt-1 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div className="w-full">
            <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">
              Summary (optional)
            </label>
            <input
              type="text"
              name="summary"
              className="mt-1 w-full border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-accent px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-on-accent transition hover:bg-rust"
          >
            Create
          </button>
        </form>
      </section>

      <section className="mt-6 space-y-4">
        {projects.map((p) => (
          <div key={p.id} className="border border-ink/10 bg-paper p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink/40">
                {p.accessCount} {p.accessCount === 1 ? "person has" : "people have"} access · {p.documentCount}{" "}
                {p.documentCount === 1 ? "document" : "documents"} · created{" "}
                {new Date(p.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href={`/projects/${p.slug}`}
                  className="font-display text-[10px] uppercase tracking-wider text-brand hover:text-rust"
                >
                  View project →
                </Link>
                <form action={deleteProject}>
                  <input type="hidden" name="projectId" value={p.id} />
                  <ConfirmButton
                    confirmMessage={`Delete "${p.name}"? This also deletes every document and access grant on it — cannot be undone.`}
                    className="font-display text-[10px] uppercase tracking-wider text-ink/40 hover:text-red-500"
                  >
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </div>

            <form action={updateProject} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="projectId" value={p.id} />
              <div>
                <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={p.name}
                  required
                  className="mt-1 w-44 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Slug</label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={p.slug}
                  required
                  pattern="[a-z0-9-]+"
                  className="mt-1 w-36 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Status</label>
                <select
                  name="status"
                  defaultValue={p.status}
                  className="mt-1 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="archived">archived</option>
                </select>
              </div>
              <div className="w-full">
                <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Summary</label>
                <input
                  type="text"
                  name="summary"
                  defaultValue={p.summary ?? ""}
                  className="mt-1 w-full border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="border border-ink/20 px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-ink transition hover:border-accent"
              >
                Save
              </button>
            </form>
          </div>
        ))}

        {projects.length === 0 && <p className="text-sm text-ink/50">No projects yet — create one above.</p>}
      </section>
    </main>
  );
}
