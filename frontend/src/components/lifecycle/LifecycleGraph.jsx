import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import LoadingSpinner from "../common/LoadingSpinner.jsx";
import Card from "../common/Card.jsx";
import { fetchLifecycleGraph } from "../../services/api.js";

export default function LifecycleGraph({ lifecycleId = "lifecycle_001" }) {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchLifecycleGraph(lifecycleId)
      .then((data) => {
        if (isMounted) {
          // Transform API data to graph format
          const nodes = (data.nodes || []).map((node) => ({
            id: node.id,
            label: node.label || node.id,
            type: node.type || "Unknown",
            filename: node.filename,
            event_type: node.event_type,
            lifecycle_id: node.lifecycle_id,
            document_id: node.document_id,
            document_type: node.document_type,
            ...(node.properties || {}),
          }));

          const links = (data.links || []).map((link) => ({
            source: link.source,
            target: link.target,
            type: link.type || "RELATED",
          }));

          setGraphData({ nodes, links });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load graph data");
          console.error("Graph fetch error:", err);
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

  useEffect(() => {
    if (!svgRef.current || loading || error) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerDiv = svgRef.current.parentElement;
    const width = containerDiv?.clientWidth || 800;
    const height = 500;
    svg.attr("width", width).attr("height", height);

    // Create container group first
    const container = svg
      .append("g")
      .attr("class", "graph-container");

    // Initial transform
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2);
    container.attr("transform", initialTransform);

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Color scheme - map Neo4j node types
    const nodeColors = {
      Lifecycle: "#3b82f6", // blue
      Document: "#f59e0b", // amber
      Event: "#10b981", // emerald
      PO: "#3b82f6", // blue
      ChangeOrder: "#f59e0b", // amber
      Invoice: "#10b981", // emerald
      Vendor: "#8b5cf6", // purple
      Entity: "#ef4444", // red
    };

    // Simulation
    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide().radius(40));

    // Links
    const link = container
      .append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke", "#475569")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrowhead)");

    // Arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    // Node groups
    const node = container
      .append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(
        d3
          .drag()
          .subject((d) => d)
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("click", function(event, d) {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .on("mouseover", function (event, d) {
        d3.select(this).select("circle").attr("r", 18);
        d3.select(this).select("text").style("font-weight", "bold");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).select("circle").attr("r", 15);
        d3.select(this).select("text").style("font-weight", "normal");
      });

    // Node circles
    node
      .append("circle")
      .attr("r", 15)
      .attr("fill", (d) => nodeColors[d.type] || "#64748b")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // Node labels - show better labels
    node
      .append("text")
      .text((d) => {
        // For documents, show filename if available, otherwise truncate ID
        if (d.type === "Document" && d.filename) {
          return d.filename.length > 20 ? d.filename.substring(0, 20) + "..." : d.filename;
        }
        // For events, show event type
        if (d.type === "Event" && d.event_type) {
          return d.event_type.length > 25 ? d.event_type.substring(0, 25) + "..." : d.event_type;
        }
        // For lifecycles, show lifecycle_id
        if (d.type === "Lifecycle" && d.lifecycle_id) {
          return d.lifecycle_id;
        }
        // Default: truncate label
        return d.label && d.label.length > 20 ? d.label.substring(0, 20) + "..." : (d.label || d.id);
      })
      .attr("dy", 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "11px")
      .style("pointer-events", "none");

    // Node amount badges
    node
      .filter((d) => d.amount)
      .append("text")
      .text((d) => d.amount)
      .attr("dy", -25)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "9px")
      .style("pointer-events", "none");

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      // Get current transform to account for zoom/pan
      const transform = d3.zoomTransform(svg.node());
      d.fx = (event.x - transform.x) / transform.k;
      d.fy = (event.y - transform.y) / transform.k;
      svg.style("cursor", "grabbing");
    }

    function dragged(event, d) {
      const transform = d3.zoomTransform(svg.node());
      d.fx = (event.x - transform.x) / transform.k;
      d.fy = (event.y - transform.y) / transform.k;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      svg.style("cursor", "grab");
    }

    // Click outside to deselect (but not on zoom or nodes)
    svg.on("click", function(event) {
      // Only deselect if clicking directly on the SVG background, not on nodes or links
      const target = event.target;
      if (target === svg.node() || (target.tagName === "svg" && !target.closest(".node"))) {
        // Check if we clicked on background, not on a node
        if (!d3.select(event.target).classed("node") && event.target.tagName !== "circle" && event.target.tagName !== "text") {
          setSelectedNode(null);
        }
      }
    });

    // Add reset zoom button functionality
    const resetZoom = () => {
      const resetTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(1);
      svg.transition()
        .duration(750)
        .call(zoom.transform, resetTransform);
    };

    // Store reset function for cleanup
    svg.node()._resetZoom = resetZoom;

    return () => {
      simulation.stop();
      if (svg.node()?._resetZoom) {
        delete svg.node()._resetZoom;
      }
    };
  }, [graphData, loading, error]);

  if (loading) {
    return (
      <Card title="Neo4j Knowledge Graph" className="md:col-span-2">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner label="Loading graph data..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Neo4j Knowledge Graph" className="md:col-span-2">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <p className="font-semibold">Error loading graph</p>
          <p className="mt-1 text-xs text-rose-300/80">{error}</p>
        </div>
      </Card>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <Card title="Neo4j Knowledge Graph" className="md:col-span-2">
        <div className="rounded-xl border border-dashed border-slate-700/80 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
          <p>No graph data available for this lifecycle.</p>
          <p className="mt-2 text-xs">Upload documents to build the knowledge graph.</p>
        </div>
      </Card>
    );
  }

  const handleResetZoom = () => {
    if (svgRef.current?._resetZoom) {
      svgRef.current._resetZoom();
    }
  };

  return (
    <Card title="Neo4j Knowledge Graph" className="md:col-span-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>Lifecycle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span>Document</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span>Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <span>Other</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetZoom}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition"
              title="Reset zoom"
            >
              Reset Zoom
            </button>
            <a
              href="http://localhost:7476"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition"
              title="Open Neo4j Browser (full features)"
            >
              Open Neo4j Browser
            </a>
            <div className="text-slate-500">
              Scroll to zoom • Drag to pan • Click nodes to inspect
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/40" style={{ height: '500px' }}>
          <svg ref={svgRef} className="w-full h-full" style={{ cursor: 'grab' }} />
          {selectedNode && (
            <div className="absolute top-4 right-4 z-20 w-80 rounded-lg border border-slate-700/80 bg-slate-900/95 p-4 backdrop-blur shadow-xl max-h-[400px] overflow-y-auto">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 break-words">
                    {selectedNode.label || selectedNode.id}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 capitalize">{selectedNode.type || 'Unknown'}</p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="ml-3 flex-shrink-0 text-slate-400 hover:text-slate-200 transition text-lg leading-none"
                  title="Close"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-xs">
                {selectedNode.document_id && (
                  <div>
                    <span className="text-slate-500 font-medium">Document ID:</span>{" "}
                    <span className="text-slate-200 font-mono">{selectedNode.document_id}</span>
                  </div>
                )}
                {selectedNode.filename && (
                  <div>
                    <span className="text-slate-500 font-medium">Filename:</span>{" "}
                    <span className="text-slate-200">{selectedNode.filename}</span>
                  </div>
                )}
                {selectedNode.document_type && (
                  <div>
                    <span className="text-slate-500 font-medium">Document Type:</span>{" "}
                    <span className="text-slate-200">{selectedNode.document_type}</span>
                  </div>
                )}
                {selectedNode.event_type && (
                  <div>
                    <span className="text-slate-500 font-medium">Event Type:</span>{" "}
                    <span className="text-slate-200">{selectedNode.event_type}</span>
                  </div>
                )}
                {selectedNode.lifecycle_id && (
                  <div>
                    <span className="text-slate-500 font-medium">Lifecycle ID:</span>{" "}
                    <span className="text-slate-200">{selectedNode.lifecycle_id}</span>
                  </div>
                )}
                {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                  <div className="pt-2 border-t border-slate-800/70 mt-2">
                    <p className="text-slate-500 font-medium mb-1.5">Properties:</p>
                    <div className="space-y-1">
                      {Object.entries(selectedNode.properties)
                        .filter(([key]) => !["id", "label", "type", "document_id", "filename", "document_type", "event_type", "lifecycle_id"].includes(key))
                        .slice(0, 8)
                        .map(([key, value]) => (
                          <div key={key} className="break-words">
                            <span className="text-slate-500 font-medium">{key}:</span>{" "}
                            <span className="text-slate-200">{String(value)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
