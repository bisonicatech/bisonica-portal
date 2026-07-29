import Link from "next/link";
import type { ProjectRole } from "@/lib/access";

const TABS: { href: string; label: string; requiresRole?: ProjectRole }[] = [
  { href: "", label: "Overview" },
  { href: "/investors", label: "Investors", requiresRole: "investor" },
  { href: "/developers", label: "Developers", requiresRole: "developer" },
  { href: "/partners", label: "Partners", requiresRole: "partner" },
  { href: "/internal", label: "Internal", requiresRole: "internal" },
];

export function ProjectTabsNav({
  slug,
  roles,
  isAdmin,
}: {
  slug: string;
  roles: ProjectRole[];
  isAdmin: boolean;
}) {
  const hasFullAccess = isAdmin || roles.includes("staff");
  const visibleTabs = TABS.filter((tab) => !tab.requiresRole || hasFullAccess || roles.includes(tab.requiresRole));

  return (
    <nav className="mt-6 flex gap-1 border-b border-ink/10">
      {visibleTabs.map((tab) => (
        <Link
          key={tab.href}
          href={`/projects/${slug}${tab.href}`}
          className="px-3 py-2 font-display text-xs uppercase tracking-wider text-ink/60 hover:text-ink"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
