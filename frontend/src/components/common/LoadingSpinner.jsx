export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-slate-800/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      {label}
    </div>
  );
}
