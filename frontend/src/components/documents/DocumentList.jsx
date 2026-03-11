export default function DocumentList({ documents, onSelect, onLifecycleClick }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 p-6 text-sm text-slate-400">
        No documents found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-3 py-2">Filename</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Lifecycle</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.document_id}
              className="group cursor-pointer border-t border-slate-800/80 transition hover:bg-slate-800/60 hover:border-indigo-500/30"
              onClick={() => onSelect?.(doc)}
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {doc.filename}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200">
                  {doc.document_type}
                </span>
              </td>
              <td className="px-3 py-2.5">
                {doc.lifecycle_id ? (
                  <button
                    onClick={(e) => onLifecycleClick?.(doc.lifecycle_id, e)}
                    className="text-slate-400 hover:text-indigo-300 hover:underline transition-colors"
                    title={`View lifecycle ${doc.lifecycle_id}`}
                  >
                    {doc.lifecycle_id}
                  </button>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
