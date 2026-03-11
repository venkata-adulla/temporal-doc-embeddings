import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis
} from "recharts";
import Card from "../components/common/Card.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import useDashboard from "../hooks/useDashboard.js";

function formatTimeAgo(timestamp) {
  if (!timestamp) return "Unknown";
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return "Unknown";
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats, loading, error } = useDashboard();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedActivity = useMemo(() => {
    if (!stats?.recent_activity) return [];
    return stats.recent_activity.slice(0, 10).map((activity) => ({
      ...activity,
      display: activity.summary || activity.event_type,
      timeAgo: formatTimeAgo(activity.timestamp)
    }));
  }, [stats]);

  const statusChartData = useMemo(() => {
    if (!stats?.lifecycle_status_breakdown) return [];
    return Object.entries(stats.lifecycle_status_breakdown).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  }, [stats]);

  const eventTypeChartData = useMemo(() => {
    if (!stats?.event_type_distribution) return [];
    return Object.entries(stats.event_type_distribution)
      .slice(0, 6)
      .map(([type, count]) => ({
        name: type.replace(/_/g, ' ').substring(0, 20),
        value: count
      }));
  }, [stats]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        Error loading dashboard: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-800/60 bg-gradient-to-r from-slate-900/80 to-slate-900/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Operational Snapshot</h2>
            <p className="text-sm text-slate-400">
              Monitor lifecycle health and risk signals across all domains.
            </p>
          </div>
          <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Last refreshed: {formatTimeAgo(lastRefresh.toISOString())}
            </span>
            {stats?.open_risks > 0 && (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-200">
                {stats.open_risks} alerts
              </span>
            )}
            {stats?.total_events > 0 && (
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-200">
                {stats.total_events} total events
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Lifecycles">
          <p className="text-3xl font-semibold">{stats?.total_lifecycles || 0}</p>
          <p className="text-xs text-slate-400 mt-1">
            {stats?.active_lifecycles || 0} active
          </p>
        </Card>
        <Card title="Open Risks">
          <p className="text-3xl font-semibold">{stats?.open_risks || 0}</p>
          <p className="text-xs text-amber-300 mt-1">
            {stats?.open_risks > 0 ? `${stats.open_risks} require action` : "No open risks"}
          </p>
        </Card>
        <Card title="Documents Indexed">
          <p className="text-3xl font-semibold">{stats?.documents_indexed || 0}</p>
          <p className="text-xs text-slate-400 mt-1">
            {stats?.documents_last_24h > 0 
              ? `${stats.documents_last_24h} in the last 24h`
              : "No recent documents"}
          </p>
        </Card>
        <Card title="Total Events">
          <p className="text-3xl font-semibold">{stats?.total_events || 0}</p>
          <p className="text-xs text-slate-400 mt-1">
            {stats?.events_last_7d || 0} in last 7 days
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Average Cycle Time">
          <p className="text-3xl font-semibold">
            {stats?.average_cycle_time > 0 ? `${stats.average_cycle_time}` : 'N/A'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats?.average_cycle_time > 0 ? 'days' : 'Insufficient data'}
          </p>
        </Card>
        <Card title="Lifecycle Status">
          {statusChartData.length > 0 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="58%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={44}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No data available</p>
          )}
        </Card>
        <Card title="Top Lifecycles">
          {stats?.top_lifecycles && stats.top_lifecycles.length > 0 ? (
            <div className="space-y-2">
              {stats.top_lifecycles.map((lc, idx) => (
                <button
                  key={lc.lifecycle_id}
                  onClick={() => navigate(`/lifecycles/${lc.lifecycle_id}`)}
                  className="w-full text-left rounded-lg border border-slate-800/70 bg-slate-950/40 p-2 hover:border-indigo-500/50 hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{lc.lifecycle_id}</span>
                    <span className="text-xs text-slate-500">{lc.event_count} events</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${
                    lc.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                    lc.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-slate-700/50 text-slate-400'
                  }`}>
                    {lc.status || 'unknown'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No lifecycles available</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Event Type Distribution">
          {eventTypeChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventTypeChartData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={10}
                  />
                  <YAxis stroke="#64748b" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: 12
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No event data available</p>
          )}
        </Card>
        <Card title="Recent Activity">
          {formattedActivity.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formattedActivity.map((activity, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start justify-between rounded-lg border border-slate-800/70 bg-slate-950/40 p-2.5 hover:border-indigo-500/50 hover:bg-slate-800/40 transition cursor-pointer"
                  onClick={() => activity.lifecycle_id && navigate(`/lifecycles/${activity.lifecycle_id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{activity.display}</p>
                    {activity.lifecycle_id && (
                      <p className="text-xs text-slate-500 mt-0.5">{activity.lifecycle_id}</p>
                    )}
                  </div>
                  <span className="ml-2 flex-shrink-0 text-xs text-slate-500">
                    {activity.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent activity</p>
          )}
        </Card>
      </div>

      <Card title="Risk Drivers">
        {stats?.risk_drivers && stats.risk_drivers.length > 0 ? (
          <ul className="space-y-2 text-sm text-slate-300">
            {stats.risk_drivers.map((driver, idx) => (
              <li key={idx}>{driver}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No significant risk drivers identified</p>
        )}
      </Card>
    </div>
  );
}
