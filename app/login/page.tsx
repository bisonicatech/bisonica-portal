"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabase();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Invite-only: never silently create an auth.users row for an
        // unrecognized email. Admins provision accounts (see scripts/seed.ts /
        // the future admin invite flow) before someone can log in here.
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (otpError) {
      setError(
        otpError.message.toLowerCase().includes("signups not allowed")
          ? "That email hasn't been invited to the portal. Contact an admin."
          : otpError.message
      );
      return;
    }

    setSent(true);
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-display text-2xl font-medium text-ink">Bisonica Portal</h1>

      {sent ? (
        <p className="mt-8 text-sm text-ink/70">
          Check <span className="text-ink">{email}</span> for a sign-in link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block font-display text-xs uppercase tracking-wider text-ink/50">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-ink/20 bg-paper px-3 py-2 text-ink placeholder-ink/30 focus:border-accent focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent px-4 py-3 font-display text-xs font-semibold uppercase tracking-[0.1em] text-on-accent transition hover:bg-rust disabled:opacity-50"
          >
            {loading ? "Sending link..." : "Send magic link"}
          </button>

          <p className="text-xs text-ink/40">
            Access is invite-only. If you haven&apos;t been added to a project, this won&apos;t send a link.
          </p>
        </form>
      )}
    </main>
  );
}
