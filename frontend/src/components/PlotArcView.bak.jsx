// PlotArcView.jsx - Visualizes narrative arc phases as a mountain curve
 
import { useEffect, useRef } from "react";
 
const PHASE_ORDER = ["Setup","Rising Action","Climax","Falling Action","Resolution"];
 
export default function PlotArcView({ arcCurve, arcMap, phaseCounts, phaseColors, issues }) {
  const svgRef = useRef();
 
  useEffect(() => {
    if (!arcCurve?.length || !svgRef.current) return;
    drawArc(svgRef.current, arcCurve, phaseColors);
  }, [arcCurve, phaseColors]);
 
  return (
    <div className="pacing-container">
      <div className="pacing-header">
        Plot <span style={{ color: "#a78bfa" }}>Arc</span> Analysis
      </div>
      <div className="pacing-chart-wrap" style={{ boxShadow: "0 0 40px rgba(139,92,246,0.12)" }}>
 
        {/* Arc Legend */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
          {PHASE_ORDER.map(phase => (
            <div key={phase} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: phaseColors?.[phase] || "#64748b" }} />
              {phase}
              <span style={{ color: phaseColors?.[phase], fontWeight: 700 }}>
                ({phaseCounts?.[phase] || 0})
              </span>
            </div>
          ))}
        </div>
 
        <svg ref={svgRef} style={{ width: "100%", height: 280 }} viewBox="0 0 1000 280" preserveAspectRatio="none" />
 
        {/* Phase breakdown table */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 12 }}>
          {PHASE_ORDER.map(phase => (
            <div key={phase} style={{
              background: "#0d1117", border: `1px solid ${phaseColors?.[phase] || "#1e2d3d"}`,
              borderRadius: 8, padding: "10px 12px", textAlign: "center"
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: phaseColors?.[phase], fontFamily: "var(--font-display)" }}>
                {phaseCounts?.[phase] || 0}
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{phase}</div>
            </div>
          ))}
        </div>
 
        {/* Arc issues */}
        {issues?.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b" }}>Arc Issues</div>
            {issues.map((issue, i) => (
              <div key={i} className="pacing-suggestion" style={{ borderColor: "rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                {issue.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
function drawArc(svg, arcCurve, phaseColors) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const W = 1000, H = 280;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const n = arcCurve.length;
  const NS = "http://www.w3.org/2000/svg";
 
  const PHASES = ["Setup","Rising Action","Climax","Falling Action","Resolution"];
  const xScale = i => PAD.left + (i / Math.max(n-1,1)) * chartW;
  const yScale = v => PAD.top + chartH - (v / (PHASES.length-1)) * chartH;
 
  PHASES.forEach((phase, i) => {
    const y = yScale(i);
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", PAD.left); line.setAttribute("y1", y);
    line.setAttribute("x2", W-PAD.right); line.setAttribute("y2", y);
    line.setAttribute("stroke", "#1e2d3d"); line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", PAD.left - 6); label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end"); label.setAttribute("fill", "#334155");
    label.setAttribute("font-size", "9");
    label.textContent = phase.split(" ")[0];
    svg.appendChild(label);
  });
 
  for (let i = 0; i < arcCurve.length - 1; i++) {
    const a = arcCurve[i], b = arcCurve[i+1];
    const x1 = xScale(i), x2 = xScale(i+1);
    const y1 = yScale(a.phase_index), y2 = yScale(b.phase_index);
    const color = phaseColors?.[a.phase] || "#64748b";
 
    const area = document.createElementNS(NS, "polygon");
    area.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x2},${H-PAD.bottom} ${x1},${H-PAD.bottom}`);
    area.setAttribute("fill", color); area.setAttribute("opacity", "0.1");
    svg.appendChild(area);
 
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("stroke", color); line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    svg.appendChild(line);
  }
 
  arcCurve.forEach((p, i) => {
    const x = xScale(i), y = yScale(p.phase_index);
    const color = phaseColors?.[p.phase] || "#64748b";
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", x); circle.setAttribute("cy", y);
    circle.setAttribute("r", "5"); circle.setAttribute("fill", color);
    circle.setAttribute("stroke", "#080b12"); circle.setAttribute("stroke-width", "2");
    svg.appendChild(circle);
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", x); label.setAttribute("y", H - PAD.bottom + 16);
    label.setAttribute("text-anchor", "middle"); label.setAttribute("fill", "#334155");
    label.setAttribute("font-size", "9");
    label.textContent = `P${p.paragraph}`;
    svg.appendChild(label);
  });
}
