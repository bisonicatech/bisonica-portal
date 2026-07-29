-- Private bucket for project documents. All reads/writes go through the app's
-- API routes (app/api/documents/*) using the service-role client after an
-- application-level role check — same pattern as every other privileged read
-- in this app — so no anon/authenticated storage.objects policies are added
-- here; the default (no policy = no access for those roles) is what we want.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
