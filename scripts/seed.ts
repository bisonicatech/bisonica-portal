// Bootstraps a test user + sample project until the real /admin invite flow
// exists. Run from a terminal in this project's directory:
//
//   npm run seed -- you@example.com admin
//   npm run seed -- someoneelse@example.com investor
//
// Second arg is either "admin" (full access to every project, no project role
// needed) or one of investor | developer | partner | internal | staff
// (creates a project_access row on the sample project so you can verify that
// role's tab visibility — "staff" should unlock all five tabs on that one
// project, same as admin does everywhere).
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const [, , email, roleArg, projectName] = process.argv;

if (!email || !roleArg) {
  console.error("Usage: npm run seed -- <email> <admin|investor|developer|partner|internal|staff> [projectName]");
  process.exit(1);
}

const VALID_ROLES = ["investor", "developer", "partner", "internal", "staff"] as const;
const isAdmin = roleArg === "admin";

if (!isAdmin && !VALID_ROLES.includes(roleArg as (typeof VALID_ROLES)[number])) {
  console.error(`Role must be "admin" or one of: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  // email_confirm: true — this creates the auth.users row directly (no
  // confirmation email needed); the person then logs in later via the normal
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

  const { error: userUpsertError } = await admin
    .from("users")
    .upsert({ id: authUserId, email, is_admin: isAdmin }, { onConflict: "id" });
  if (userUpsertError) throw userUpsertError;

  console.log(`✓ users row ready for ${email} (is_admin=${isAdmin})`);

  const slug = "sample";
  const { data: project, error: projectError } = await admin
    .from("projects")
    .upsert(
      { slug, name: projectName ?? "Sample Project", summary: "Seeded test project for milestone 1." },
      { onConflict: "slug" }
    )
    .select("id, slug")
    .single();
  if (projectError) throw projectError;

  console.log(`✓ project ready: /projects/${project.slug}`);

  if (!isAdmin) {
    const { error: accessError } = await admin
      .from("project_access")
      .upsert(
        { user_id: authUserId, project_id: project.id, role: roleArg },
        { onConflict: "user_id,project_id,role" }
      );
    if (accessError) throw accessError;
    console.log(`✓ granted ${roleArg} role on ${project.slug} to ${email}`);
  }

  console.log("\nDone — log in at /login with this email to test.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
