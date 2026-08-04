# Bisonica Project Portal

Invite-only magic-link auth, the `project_access` role model, one project
space with all five tabs (Overview / Investors / Developers / Partners /
Internal) rendering conditionally by role, and document upload/download
backed by Supabase Storage. Every document upload or download is written to
`audit_log`. See "Not built yet" below for what's still missing.

## Setup

**1. Supabase dashboard** — create a new project (or reuse an existing
Supabase org). From Project Settings → API, copy the URL, anon key, and
service role key.

**2. Terminal, in this directory** — install dependencies and create your env file:

```
npm install
cp .env.local.example .env.local
```

Paste the three Supabase values from step 1 into `.env.local`.

**3. Supabase dashboard → SQL Editor** — run the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), then
[`supabase/migrations/0002_documents_storage.sql`](supabase/migrations/0002_documents_storage.sql)
(this second one creates the private `documents` storage bucket). Or, if you use the
Supabase CLI locally: `supabase db push` from the terminal.

**4. Supabase dashboard → Authentication → Providers → Email** — turn off
"Allow new users to sign up". This is what makes login invite-only: magic
links are only issued to emails that already exist in `auth.users`.

**5. Terminal** — seed yourself as an admin and create the sample project:

```
npm run seed -- you@example.com admin
```

**6. Terminal** — run the dev server:

```
npm run dev
```

Then open `http://localhost:3000`, log in with the email you seeded, and
follow the magic link (check that inbox — Supabase sends it).

To test role-gating instead of the admin bypass, seed a second email with a
single role, e.g.:

```
npm run seed -- teammate@example.com investor
```

That person will only see the Overview and Investors tabs on `/projects/sample`.

`staff` is a project-scoped role that unlocks all five tabs on the one project
it's granted on (unlike `admin`, which is global across every project):

```
npm run seed -- staffer@example.com staff
```

## Document uploads

Each tab (Overview, Investors, Developers, Partners, Internal) has its own
document vault backed by the private `documents` Supabase Storage bucket.
Who can upload where: anyone with the matching role on that area (e.g. any
investor can upload to Investors), plus `staff`/admin who can upload
anywhere on their project. Overview is the exception — only `staff`/admin can
upload there, since it's the shared cross-role summary area, not a per-role
one.

Every download link points through `/api/documents/[id]`, which re-checks
the requester's access, writes an `audit_log` row (`document_view`), and only
then redirects to a short-lived (60s) signed URL — so the file is never
reachable by a bare storage link, and every open is logged.

## Admin hub

`/admin` (admin-only) is a master tracker — every project with its status,
people-with-access count, and document count — with links to:

- `/admin/users` — invite people, grant/revoke project roles (with optional
  expiry), toggle admin status. No SQL needed for any of this anymore.
- `/admin/projects` — create, edit, or delete project spaces.
- `/admin/audit` — browse the last 200 audit_log entries (document views/
  uploads, and every access change made through the pages above).

All of the mutating actions here are Next.js Server Actions, re-check admin
status server-side independent of the page gate, and are fail-closed the
same way document upload/download are — if the audit log write fails, the
action is rolled back rather than left unlogged.

## Not built yet (needs your sign-off first)

- Deleting/editing a document once uploaded, or editing Overview tab content
  (timeline/key contacts) — both still require direct Supabase access
- Visual watermarking on downloads (we went with audit-log-only per your
  call — flag if you want watermarking added later)
- 2FA for admin accounts (called for in the original brief, not built)
- Access expiry enforcement is implemented in the query logic but untested
  against a real expired row
