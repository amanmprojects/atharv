// DevHacks 2026 - Challenge 2: AI-Powered Writer
// File: frontend/src/components/PacingWave.jsx
// Animated SVG pacing curve — shows narrative tension as a wave
 
import { useEffect, useRef } from "react";
 
const COLORS = {
  action : "#ef4444",
  emotion: "#22d3ee",
  overall: "#f59e0b",
};
 
export default function PacingWave({ pacing, suggestions }) {
  const svgRef = useRef();
 
  useEffect(() => {
    if (!pacing?.length || !svgRef.current) return;
    drawWave(svgRef.current, pacing);
  }, [pacing]);
 
  return (
    <div className="pacing-container">
      <div className="pacing-header">
        Narrative <span>Pacing</span> Curve
      </div>
      <div className="pacing-chart-wrap">
        <svg
          ref={svgRef}
          style={{ width: "100%", height: 320 }}
          viewBox="0 0 1000 320"
          preserveAspectRatio="none"
        />
 
        {/* Legend */}
        <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
          {[
            { label: "Overall Pacing", color: COLORS.overall },
            { label: "Action Density", color: COLORS.action },
            { label: "Emotion Intensity", color: COLORS.emotion },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#64748b" }}>
              <div style={{ width: 24, height: 2, background: color, borderRadius: 2 }} />
              {label}
            </div>
          ))}
        </div>
 
        {/* Pacing table */}
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "var(--font-mono)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e2d3d" }}>
                {["Para", "Pacing", "Overall", "Action", "Emotion"].map(h => (
                  <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: "#64748b", fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pacing.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #131920" }}>
                  <td style={{ padding: "6px 12px", color: "#64748b" }}>{row.paragraph}</td>
                  <td style={{ padding: "6px 12px", color: row.pacing_score >= 7 ? "#ef4444" : row.pacing_score >= 4 ? "#f59e0b" : "#22d3ee" }}>{row.label}</td>
                  <td style={{ padding: "6px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: "#1e2d3d", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${row.pacing_score * 10}%`, height: "100%", background: "#f59e0b", borderRadius: 2 }} />
                      </div>
                      {row.pacing_score}
                    </div>
                  </td>
                  <td style={{ padding: "6px 12px", color: "#ef4444" }}>{row.action_score}</td>
                  <td style={{ padding: "6px 12px", color: "#22d3ee" }}>{row.emotion_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
 
        {/* Suggestions */}
        {suggestions?.length > 0 && (
          <div className="pacing-suggestions">
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", marginBottom: 4 }}>
              Pacing Suggestions
            </div>
            {suggestions.map((s, i) => (
              <div key={i} className="pacing-suggestion">{s.message}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
function drawWave(svg, pacing) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
 
  const W = 1000, H = 320;
  const PAD = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const n = pacing.length;
  const maxScore = 10;
 
  const xScale = (i) => PAD.left + (i / Math.max(n - 1, 1)) * chartW;
  const yScale = (v) => PAD.top + chartH - (v / maxScore) * chartH;
 
  const NS = "http://www.w3.org/2000/svg";
 
  const defs = document.createElementNS(NS, "defs");
 
  const makeGradient = (id, color) => {
    const g = document.createElementNS(NS, "linearGradient");
    g.setAttribute("id", id);
    g.setAttribute("x1", "0"); g.setAttribute("y1", "0");
    g.setAttribute("x2", "0"); g.setAttribute("y2", "1");
    const s1 = document.createElementNS(NS, "stop");
    s1.setAttribute("offset", "0%");
    s1.setAttribute("stop-color", color);
    s1.setAttribute("stop-opacity", "0.25");
    const s2 = document.createElementNS(NS, "stop");
    s2.setAttribute("offset", "100%");
    s2.setAttribute("stop-color", color);
    s2.setAttribute("stop-opacity", "0");
    g.appendChild(s1); g.appendChild(s2);
    return g;
  };
 
  defs.appendChild(makeGradient("grad-overall", "#f59e0b"));
  defs.appendChild(makeGradient("grad-action",  "#ef4444"));
  defs.appendChild(makeGradient("grad-emotion", "#22d3ee"));
  svg.appendChild(defs);
 
  for (let v = 0; v <= 10; v += 2) {
    const y = yScale(v);
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", PAD.left); line.setAttribute("y1", y);
    line.setAttribute("x2", W - PAD.right); line.setAttribute("y2", y);
    line.setAttribute("stroke", "#1e2d3d");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
 
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", PAD.left - 8);
    label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("fill", "#334155");
    label.setAttribute("font-size", "10");
    label.textContent = v;
    svg.appendChild(label);
  }
 
  pacing.forEach((row, i) => {
    const x = xScale(i);
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", x); line.setAttribute("y1", PAD.top);
    line.setAttribute("x2", x); line.setAttribute("y2", H - PAD.bottom);
    line.setAttribute("stroke", "#131920");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
 
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", H - PAD.bottom + 16);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "#334155");
    label.setAttribute("font-size", "10");
    label.textContent = `P${row.paragraph}`;
    svg.appendChild(label);
  });
 
  const buildPath = (values) => {
    const pts = values.map((v, i) => [xScale(i), yScale(v)]);
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const cpx = (x0 + x1) / 2;
      d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };
 
  const buildAreaPath = (values) => {
    const linePath = buildPath(values);
    const lastX = xScale(values.length - 1);
    const lastY = H - PAD.bottom;
    const firstX = xScale(0);
    return `${linePath} L ${lastX} ${lastY} L ${firstX} ${lastY} Z`;
  };
 
  const datasets = [
    { key: "emotion_score", color: "#22d3ee", gradId: "grad-emotion", width: 1.5 },
    { key: "action_score",  color: "#ef4444", gradId: "grad-action",  width: 1.5 },
    { key: "pacing_score",  color: "#f59e0b", gradId: "grad-overall", width: 2.5 },
  ];
 
  datasets.forEach(({ key, color, gradId, width }) => {
    const values = pacing.map(p => p[key]);
    if (values.length < 2) return;

    const area = document.createElementNS(NS, "path");
    area.setAttribute("d", buildAreaPath(values));
    area.setAttribute("fill", `url(#${gradId})`);
    svg.appendChild(area);
 
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", buildPath(values));
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", width);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
 
    const length = 2000;
    path.setAttribute("stroke-dasharray", length);
    path.setAttribute("stroke-dashoffset", length);
    path.style.transition = `stroke-dashoffset 1.2s ease`;
    svg.appendChild(path);
    requestAnimationFrame(() => {
      path.setAttribute("stroke-dashoffset", "0");
    });
  });
 
  pacing.forEach((row, i) => {
    const x = xScale(i);
    const y = yScale(row.pacing_score);
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", row.pacing_score >= 7 ? "#ef4444" : row.pacing_score >= 4 ? "#f59e0b" : "#22d3ee");
    circle.setAttribute("stroke", "#080b12");
    circle.setAttribute("stroke-width", "2");
    svg.appendChild(circle);
  });
}
