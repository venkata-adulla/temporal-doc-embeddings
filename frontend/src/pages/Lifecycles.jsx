import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

import DeltaVisualization from "../components/lifecycle/DeltaVisualization.jsx";
import LifecycleGraph from "../components/lifecycle/LifecycleGraph.jsx";
import LifecycleTimeline from "../components/lifecycle/LifecycleTimeline.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import useLifecycle from "../hooks/useLifecycle.js";
import { fetchLifecycleMetrics, listLifecycles } from "../services/api.js";

export default function Lifecycles() {
  const { lifecycleId } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");
  const navigate = useNavigate();
  const { lifecycle, loading } = useLifecycle(lifecycleId);
  const [availableLifecycles, setAvailableLifecycles] = useState([]);
  const [showLifecycleSelector, setShowLifecycleSelector] = useState(false);
  const [lifecyclesLoading, setLifecyclesLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    change_orders: 0,
    change_orders_30d: 0,
    cycle_time_days: 0,
    cycle_time_target: 18,
    cost_variance_percent: 0.0,
    cost_variance_status: "normal"
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchLifecycleMetrics(lifecycleId);
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load lifecycle metrics:", error);
        // Keep default values on error
      }
    };
    if (lifecycleId) {
      loadMetrics();
    }
  }, [lifecycleId]);

  useEffect(() => {
    const loadLifecycles = async () => {
      setLifecyclesLoading(true);
      try {
        // Pass search query to API if present
        const data = await listLifecycles(searchQuery);
        console.log("Loaded lifecycles:", data);
        if (data && data.lifecycles && Array.isArray(data.lifecycles)) {
          setAvailableLifecycles(data.lifecycles);
          console.log(`Found ${data.lifecycles.length} lifecycles${searchQuery ? ` matching "${searchQuery}"` : ""}`);
          
          // If search query exists and we have results, navigate to first matching lifecycle
          // Also navigate if lifecycleId is not provided or doesn't exist
          if (data.lifecycles.length > 0) {
            const currentLifecycleExists = lifecycleId && data.lifecycles.some(lc => lc.lifecycle_id === lifecycleId);
            if ((searchQuery || !lifecycleId || !currentLifecycleExists) && data.lifecycles.length > 0) {
              const targetId = searchQuery ? data.lifecycles[0].lifecycle_id : data.lifecycles[0].lifecycle_id;
              const searchParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
              navigate(`/lifecycles/${targetId}${searchParam}`, { replace: true });
            }
          }
        } else {
          console.warn("No lifecycles data received:", data);
          setAvailableLifecycles([]);
        }
      } catch (error) {
        console.error("Failed to load lifecycles:", error);
        setAvailableLifecycles([]);
      } finally {
        setLifecyclesLoading(false);
      }
    };
    loadLifecycles();
  }, [searchQuery, navigate, lifecycleId]);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!lifecycle) {
    return <p className="text-sm text-slate-400">No lifecycle found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">Lifecycle {lifecycleId}</h2>
              <div className="relative lifecycle-selector">
                <button
                  onClick={() => setShowLifecycleSelector(!showLifecycleSelector)}
                  disabled={lifecyclesLoading}
                  className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Switch lifecycle"
                >
                  {lifecyclesLoading ? (
                    "Loading..."
                  ) : (
                    <>
                      Switch Lifecycle {showLifecycleSelector ? '▲' : '▼'} 
                      {availableLifecycles.length > 0 && (
                        <span className="ml-1 text-indigo-300">({availableLifecycles.length})</span>
                      )}
                    </>
                  )}
                </button>
                {showLifecycleSelector && !lifecyclesLoading && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-64 rounded-xl border border-slate-800/80 bg-slate-900/95 p-2 shadow-xl max-h-96 overflow-y-auto lifecycle-selector">
                    <p className="text-xs uppercase text-slate-500 px-2 py-1 mb-1 font-semibold">
                      Available Lifecycles {availableLifecycles.length > 0 && `(${availableLifecycles.length})`}
                    </p>
                    {availableLifecycles.length === 0 ? (
                      <div className="px-2 py-4 text-xs text-slate-500 text-center">
                        <p>No lifecycles found</p>
                        <p className="mt-1 text-[10px]">Upload documents to create lifecycles</p>
                      </div>
                    ) : (
                      availableLifecycles.map((lc) => (
                        <button
                          key={lc.lifecycle_id}
                          onClick={() => {
                            navigate(`/lifecycles/${lc.lifecycle_id}`);
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
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              lc.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                              lc.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-slate-700/50 text-slate-400'
                            }`}>
                              {lc.status || 'unknown'}
                            </span>
                            {lc.lifecycle_type && (
                              <span className="text-[10px] text-slate-500">{lc.lifecycle_type}</span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Timeline, graph relationships, and temporal delta insights.
            </p>
          </div>
          <div className="flex gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Status: {lifecycle.status}
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Events: {lifecycle.events.length}
            </span>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Change Events</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.change_orders}</p>
          {metrics.change_orders_30d > 0 ? (
            <p className="text-xs text-amber-300">+{metrics.change_orders_30d} in 30 days</p>
          ) : (
            <p className="text-xs text-slate-400">No recent changes</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Cycle Time</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.cycle_time_days > 0 ? `${metrics.cycle_time_days}d` : 'N/A'}
          </p>
          <p className="text-xs text-slate-400">Target: {metrics.cycle_time_target}d</p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Variance</p>
          <p className="mt-2 text-2xl font-semibold">
            {metrics.cost_variance_percent !== 0 
              ? `${metrics.cost_variance_percent > 0 ? '+' : ''}${metrics.cost_variance_percent.toFixed(1)}%`
              : '0%'}
          </p>
          <p className={`text-xs ${
            metrics.cost_variance_status === 'above_threshold' ? 'text-rose-300' :
            metrics.cost_variance_status === 'below_threshold' ? 'text-emerald-300' :
            'text-slate-400'
          }`}>
            {metrics.cost_variance_status === 'above_threshold' ? 'Above threshold' :
             metrics.cost_variance_status === 'below_threshold' ? 'Below threshold' :
             'Within threshold'}
          </p>
        </div>
      </div>
      <LifecycleGraph lifecycleId={lifecycleId} />
      <div className="grid gap-4 md:grid-cols-2">
        <LifecycleTimeline events={lifecycle.events} />
        <DeltaVisualization events={lifecycle.events} lifecycleStatus={lifecycle.status} lifecycleId={lifecycleId} />
      </div>
    </div>
  );
}
