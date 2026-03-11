export default function Card({ title, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.8)] backdrop-blur ${className}`}
    >
      {title ? (
        <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}
