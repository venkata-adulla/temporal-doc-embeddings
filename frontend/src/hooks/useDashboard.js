import { useState, useEffect } from "react";
import { fetchDashboardStats } from "../services/api.js";

export default function useDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
        setError(err.message);
        // Set defaults on error
        setStats({
          active_lifecycles: 0,
          open_risks: 0,
          documents_indexed: 0,
          documents_last_24h: 0,
          risk_drivers: [],
          recent_activity: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}
