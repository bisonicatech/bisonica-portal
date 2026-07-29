"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocumentArea } from "@/lib/access";

export function DocumentUploader({ projectId, area }: { projectId: string; area: DocumentArea }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUploading(true);

    const form = new FormData(e.currentTarget);
    form.set("projectId", projectId);
    form.set("area", area);

    const res = await fetch("/api/documents/upload", { method: "POST", body: form });
    setUploading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Upload failed");
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">Title</label>
        <input
          type="text"
          name="title"
          required
          className="mt-1 w-48 border border-ink/20 bg-paper px-2 py-1.5 text-sm text-ink placeholder-ink/30 focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block font-display text-[10px] uppercase tracking-wider text-ink/50">File</label>
        <input type="file" name="file" required className="mt-1 block text-sm text-ink/70" />
      </div>
      <button
        type="submit"
        disabled={uploading}
        className="bg-accent px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-on-accent transition hover:bg-rust disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
