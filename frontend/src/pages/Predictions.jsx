import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import Button from "../components/common/Button.jsx";
import RiskDashboard from "../components/predictions/RiskDashboard.jsx";
import usePredictions from "../hooks/usePredictions.js";
import { fetchTrends, listLifecycles } from "../services/api.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

export default function Predictions() {
  const { lifecycleId } = useParams();
  const navigate = useNavigate();
  const { prediction, loading, refresh } = usePredictions(lifecycleId);
  const [trends, setTrends] = useState({ risk_trend: [], volume_trend: [] });
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [availableLifecycles, setAvailableLifecycles] = useState([]);
  const [showLifecycleSelector, setShowLifecycleSelector] = useState(false);

  useEffect(() => {
    const loadTrends = async () => {
      setTrendsLoading(true);
      try {
        const data = await fetchTrends(lifecycleId);
        setTrends(data);
      } catch (error) {
        console.error("Failed to load trends:", error);
        // Set empty trends on error
        setTrends({ risk_trend: [], volume_trend: [] });
      } finally {
        setTrendsLoading(false);
      }
    };
    if (lifecycleId) {
      loadTrends();
    }
  }, [lifecycleId]);

  useEffect(() => {
    const loadLifecycles = async () => {
      try {
        const data = await listLifecycles();
        if (data && data.lifecycles && Array.isArray(data.lifecycles)) {
          setAvailableLifecycles(data.lifecycles);
          // If no lifecycleId provided or current lifecycle doesn't exist, navigate to first available
          if (data.lifecycles.length > 0) {
            const currentLifecycleExists = lifecycleId && data.lifecycles.some(lc => lc.lifecycle_id === lifecycleId);
            if (!lifecycleId || !currentLifecycleExists) {
              navigate(`/predictions/${data.lifecycles[0].lifecycle_id}`, { replace: true });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load lifecycles:", error);
      }
    };
    loadLifecycles();
  }, [lifecycleId, navigate]);

  // Close lifecycle selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLifecycleSelector && !event.target.closest('.lifecycle-selector')) {
        setShowLifecycleSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLifecycleSelector]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">Risk Forecast</h2>
              <div className="relative lifecycle-selector">
                <button
                  onClick={() => setShowLifecycleSelector(!showLifecycleSelector)}
                  className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800/40 transition"
                  title="Switch lifecycle"
                >
                  Switch Lifecycle {showLifecycleSelector ? '▲' : '▼'} 
                  {availableLifecycles.length > 0 && (
                    <span className="ml-1 text-indigo-300">({availableLifecycles.length})</span>
                  )}
                </button>
                {showLifecycleSelector && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-64 rounded-xl border border-slate-800/80 bg-slate-900/95 p-2 shadow-xl max-h-96 overflow-y-auto lifecycle-selector">
                    <p className="text-xs uppercase text-slate-500 px-2 py-1 mb-1 font-semibold">
                      Available Lifecycles {availableLifecycles.length > 0 && `(${availableLifecycles.length})`}
                    </p>
                    {availableLifecycles.length === 0 ? (
                      <div className="px-2 py-4 text-xs text-slate-500 text-center">
                        <p>No lifecycles found</p>
                      </div>
                    ) : (
                      availableLifecycles.map((lc) => (
                        <button
                          key={lc.lifecycle_id}
                          onClick={() => {
                            navigate(`/predictions/${lc.lifecycle_id}`);
                            setShowLifecycleSelector(false);
                          }}
                          className={`w-full text-left rounded-lg px-3 py-2 text-xs transition mb-1 ${
                            lc.lifecycle_id === lifecycleId
                              ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/40"
                              : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{lc.lifecycle_id}</span>
                            <span className="text-slate-500">({lc.event_count || 0} events)</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Lifecycle {lifecycleId} · AI-driven risk scoring.
            </p>
          </div>
          <Button onClick={refresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh Prediction"}
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner label="Loading prediction..." />
        </div>
      ) : prediction && prediction.lifecycle_id ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Model Version</p>
              <p className="mt-2 text-2xl font-semibold">v1.5</p>
              <p className="text-xs text-slate-400">bge-large + delta engine</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Risk Score</p>
              <p className="mt-2 text-2xl font-semibold">{Math.round(prediction.risk_score * 100)}%</p>
              <p className={`text-xs capitalize ${
                prediction.risk_label === 'high' ? 'text-rose-300' :
                prediction.risk_label === 'medium' ? 'text-amber-300' :
                'text-emerald-300'
              }`}>
                {prediction.risk_label} risk
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Risk Drivers</p>
              <p className="mt-2 text-2xl font-semibold">{prediction.drivers?.length || 0}</p>
              <p className="text-xs text-slate-400">Drivers identified</p>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800/70 bg-slate-900/30 p-8 text-center">
          <p className="text-sm text-slate-400">No prediction data available for this lifecycle.</p>
          <p className="mt-2 text-xs text-slate-500">Upload documents to generate risk predictions.</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Risk Trend</p>
          <div className="mt-3 h-52">
            {trendsLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : trends.risk_trend && trends.risk_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.risk_trend}>
                <XAxis dataKey="period" stroke="#64748b" tickLine={false} />
                <YAxis
                  domain={[0, 1]}
                  stroke="#64748b"
                  tickLine={false}
                  tickFormatter={(value) => `${Math.round(value * 100)}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12
                  }}
                  formatter={(value) => `${Math.round(value * 100)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: "#6366f1" }}
                />
              </LineChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No trend data available
              </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Document Volume</p>
          <div className="mt-3 h-52">
            {trendsLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : trends.volume_trend && trends.volume_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.volume_trend}>
                <XAxis dataKey="period" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12
                  }}
                />
                <Bar dataKey="docs" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No volume data available
              </div>
            )}
          </div>
        </div>
      </div>
      <RiskDashboard prediction={prediction} />
    </div>
  );
}
