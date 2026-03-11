export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-lg bg-gradient-to-r from-indigo-500 via-indigo-500 to-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-400 hover:to-sky-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
