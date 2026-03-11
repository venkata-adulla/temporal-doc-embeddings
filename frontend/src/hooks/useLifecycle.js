import { useEffect, useState } from "react";

import { fetchLifecycle } from "../services/api.js";

export default function useLifecycle(lifecycleId) {
  const [lifecycle, setLifecycle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchLifecycle(lifecycleId)
      .then((data) => {
        if (isMounted) {
          setLifecycle(data);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [lifecycleId]);

  return { lifecycle, loading };
}
