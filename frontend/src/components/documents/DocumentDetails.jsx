import Card from "../common/Card.jsx";

export default function DocumentDetails({ document }) {
  if (!document) {
    return (
      <Card title="Document Details">
        <p className="text-sm text-slate-400">Select a document to inspect.</p>
      </Card>
    );
  }

  return (
    <Card title="Document Details">
      <dl className="grid gap-3 text-sm text-slate-300">
        <div>
          <dt className="text-xs uppercase text-slate-500">Filename</dt>
          <dd className="text-slate-100">{document.filename}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Document ID</dt>
          <dd>{document.document_id}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Entities</dt>
          <dd>{document.entities?.join(", ") || "None detected"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Embedding</dt>
          <dd className="text-xs text-slate-400">
            {document.embedding_preview?.join(", ")}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
