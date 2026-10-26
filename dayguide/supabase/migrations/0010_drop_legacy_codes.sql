-- Run this AFTER every phone has the app build from the security update and has been
-- opened once (so it has switched to the new long family code). After this, the old
-- 10-character codes stop working completely.
-- Safe to run more than once.

update public.dg_households set legacy_code = null where legacy_code is not null;
