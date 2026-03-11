import { useRef, useState } from "react";

import Button from "../common/Button.jsx";
import { uploadDocument } from "../../services/api.js";

export default function DocumentUpload({ onUploaded }) {
  const formRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [detectedType, setDetectedType] = useState(null);
  const [detectedLifecycleId, setDetectedLifecycleId] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset detected values
    setDetectedType(null);
    setDetectedLifecycleId(null);
    setIsDetecting(true);
    
    // Auto-detect from filename (more specific patterns to avoid false matches)
    // Order matters - check specific types first
    const filename = file.name.toLowerCase();
    
    // More specific patterns with word boundaries to prevent false matches
    // Check in order: most specific first, then generic
    // Check prefix patterns first (most reliable)
    if (/^co_|^change.*order/i.test(filename)) {
      setDetectedType("Change Order");
    } else if (/^inv_|^invoice/i.test(filename)) {
      setDetectedType("Invoice");
    } else if (/^po_|^purchase.*order/i.test(filename)) {
      setDetectedType("Purchase Order");
    } else if (/^application_|application.*form|application.*id|job.*application|candidate/i.test(filename)) {
      setDetectedType("Application");
    } else if (/patient.*record|medical.*record|health.*record|patient.*id|lab.*result|labresult/i.test(filename)) {
      setDetectedType("Patient Record");
    } else if (/resume|cv|curriculum.*vitae/i.test(filename)) {
      setDetectedType("Resume");
    } else if (/offer.*letter|job.*offer|employment.*offer/i.test(filename)) {
      setDetectedType("Offer Letter");
    } else if (/interview.*feedback|interview.*notes/i.test(filename)) {
      setDetectedType("Interview Feedback");
    } else if (/financial.*statement|financialstatement/i.test(filename)) {
      setDetectedType("Financial Statement");
    } else if (/compliance.*report|compliance/i.test(filename)) {
      setDetectedType("Compliance Report");
    } else if (/expense.*report|expense/i.test(filename)) {
      setDetectedType("Expense Report");
    } else if (/proposal/i.test(filename) && !/purchase/i.test(filename)) {
      setDetectedType("Proposal");
    } else if (/purchase.*order|\bpo\s*#|p\.o\./i.test(filename)) {
      setDetectedType("Purchase Order");
    } else if (/change.*order|\bco\s*#/i.test(filename) && !/compliance|compliance.*report/i.test(filename)) {
      setDetectedType("Change Order");
    } else if (/invoice|\binv\s*#/i.test(filename)) {
      setDetectedType("Invoice");
    } else if (/contract|agreement/i.test(filename)) {
      setDetectedType("Contract");
    } else if (/report|summary/i.test(filename)) {
      setDetectedType("Report");
    } else if (/quote|quotation|estimate/i.test(filename)) {
      setDetectedType("Proposal");
    } else if (/receipt/i.test(filename)) {
      setDetectedType("Receipt");
    } else if (/certificate|certification/i.test(filename)) {
      setDetectedType("Certificate");
    } else if (/lead|prospect/i.test(filename)) {
      setDetectedType("Lead");
    }
    
    // Try to extract lifecycle ID from filename
    // Patterns: LC001, lifecycle_001, LC-001, lifecycle-001, etc.
    const lifecyclePatterns = [
      /(?:^|_|-)lc[_\s-]?([0-9]{3,})/i,  // LC001, LC_001, LC-001
      /(?:^|_|-)lifecycle[_\s-]?([0-9]{3,})/i,  // lifecycle_001, lifecycle-001
      /lc([0-9]{3,})/i,  // LC001 (at start)
    ];
    
    for (const pattern of lifecyclePatterns) {
      const match = filename.match(pattern);
      if (match) {
        const id = match[1] || match[0];
        // Normalize to lifecycle_XXX format
        setDetectedLifecycleId(`lifecycle_${id.padStart(3, '0')}`);
        break;
      }
    }
    
    setIsDetecting(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    
    const form = formRef.current || event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");
    const documentType = formData.get("document_type") || detectedType;
    const lifecycleId = formData.get("lifecycle_id") || detectedLifecycleId;
    
    // Validate inputs
    if (!file || !file.name) {
      setError("Please select a file to upload.");
      return;
    }
    
    // Document type and lifecycle ID are now optional (will be auto-detected)
    // But we'll use detected values if available
    if (documentType) {
      formData.set("document_type", documentType);
    }
    if (lifecycleId) {
      formData.set("lifecycle_id", lifecycleId);
    }
    
    console.log("Uploading document:", {
      filename: file.name,
      type: file.type,
      size: file.size,
      documentType: documentType || "(will be auto-detected)",
      lifecycleId: lifecycleId || "(will be auto-detected)"
    });
    
    setIsUploading(true);
    
    try {
      const response = await uploadDocument(formData);
      console.log("Upload successful:", response);
      setSuccess(`Document "${response.filename}" uploaded successfully! Auto-detected: ${response.document_type} → ${response.lifecycle_id}`);
      if (onUploaded) {
        onUploaded(response);
      }
      if (formRef.current) {
        formRef.current.reset();
      }
      setDetectedType(null);
      setDetectedLifecycleId(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Upload error details:", err);
      const errorMessage = err.message || err.response?.data?.detail || "Failed to upload document. Please check the console for details.";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.9)]"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Upload Document</h3>
        <p className="text-xs text-slate-500">
          Attach documents to enrich the lifecycle graph. Supports any document type.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="min-w-0">
          <input
            name="file"
            type="file"
            required
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.xls,.json"
            className="w-full rounded-lg border border-slate-700/70 bg-slate-950/80 p-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-500/20 file:px-3 file:py-1 file:text-xs file:text-indigo-200 hover:border-slate-500"
          />
          {isDetecting && (
            <p className="mt-1 text-xs text-indigo-300">Detecting...</p>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            name="document_type"
            type="text"
            placeholder="Document type (auto-detected if empty)"
            defaultValue={detectedType || ""}
            className="w-full min-w-[200px] rounded-lg border border-slate-700/70 bg-slate-950/80 p-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
          />
          {detectedType && (
            <p className="mt-1 text-xs text-emerald-300">✓ Detected: {detectedType}</p>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            name="lifecycle_id"
            type="text"
            placeholder="Lifecycle ID (auto-detected if empty)"
            defaultValue={detectedLifecycleId || ""}
            className="w-full min-w-[200px] rounded-lg border border-slate-700/70 bg-slate-950/80 p-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
          />
          {detectedLifecycleId && (
            <p className="mt-1 text-xs text-emerald-300">✓ Detected: {detectedLifecycleId}</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">Max size: 10MB · PDF, DOCX, TXT, CSV, XLSX, JSON</p>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload Document"}
        </Button>
      </div>
      
      {error && (
        <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          <p className="font-semibold">Upload Failed</p>
          <p className="text-xs text-rose-300/80">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          <p className="font-semibold">✓ Success!</p>
          <p className="text-xs text-emerald-300/80">{success}</p>
        </div>
      )}
    </form>
  );
}
