import { useMemo, useState, useEffect } from "react";
import Card from "../common/Card.jsx";
import { fetchDeltaAnalysis } from "../../services/api.js";

export default function DeltaVisualization({ events, lifecycleStatus, lifecycleId }) {
  const [deltaAnalysis, setDeltaAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  // Load delta analysis when lifecycleId changes
  useEffect(() => {
    if (lifecycleId && events && events.length > 0) {
      setLoadingAnalysis(true);
      fetchDeltaAnalysis(lifecycleId)
        .then((data) => {
          setDeltaAnalysis(data);
        })
        .catch((error) => {
          console.error("Failed to load delta analysis:", error);
          setDeltaAnalysis(null);
        })
        .finally(() => {
          setLoadingAnalysis(false);
        });
    } else {
      setDeltaAnalysis(null);
    }
  }, [lifecycleId, events]);

  const deltaInfo = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        totalEvents: 0,
        timeSpan: null,
        changeEvents: 0,
        eventTypes: [],
        recentActivity: null
      };
    }

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    
    // Calculate time span
    const timeSpan = Math.round(
      (new Date(lastEvent.timestamp) - new Date(firstEvent.timestamp)) / (1000 * 60 * 60 * 24)
    );

    // Count change events
    const changeEvents = sortedEvents.filter(e => 
      e.event_type.toUpperCase().includes("CHANGE") ||
      e.event_type.toUpperCase().includes("MODIFY") ||
      e.event_type.toUpperCase().includes("UPDATE")
    ).length;

    // Get unique event types
    const eventTypes = [...new Set(sortedEvents.map(e => e.event_type))];

    // Get most recent activity
    const recentEvent = lastEvent;
    const recentActivity = recentEvent ? {
      type: recentEvent.event_type,
      time: new Date(recentEvent.timestamp).toLocaleString(),
      daysAgo: Math.round((new Date() - new Date(recentEvent.timestamp)) / (1000 * 60 * 60 * 24))
    } : null;

    return {
      totalEvents: sortedEvents.length,
      timeSpan,
      changeEvents,
      eventTypes,
      recentActivity
    };
  }, [events]);

  return (
    <Card title="Temporal Delta Summary">
      <div className="space-y-4 text-sm text-slate-300">
        {deltaInfo.totalEvents === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 p-4 text-center text-slate-500">
            <p className="text-sm">No events to analyze</p>
            <p className="text-xs mt-1">Upload documents to see temporal changes</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 space-y-3">
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Status</p>
                <p className="text-sm text-slate-200 capitalize">{lifecycleStatus || "active"}</p>
              </div>
              
              <div className="pt-2 border-t border-slate-800/70">
                <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Timeline Overview</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Events:</span>
                    <span className="text-slate-200 font-medium">{deltaInfo.totalEvents}</span>
                  </div>
                  {deltaInfo.timeSpan !== null && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time Span:</span>
                      <span className="text-slate-200 font-medium">
                        {deltaInfo.timeSpan === 0 ? "< 1 day" : `${deltaInfo.timeSpan} day${deltaInfo.timeSpan !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Change Events:</span>
                    <span className="text-slate-200 font-medium">{deltaInfo.changeEvents}</span>
                  </div>
                </div>
              </div>

              {deltaInfo.recentActivity && (
                <div className="pt-2 border-t border-slate-800/70">
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Most Recent</p>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-200">{deltaInfo.recentActivity.type}</p>
                    <p className="text-slate-400">
                      {deltaInfo.recentActivity.daysAgo === 0 
                        ? "Today" 
                        : deltaInfo.recentActivity.daysAgo === 1
                        ? "Yesterday"
                        : `${deltaInfo.recentActivity.daysAgo} days ago`}
                    </p>
                  </div>
                </div>
              )}

              {deltaInfo.eventTypes.length > 0 && (
                <div className="pt-2 border-t border-slate-800/70">
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Event Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {deltaInfo.eventTypes.slice(0, 5).map((type, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-200"
                      >
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {deltaInfo.eventTypes.length > 5 && (
                      <span className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[10px] text-slate-400">
                        +{deltaInfo.eventTypes.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Document Revisions Section */}
              {deltaAnalysis && deltaAnalysis.revisions && deltaAnalysis.revisions.length > 0 && (
                <div className="pt-2 border-t border-slate-800/70">
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Document Revisions</p>
                  <div className="space-y-2">
                    {deltaAnalysis.revisions.map((revision, idx) => (
                      <div key={idx} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-amber-200">{revision.document_type}</span>
                          <span className="text-[10px] text-amber-300/80">
                            {revision.versions} version{revision.versions !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {revision.revision_count > 0 && (
                          <div className="text-[10px] text-slate-400 mt-1 space-y-1">
                            <div>
                              <span className="text-amber-300">{revision.revision_count} revision{revision.revision_count !== 1 ? 's' : ''}</span>
                              {revision.first_upload && revision.last_upload && (
                                <span className="ml-2 text-slate-500">
                                  ({revision.first_upload} - {revision.last_upload})
                                </span>
                              )}
                            </div>
                            {revision.latest_version.summary && (
                              <div className="text-slate-500">
                                Latest: {revision.latest_version.summary.split('Document ')[1]?.split(' uploaded')[0] || 'Latest version'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Changes Between Versions */}
              {deltaAnalysis && deltaAnalysis.changes && deltaAnalysis.changes.length > 0 && (
                <div className="pt-2 border-t border-slate-800/70">
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Changes Detected</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {deltaAnalysis.changes.map((change, idx) => (
                      <div key={idx} className="text-[10px] text-slate-300 bg-slate-900/40 rounded p-2">
                        <div className="flex items-start gap-1">
                          <span className="text-emerald-400">→</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-200 font-medium">{change.document_type}</span>
                            {change.from_version && change.to_version && (
                              <div className="text-slate-400 mt-0.5">
                                <span className="line-through text-slate-500">{change.from_version}</span>
                                <span className="mx-1">→</span>
                                <span className="text-emerald-300">{change.to_version}</span>
                              </div>
                            )}
                            {change.detailed_changes && change.detailed_changes.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {change.detailed_changes.map((detail, detailIdx) => (
                                  <div key={detailIdx} className="text-emerald-300/80 pl-2">
                                    • {detail}
                                  </div>
                                ))}
                              </div>
                            )}
                            {change.description && (
                              <div className="text-slate-500 mt-1 italic">
                                {change.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingAnalysis && (
                <div className="pt-2 border-t border-slate-800/70">
                  <p className="text-xs text-slate-500">Analyzing document revisions...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
