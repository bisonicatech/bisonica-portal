"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="font-display text-xs uppercase tracking-wider text-ink/50 hover:text-ink"
    >
      Log out
    </button>
  );
}
