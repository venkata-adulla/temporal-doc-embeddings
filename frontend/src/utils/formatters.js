export function formatPercent(value) {
  if (value === null || value === undefined) return "--";
  return `${Math.round(value * 100)}%`;
}
