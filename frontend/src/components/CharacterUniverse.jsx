// DevHacks 2026 - Challenge 2: AI-Powered Writer
// File: frontend/src/components/CharacterUniverse.jsx
// 2D SVG force-graph with pan/zoom + detail panel

import { useRef, useState, useEffect, useCallback, useMemo } from "react";

const C = {
  cyan: "#0ea5a5",
  red: "#dc2626",
  amber: "#b45309",
  bg: "#f8fafc",
  panel: "#ffffff",
  card: "#ffffff",
  border: "#d5dde8",
  borderDim: "#c7d2e1",
  text: "#0f172a",
  textSub: "#475569",
  textMuted: "#64748b",
  link: "#94a3b8",
  panelShadow: "rgba(15, 23, 42, 0.18)",
};

function initials(name = "") {
  return name.split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

// ─── Mini force simulation (no external library) ───────────────
function runForce(nodes, edges, W, H, iters = 180) {
  const pos = {};
  nodes.forEach((n, i) => {
    const a = (i / nodes.length) * 2 * Math.PI;
    const r = Math.min(W, H) * 0.3;
    pos[n.id] = { x: W / 2 + r * Math.cos(a), y: H / 2 + r * Math.sin(a) };
  });

  const edgeIndex = edges.map(e => ({
    s: typeof e.source === "object" ? e.source.id : e.source,
    t: typeof e.target === "object" ? e.target.id : e.target,
    v: e.value || 1,
  }));

  for (let iter = 0; iter < iters; iter++) {
    const alpha = 1 - iter / iters;
    const f = {};
    nodes.forEach(n => { f[n.id] = { x: 0, y: 0 }; });

    // Repulsion between every pair
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = pos[b.id].x - pos[a.id].x;
        const dy = pos[b.id].y - pos[a.id].y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const fr = (5500 / (d * d)) * alpha;
        f[a.id].x -= (dx / d) * fr;
        f[a.id].y -= (dy / d) * fr;
        f[b.id].x += (dx / d) * fr;
        f[b.id].y += (dy / d) * fr;
      }
    }

    // Attraction along edges
    edgeIndex.forEach(({ s, t, v }) => {
      if (!pos[s] || !pos[t]) return;
      const dx = pos[t].x - pos[s].x;
      const dy = pos[t].y - pos[s].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const fa = ((d - (150 + v * 10)) * 0.045) * alpha;
      f[s].x += (dx / d) * fa;
      f[s].y += (dy / d) * fa;
      f[t].x -= (dx / d) * fa;
      f[t].y -= (dy / d) * fa;
    });

    // Weak center gravity
    nodes.forEach(n => {
      f[n.id].x += (W / 2 - pos[n.id].x) * 0.010 * alpha;
      f[n.id].y += (H / 2 - pos[n.id].y) * 0.010 * alpha;
    });

    nodes.forEach(n => {
      pos[n.id].x += f[n.id].x * 0.14;
      pos[n.id].y += f[n.id].y * 0.14;
    });
  }
  return pos;
}

