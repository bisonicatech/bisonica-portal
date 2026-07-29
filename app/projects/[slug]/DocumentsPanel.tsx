import type { DocumentArea } from "@/lib/access";
import { listDocuments } from "@/lib/documents";
import { DocumentUploader } from "./DocumentUploader";

export async function DocumentsPanel({
  projectId,
  area,
  title,
  canUpload,
}: {
  projectId: string;
  area: DocumentArea;
  title: string;
  canUpload: boolean;
}) {
  const documents = await listDocuments(projectId, area);

  return (
    <section className="border border-ink/10 bg-paper p-5">
      <h2 className="font-display text-sm uppercase tracking-wider text-ink/50">{title}</h2>

      {canUpload && (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <DocumentUploader projectId={projectId} area={area} />
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between border-t border-ink/10 pt-2 first:border-t-0 first:pt-0">
            <div>
              <p className="text-sm text-ink">{doc.title}</p>
              <p className="text-xs text-ink/40">{new Date(doc.createdAt).toLocaleDateString()}</p>
            </div>
            <a
              href={`/api/documents/${doc.id}`}
              className="font-display text-xs uppercase tracking-wider text-brand hover:text-rust"
            >
              Download
            </a>
          </li>
        ))}

        {documents.length === 0 && <p className="text-sm text-ink/40">No documents yet.</p>}
      </ul>
    </section>
  );
}
