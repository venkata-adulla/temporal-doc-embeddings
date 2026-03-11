import axios from "axios";

const DEFAULT_DEV_API_BASE_URL = "http://localhost:8000";
const API_PREFIX = "/api";

function normalizeBaseUrl(url) {
  return (url || "").replace(/\/+$/, "");
}

function stripTrailingApiSegment(url) {
  return url.replace(/\/api$/i, "");
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (configuredBaseUrl) {
    // API endpoints in this file are already prefixed with `/api/...`.
    // If users configure `VITE_API_BASE_URL` as `https://host/api`,
    // requests can become `/api/api/...` and fail with 404.
    return stripTrailingApiSegment(normalizeBaseUrl(configuredBaseUrl));
  }

  // In production default to same-origin so deployments can use rewrites/proxies.
  return import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : "";
}

const API_BASE_URL = resolveApiBaseUrl();
const API_KEY = import.meta.env.VITE_API_KEY || "dev-local-key";
const defaultHeaders = API_KEY ? { "X-API-Key": API_KEY } : {};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: defaultHeaders
});

function withApiPrefix(path) {
  return `${API_PREFIX}${path}`;
}

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config || {};
    const statusCode = error.response?.status;

    if (statusCode === 404) {
      const candidates = originalConfig.__fallbackCandidates || buildFallbackUrls(originalConfig.url);
      if (candidates.length > 0) {
        const [nextUrl, ...rest] = candidates;
        return api.request({
          ...originalConfig,
          url: nextUrl,
          __fallbackCandidates: rest
        });
      }
    }

    const message = error.response?.data?.detail || error.message || "An error occurred";
    console.error("API Error:", message);
    return Promise.reject(new Error(message));
  }
);

export async function uploadDocument(formData) {
  console.log("Sending upload request to /api/documents/upload");
  try {
    const { data } = await api.post("/api/documents/upload", formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
        ...defaultHeaders
      },
      timeout: 60000 // 60 second timeout for large files
    });
    console.log("Upload response received:", data);
    return data;
  } catch (error) {
    console.error("Upload API error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    throw error;
  }
}

export async function fetchLifecycle(lifecycleId) {
  const { data } = await api.get(withApiPrefix(`/lifecycles/${lifecycleId}`));
  return data;
}

export async function listLifecycles(search = null) {
  const params = search ? { search } : {};
  const { data } = await api.get(withApiPrefix("/lifecycles"), { params });
  return data;
}

export async function fetchLifecycleGraph(lifecycleId) {
  const { data } = await api.get(withApiPrefix(`/lifecycles/${lifecycleId}/graph`));
  return data;
}

export async function fetchPrediction(lifecycleId) {
  const { data } = await api.get(withApiPrefix(`/predictions/${lifecycleId}/risk`));
  return data;
}

export async function listDocuments(lifecycleId = null, search = null) {
  const params = {};
  if (lifecycleId) params.lifecycle_id = lifecycleId;
  if (search) params.search = search;
  const { data } = await api.get(withApiPrefix("/documents"), { params });
  return data;
}

export async function listOutcomes(lifecycleId = null, outcomeType = null) {
  const params = {};
  if (lifecycleId) params.lifecycle_id = lifecycleId;
  if (outcomeType) params.outcome_type = outcomeType;
  const { data } = await api.get(withApiPrefix("/outcomes"), { params });
  return data;
}

export async function createOutcome(payload) {
  const { data } = await api.post(withApiPrefix("/outcomes"), payload);
  return data;
}

export async function fetchDashboardStats() {
  const { data } = await api.get(withApiPrefix("/dashboard/stats"));
  return data;
}

export async function fetchNotifications() {
  const { data } = await api.get(withApiPrefix("/dashboard/notifications"));
  return data;
}

export async function fetchDocumentStats() {
  const { data } = await api.get(withApiPrefix("/documents/stats"));
  return data;
}

export async function fetchHealthStatus() {
  const { data } = await api.get("/health/detailed");
  return data;
}

export async function fetchLifecycleMetrics(lifecycleId) {
  const { data } = await api.get(withApiPrefix(`/lifecycles/${lifecycleId}/metrics`));
  return data;
}

export async function fetchDeltaAnalysis(lifecycleId) {
  const { data } = await api.get(withApiPrefix(`/lifecycles/${lifecycleId}/delta-analysis`));
  return data;
}

export async function fetchTrends(lifecycleId) {
  const { data } = await api.get(withApiPrefix(`/predictions/${lifecycleId}/trends`));
  return data;
}

export async function queryChatbot(question, sessionId = null) {
  const payload = { question };
  if (sessionId) payload.session_id = sessionId;
  const { data } = await api.post(withApiPrefix("/chatbot/query"), payload);
  return data;
}

function parseFilenameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) return null;
  const match = /filename="?([^"]+)"?/i.exec(contentDisposition);
  return match?.[1] || null;
}

export async function downloadLifecycleExport(lifecycleId, format) {
  try {
    const response = await api.get(withApiPrefix(`/lifecycles/${lifecycleId}/export`), {
      params: { format },
      responseType: "blob"
    });

    const contentDisposition = response.headers?.["content-disposition"];
    const defaultExt = format === "csv" ? "csv" : format === "pdf" ? "pdf" : "json";
    const filename =
      parseFilenameFromContentDisposition(contentDisposition) ||
      `lifecycle_${lifecycleId}.${defaultExt}`;

    return {
      blob: response.data,
      filename,
      contentType: response.headers?.["content-type"] || "application/octet-stream"
    };
  } catch (error) {
    // If backend returned JSON error as blob, extract "detail"
    const contentType = error?.response?.headers?.["content-type"] || "";
    const data = error?.response?.data;
    if (data instanceof Blob && contentType.includes("application/json")) {
      try {
        const text = await data.text();
        const parsed = JSON.parse(text);
        const message = parsed?.detail || error.message;
        throw new Error(message);
      } catch {
        // fall through
      }
    }
    throw error;
  }
}
