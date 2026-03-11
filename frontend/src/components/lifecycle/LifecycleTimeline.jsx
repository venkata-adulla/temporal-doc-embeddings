import { useMemo, useState } from "react";

import Card from "../common/Card.jsx";

export default function LifecycleTimeline({ events }) {
  const [selectedId, setSelectedId] = useState(events[0]?.event_id);
  const selected = useMemo(
    () => events.find((event) => event.event_id === selectedId),
    [events, selectedId]
  );

  return (
    <Card title="Lifecycle Timeline">
      <div className="grid gap-4 md:grid-cols-[1.2fr,1fr] lg:grid-cols-[1.5fr,1fr]">
        <div className="min-w-0 overflow-hidden">
          <ul className="space-y-3 text-sm text-slate-300">
            {events.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 p-4 text-center text-slate-500">
                No events recorded
              </li>
            ) : (
              events.map((event) => {
                const isActive = event.event_id === selectedId;
                return (
                  <li
                    key={event.event_id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                      isActive
                        ? "border-indigo-500/40 bg-indigo-500/10"
                        : "border-slate-800/60 hover:border-slate-600/60 hover:bg-slate-800/30"
                    }`}
                    onClick={() => setSelectedId(event.event_id)}
                  >
                    <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      isActive ? "bg-indigo-400" : "bg-slate-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 truncate">{event.event_type}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{event.summary}</p>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        <div className="min-w-0 rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase text-slate-500 mb-3 font-semibold">EVENT DETAIL</p>
          {selected ? (
            <div className="space-y-3">
              <div className="pb-2 border-b border-slate-800/70">
                <p className="text-base font-semibold text-slate-100 break-words">
                  {selected.event_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 break-words leading-relaxed">{selected.summary}</p>
              </div>
              <div className="pt-2 space-y-2.5">
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-slate-400 uppercase tracking-wide">TIMESTAMP</span>
                  <span className="text-slate-300">{new Date(selected.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-slate-400 uppercase tracking-wide">EVENT ID</span>
                  <span className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 break-all text-slate-300 font-mono text-[10px]">
                    {selected.event_id}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-slate-400 text-center py-12">
              <p className="text-sm">Select an event to inspect.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
