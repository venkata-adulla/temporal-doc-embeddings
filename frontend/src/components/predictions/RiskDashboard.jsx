import RiskCard from "./RiskCard.jsx";
import ExplanationPanel from "./ExplanationPanel.jsx";

export default function RiskDashboard({ prediction }) {
  if (!prediction) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 p-6 text-sm text-slate-400">
        Run a prediction to see risk.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <RiskCard prediction={prediction} />
      <ExplanationPanel prediction={prediction} />
    </div>
  );
}
