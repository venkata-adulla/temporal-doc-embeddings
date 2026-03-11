import Card from "../common/Card.jsx";

export default function ExplanationPanel({ prediction }) {
  return (
    <Card title="Explanation">
      <p className="text-sm text-slate-300">{prediction.explanation}</p>
      <div className="mt-4">
        <p className="text-xs uppercase text-slate-500">Key Drivers</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          {prediction.drivers.map((driver) => (
            <li key={driver} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              {driver}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
