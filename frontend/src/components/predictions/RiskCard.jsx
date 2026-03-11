import Card from "../common/Card.jsx";

export default function RiskCard({ prediction }) {
  const score = Math.round(prediction.risk_score * 100);
  return (
    <Card title="Risk Score">
      <div className="flex items-end justify-between">
        <div className="text-4xl font-semibold text-slate-100">{score}%</div>
        <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
          {prediction.risk_label}
        </span>
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Drivers: {prediction.drivers.join(", ")}
      </div>
    </Card>
  );
}