// ─── Component ─────────────────────────────────────────────────
export default function CharacterUniverse({ nodes = [], edges = [], issues = [] }) {
  const containerRef = useRef();
  const [dim, setDim] = useState({ w: 900, h: 600 });
  const [pos, setPos] = useState({});
  const [xfm, setXfm] = useState({ x: 0, y: 0, s: 1 });
  const [drag, setDrag] = useState(null);
  const [selected, setSelected] = useState(null);

  // Resize observer
  useEffect(() => {
    const ro = new ResizeObserver(([e]) =>
      setDim({ w: e.contentRect.width, h: e.contentRect.height })
    );
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Recompute force layout when data or size changes
  useEffect(() => {
    if (!nodes.length) return;
    setPos(runForce(nodes, edges, dim.w, dim.h));
  }, [nodes, edges, dim.w, dim.h]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll → zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = e => {
      e.preventDefault();
      setXfm(t => ({ ...t, s: clamp(t.s * (e.deltaY > 0 ? 0.9 : 1.1), 0.2, 4) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Mouse interactions
  const onNodeDown = useCallback((e, id) => {
    e.stopPropagation();
    setDrag({
      type: "node", id, sx: e.clientX, sy: e.clientY,
      ox: pos[id]?.x || 0, oy: pos[id]?.y || 0
    });
  }, [pos]);

  const onSvgDown = useCallback(e => {
    setDrag({ type: "pan", sx: e.clientX, sy: e.clientY, ox: xfm.x, oy: xfm.y });
  }, [xfm]);

  const onMove = useCallback(e => {
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / xfm.s;
    const dy = (e.clientY - drag.sy) / xfm.s;
    if (drag.type === "pan") {
      setXfm(t => ({ ...t, x: drag.ox + dx * xfm.s, y: drag.oy + dy * xfm.s }));
    } else {
      setPos(p => ({ ...p, [drag.id]: { x: drag.ox + dx, y: drag.oy + dy } }));
    }
  }, [drag, xfm.s]);

  const onUp = useCallback(() => setDrag(null), []);

  const onNodeClick = useCallback((e, node) => {
    e.stopPropagation();
    setSelected(s => s?.id === node.id ? null : node);
  }, []);

  // Lookup helpers
  const nodeMap = useMemo(() => {
    const m = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const selEdges = useMemo(() => {
    if (!selected) return [];
    return edges.filter(e => {
      const s = typeof e.source === "object" ? e.source.id : e.source;
      const t = typeof e.target === "object" ? e.target.id : e.target;
      return s === selected.id || t === selected.id;
    });
  }, [selected, edges]);

  const selIssues = useMemo(() =>
    issues?.filter(i => i.character === selected?.name) || [],
    [issues, selected]
  );

  const { w, h } = dim;
  const GRID = 36;

  return (
    <div
      ref={containerRef}
      className="universe-container"
      style={{ cursor: drag?.type === "pan" ? "grabbing" : "grab", background: C.bg }}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    >
      {/* ── Header ── */}
      <div className="universe-header">
        <div className="universe-title">Character Universe</div>
        <div className="universe-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: C.cyan }} />
            Clean Character
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: C.red }} />
            Has Issue
          </div>
          <div className="legend-item">
            <div className="legend-dot"
              style={{ background: C.amber, borderRadius: 2, transform: "rotate(45deg)" }} />
            Strong Relationship
          </div>
        </div>
      </div>

      {/* ── SVG Canvas ── */}
      <svg
        width={w} height={h}
        style={{ display: "block", userSelect: "none" }}
        onMouseDown={onSvgDown}
        onClick={() => setSelected(null)}
      >
        <defs>
          <pattern id="cugrid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <circle cx={GRID / 2} cy={GRID / 2} r="1.2" fill={C.borderDim} />
          </pattern>
          <filter id="glow-c" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-r" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Dot grid background */}
        <rect width={w} height={h} fill="url(#cugrid)" />

        {/* Transformed graph layer */}
        <g transform={`translate(${xfm.x},${xfm.y}) scale(${xfm.s})`}>

          {/* Edges */}
          {edges.map((edge, i) => {
            const sid = typeof edge.source === "object" ? edge.source.id : edge.source;
            const tid = typeof edge.target === "object" ? edge.target.id : edge.target;
            const sp = pos[sid], tp = pos[tid];
            if (!sp || !tp) return null;
            const strong = (edge.value || 1) > 2;
            const color = strong ? C.amber : C.link;
            const mx = (sp.x + tp.x) / 2;
            const my = (sp.y + tp.y) / 2;
            return (
              <g key={`e-${i}`}>
                <line
                  x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y}
                  stroke={color}
                  strokeWidth={strong ? 2.5 : 1.2}
                  strokeDasharray={strong ? "none" : "6,5"}
                  strokeOpacity={0.75}
                />
                {edge.label && (
                  <text x={mx} y={my - 7} textAnchor="middle"
                    fontSize="9" fill={color} opacity="0.85"
                    style={{ pointerEvents: "none" }}>
                    {truncate(edge.label, 26)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const p = pos[node.id];
            if (!p) return null;
            const isSel = selected?.id === node.id;
            const color = node.hasIssue ? C.red : C.cyan;
            const r = 26 + Math.min(node.appearances || 1, 8) * 1.8;

            return (
              <g key={`n-${node.id}`}
                transform={`translate(${p.x},${p.y})`}
                style={{ cursor: "pointer" }}
                onMouseDown={e => onNodeDown(e, node.id)}
                onClick={e => onNodeClick(e, node)}
              >
                {/* Selection halo */}
                {isSel && (
                  <circle r={r + 10} fill="none"
                    stroke={color} strokeWidth="1.5"
                    strokeDasharray="4,3" opacity="0.55" />
                )}

                {/* Issue ambient glow */}
                {node.hasIssue && (
                  <circle r={r + 5} fill={C.red} opacity="0.10"
                    filter="url(#glow-r)" />
                )}

                {/* Main circle */}
                <circle r={r}
                  fill={C.card}
                  stroke={color}
                  strokeWidth={isSel ? 2.5 : 1.8}
                  filter={isSel ? `url(#glow-${node.hasIssue ? "r" : "c"})` : undefined}
                />

                {/* Initials */}
                <text textAnchor="middle" dominantBaseline="central"
                  fontSize={r > 38 ? "15" : "13"}
                  fontWeight="800" fill={color}
                  fontFamily="'Courier New', monospace"
                  style={{ pointerEvents: "none" }}>
                  {initials(node.name)}
                </text>

                {/* Name */}
                <text y={r + 15} textAnchor="middle"
                  fontSize="11" fontWeight="600" fill={C.text}
                  style={{ pointerEvents: "none" }}>
                  {truncate(node.name, 18)}
                </text>

                {/* Issue badge */}
                {node.hasIssue && (
                  <text y={r + 27} textAnchor="middle"
                    fontSize="8.5" fontWeight="700" fill={C.red}
                    letterSpacing="0.08em"
                    style={{ pointerEvents: "none" }}>
                    ⚠ FLAGGED
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── Zoom Controls ── */}
      <div style={{
        position: "absolute", bottom: 52, left: 20,
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        {[
          ["＋", () => setXfm(t => ({ ...t, s: clamp(t.s * 1.25, 0.2, 4) }))],
          ["－", () => setXfm(t => ({ ...t, s: clamp(t.s * 0.8, 0.2, 4) }))],
          ["⊙", () => setXfm({ x: 0, y: 0, s: 1 })],
        ].map(([label, fn]) => (
          <button key={label} onClick={fn} style={{
            width: 32, height: 32, borderRadius: 7,
            background: C.card, border: `1px solid ${C.border}`,
            color: C.cyan, fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Instructions ── */}
      <div className="universe-instructions">
        Drag canvas to pan · Scroll to zoom<br />
        Drag a node to reposition · Click to inspect
      </div>

      {/* ── Detail Panel ── */}
      {selected && (
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: 300,
          background: C.panel,
          borderLeft: `1px solid ${C.border}`,
          overflowY: "auto",
          padding: "16px 18px 24px",
          display: "flex", flexDirection: "column", gap: 14,
          boxShadow: `-10px 0 30px ${C.panelShadow}`,
        }}>
          {/* Badge + close */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 44 }}>
            <span style={{
              background: selected.hasIssue ? "rgba(220, 38, 38, 0.10)" : "rgba(14, 165, 165, 0.10)",
              border: `1px solid ${selected.hasIssue ? C.red : C.cyan}`,
              color: selected.hasIssue ? C.red : C.cyan,
              fontSize: 9, fontWeight: 800, padding: "3px 9px",
              borderRadius: 4, letterSpacing: "0.1em",
            }}>
              {selected.hasIssue ? "⚠ FLAGGED" : "● CHARACTER"}
            </span>
            <button onClick={() => setSelected(null)} style={{
              background: "none", border: "none",
              color: C.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1,
            }}>✕</button>
          </div>

          {/* Name block */}
          <div style={{ borderBottom: `1px solid ${C.borderDim}`, paddingBottom: 14 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
              {selected.name}
            </div>
            <div style={{
              fontSize: 12, marginTop: 5,
              color: selected.hasIssue ? C.red : C.cyan,
            }}>
              {selected.appearances} appearance{selected.appearances !== 1 ? "s" : ""}
              {selected.emotions?.length
                ? ` · ${selected.emotions.slice(0, 2).join(", ")}`
                : ""}
            </div>
          </div>

          {/* Status + Paragraphs cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: C.card, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.borderDim}` }}>
              <div style={{ fontSize: 8.5, color: C.textMuted, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>
                STATUS
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: selected.hasIssue ? C.red : C.cyan,
                  display: "inline-block", flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, color: C.text }}>
                  {selected.hasIssue ? "Flagged" : "Clean"}
                </span>
              </div>
            </div>
            <div style={{ background: C.card, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.borderDim}` }}>
              <div style={{ fontSize: 8.5, color: C.textMuted, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>
                PARAGRAPHS
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                {selected.paragraphs?.map(p => `¶${p + 1}`).join(" ") || "—"}
              </div>
            </div>
          </div>

          {/* Locations */}
          {selected.locations?.length > 0 && (
            <div style={{ background: C.card, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.borderDim}` }}>
              <div style={{ fontSize: 8.5, color: C.textMuted, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>
                LOCATIONS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {selected.locations.map((loc, i) => (
                  <span key={i} style={{
                    background: "#ecfeff", color: C.cyan,
                    fontSize: 11, padding: "2px 9px", borderRadius: 4,
                    border: `1px solid ${C.border}`,
                  }}>{loc}</span>
                ))}
              </div>
            </div>
          )}

          {/* Relationships */}
          {selEdges.length > 0 && (
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
              }}>
                <div style={{ fontSize: 8.5, color: C.textMuted, fontWeight: 700, letterSpacing: "0.1em" }}>
                  RELATIONSHIPS
                </div>
                <span style={{ fontSize: 10, color: C.textSub }}>
                  {selEdges.length} link{selEdges.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selEdges.map((edge, i) => {
                  const sid = typeof edge.source === "object" ? edge.source.id : edge.source;
                  const tid = typeof edge.target === "object" ? edge.target.id : edge.target;
                  const otherId = sid === selected.id ? tid : sid;
                  const other = nodeMap[otherId];
                  if (!other) return null;
                  const strong = (edge.value || 1) > 2;
                  const oColor = other.hasIssue ? C.red : C.cyan;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: C.card, borderRadius: 8, padding: "8px 12px",
                      border: `1px solid ${C.borderDim}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: C.bg, border: `1.5px solid ${oColor}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800, color: oColor,
                          fontFamily: "monospace", flexShrink: 0,
                        }}>
                          {initials(other.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                            {truncate(other.name, 14)}
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted }}>
                            {edge.value} shared para{edge.value !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9, padding: "3px 8px", borderRadius: 4,
                        fontWeight: 700, whiteSpace: "nowrap",
                        background: strong ? "rgba(180, 83, 9, 0.10)" : "rgba(14, 165, 165, 0.10)",
                        color: strong ? C.amber : C.cyan,
                        border: `1px solid ${strong ? C.amber : C.cyan}`,
                      }}>
                        {strong ? "Strong" : "Linked"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Issues */}
          {selIssues.length > 0 && (
            <div>
              <div style={{ fontSize: 8.5, color: C.textMuted, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>
                ISSUES DETECTED
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {selIssues.map((issue, i) => (
                  <div key={i} style={{
                    background: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid rgba(220, 38, 38, 0.25)",
                    borderRadius: 8, padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: 9, color: C.red, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 5 }}>
                      ⚠ {(issue.type || "issue").replace(/_/g, " ").toUpperCase()}
                    </div>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.55 }}>
                      {issue.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No data placeholder */}
          {selEdges.length === 0 && selIssues.length === 0 && (
            <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: "24px 0" }}>
              No connections or issues found<br />for this character.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
