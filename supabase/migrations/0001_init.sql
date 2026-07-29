-- Portal users. One row per allowlisted person; id matches the corresponding
-- auth.users id 1:1 (created together when an admin invites someone — see
-- lib/access.ts / scripts/seed.ts). There is no public signup path that inserts
-- here directly.
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  summary text,
  created_at timestamptz not null default now()
);

-- 'staff' is a project-scoped superuser: full access to every tab on whatever
-- project they're granted it on (unlike is_admin on `users`, which is global
-- across every project).
create type project_role as enum ('investor', 'developer', 'partner', 'internal', 'staff');

-- A user can hold multiple roles on the same project (unique per user/project/role),
-- and different roles across different projects.
create table project_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  role project_role not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, project_id, role)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  area text not null check (area in ('overview', 'investors', 'developers', 'partners', 'internal')),
  title text not null,
  file_url text not null,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Append-only. Written for every document view/download, and for access changes.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  project_id uuid references projects(id),
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

alter table users enable row level security;
alter table projects enable row level security;
alter table project_access enable row level security;
alter table documents enable row level security;
alter table audit_log enable row level security;

-- These policies cover direct client-side reads with the anon key + user session.
-- Server components/route handlers do their own role checks in application code and
-- then use the service-role client (lib/supabase/admin.ts) for the actual project/
-- document reads, the same pattern used in the other Bisonica portal apps — RLS here
-- is a backstop, not the primary access-control layer.

create policy "users view own row" on users
  for select using (auth.uid() = id);

create policy "users view own access rows" on project_access
  for select using (user_id = auth.uid());

create policy "users view projects they have access to" on projects
  for select using (
    id in (select project_id from project_access where user_id = auth.uid())
    or exists (select 1 from users where id = auth.uid() and is_admin)
  );

create policy "users view documents for their project areas" on documents
  for select using (
    exists (select 1 from users where id = auth.uid() and is_admin)
    or exists (
      select 1 from project_access
      where project_access.user_id = auth.uid()
        and project_access.project_id = documents.project_id
        and project_access.role = 'staff'
    )
    or area = 'overview' and project_id in (
      select project_id from project_access where user_id = auth.uid()
    )
    or exists (
      select 1 from project_access
      where project_access.user_id = auth.uid()
        and project_access.project_id = documents.project_id
        and (
          (documents.area = 'investors' and project_access.role = 'investor')
          or (documents.area = 'developers' and project_access.role = 'developer')
          or (documents.area = 'partners' and project_access.role = 'partner')
          or (documents.area = 'internal' and project_access.role = 'internal')
        )
    )
  );

create policy "admins view audit log" on audit_log
  for select using (exists (select 1 from users where id = auth.uid() and is_admin));
