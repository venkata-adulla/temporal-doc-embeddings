import { useEffect, useState } from "react";

import { fetchPrediction } from "../services/api.js";

export default function usePredictions(lifecycleId) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    fetchPrediction(lifecycleId)
      .then((data) => {
        // Always set prediction, even if it's a default "no data" prediction
        if (data) {
          setPrediction(data);
        } else {
          // If API returns null/undefined, create a default prediction
          setPrediction({
            lifecycle_id: lifecycleId,
            risk_score: 0.2,
            risk_label: "low",
            drivers: [],
            explanation: "No prediction data available. Upload documents to generate risk predictions."
          });
        }
      })
      .catch((error) => {
        console.error("Failed to fetch prediction:", error);
        // Even on error, provide a default prediction so UI doesn't show empty state
        setPrediction({
          lifecycle_id: lifecycleId,
          risk_score: 0.2,
          risk_label: "low",
          drivers: [],
          explanation: `Error loading prediction: ${error.message || "Unknown error"}. Upload documents to generate risk predictions.`
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (lifecycleId) {
      refresh();
    }
  }, [lifecycleId]);

  return { prediction, loading, refresh };
}
