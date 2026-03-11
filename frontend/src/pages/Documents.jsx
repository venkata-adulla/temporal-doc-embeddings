import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import DocumentUpload from "../components/documents/DocumentUpload.jsx";
import DocumentList from "../components/documents/DocumentList.jsx";
import DocumentDetails from "../components/documents/DocumentDetails.jsx";
import { fetchDocumentStats, listDocuments } from "../services/api.js";

export default function Documents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    documents_today: 0,
    documents_yesterday: 0,
    avg_processing_time: 0,
    queue_pending: 0,
    ocr_success_rate: 0,
    active_lifecycles: 0,
    high_risk_lifecycles: 0
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load documents with search query if present
        console.log("Loading documents with search query:", searchQuery);
        const docsData = await listDocuments(null, searchQuery);
        console.log("Documents API response:", docsData);
        if (docsData && docsData.documents && Array.isArray(docsData.documents)) {
          setDocuments(docsData.documents);
          console.log(`Loaded ${docsData.documents.length} documents${searchQuery ? ` matching "${searchQuery}"` : ""}`);
        } else {
          console.warn("No documents in response or invalid format:", docsData);
          setDocuments([]);
        }
        
        // Load stats
        const statsData = await fetchDocumentStats();
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load documents/stats:", error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [searchQuery]);

  const handleUploaded = (document) => {
    setDocuments((prev) => [document, ...prev]);
    setSelected(document);
    // Refresh the list to get all documents
    listDocuments().then((data) => {
      if (data.documents && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
    }).catch(console.error);
  };

  const handleDocumentSelect = (document) => {
    setSelected(document);
  };

  const handleLifecycleClick = (lifecycleId, event) => {
    event.stopPropagation(); // Prevent row click
    navigate(`/lifecycles/${lifecycleId}`);
  };
  
  const documentsDiff = stats.documents_today - stats.documents_yesterday;
  const diffText = documentsDiff >= 0 
    ? `+${documentsDiff} vs yesterday` 
    : `${documentsDiff} vs yesterday`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Document Intake</h2>
            <p className="text-sm text-slate-400">
              Upload documents and review parsed entities for any lifecycle type.
            </p>
          </div>
          <div className="flex gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Queue: {stats.queue_pending} pending
            </span>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-200">
              OCR: {stats.ocr_success_rate > 0 ? `${Math.round(stats.ocr_success_rate)}%` : 'N/A'} success
            </span>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Documents Today</p>
          <p className="mt-2 text-2xl font-semibold">{stats.documents_today}</p>
          <p className={`text-xs ${documentsDiff >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {diffText}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Avg Processing</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.avg_processing_time > 0 ? `${stats.avg_processing_time}s` : 'N/A'}
          </p>
          <p className="text-xs text-slate-400">Across 3 pipelines</p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Active Lifecycles</p>
          <p className="mt-2 text-2xl font-semibold">{stats.active_lifecycles}</p>
          <p className="text-xs text-amber-300">
            {stats.high_risk_lifecycles > 0 ? `${stats.high_risk_lifecycles} high risk` : 'No high risk'}
          </p>
        </div>
      </div>
      <DocumentUpload onUploaded={handleUploaded} />
      {searchQuery && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
          Showing results for: <span className="font-semibold">"{searchQuery}"</span> ({documents.length} documents found)
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        {loading ? (
          <div className="col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            Loading documents...
          </div>
        ) : documents.length === 0 && searchQuery ? (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            No documents found matching "{searchQuery}".
            <p className="mt-2 text-xs text-slate-500">Try a different search term or clear the search.</p>
          </div>
        ) : (
          <>
            <DocumentList 
              documents={documents} 
              onSelect={handleDocumentSelect}
              onLifecycleClick={handleLifecycleClick}
            />
            <DocumentDetails document={selected} />
          </>
        )}
      </div>
    </div>
  );
}
