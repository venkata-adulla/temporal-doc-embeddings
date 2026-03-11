import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { fetchHealthStatus } from "../../services/api.js";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/documents", label: "Documents" },
  { path: "/lifecycles", label: "Lifecycles" },
  { path: "/predictions", label: "Predictions" }
];

function getStatusDisplay(status) {
  if (status === "ok") {
    return { text: "Online", className: "text-emerald-300" };
  } else if (status && status.startsWith("error")) {
    return { text: "Offline", className: "text-rose-300" };
  } else {
    return { text: "Degraded", className: "text-amber-300" };
  }
}

export default function Sidebar() {
  const [health, setHealth] = useState({
    neo4j: "unknown",
    postgres: "unknown",
    qdrant: "unknown"
  });

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const data = await fetchHealthStatus();
        setHealth({
          neo4j: data.neo4j || "unknown",
          postgres: data.postgres || "unknown",
          qdrant: data.qdrant || "unknown"
        });
      } catch (error) {
        console.error("Failed to load health status:", error);
      }
    };
    
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const neo4jStatus = getStatusDisplay(health.neo4j);
  const postgresStatus = getStatusDisplay(health.postgres);
  const qdrantStatus = getStatusDisplay(health.qdrant);

  return (
    <aside className="hidden w-64 border-r border-slate-800/70 bg-slate-950/40 p-6 md:block">
      <div className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
        <p className="text-xs uppercase text-slate-500">System Health</p>
        <div className="mt-3 space-y-2 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span>Neo4j</span>
            <span className={neo4jStatus.className}>{neo4jStatus.text}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Postgres</span>
            <span className={postgresStatus.className}>{postgresStatus.text}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Qdrant</span>
            <span className={qdrantStatus.className}>{qdrantStatus.text}</span>
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center justify-between rounded px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-slate-800/80 text-white"
                  : "text-slate-300 hover:bg-slate-800/50"
              }`
            }
          >
            <span>{item.label}</span>
            <span className="text-xs text-slate-500 group-hover:text-slate-300">
              →
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
