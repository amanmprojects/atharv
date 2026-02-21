export default function ConsistencyView({ similarityScores = [], issues = [], avgSimilarity = 0 }) {
  const bars = similarityScores.map((score, index) => ({
    id: index + 1,
    score: Number(score || 0),
  }));

  return (
    <div className="pacing-container">
      <div className="pacing-header">
        Semantic <span>Consistency</span>
      </div>

      <div className="pacing-chart-wrap">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr))", gap: 10 }}>
          <MetricCard label="Avg Similarity" value={Number(avgSimilarity || 0).toFixed(2)} />
          <MetricCard label="Transitions" value={bars.length} />
          <MetricCard label="Shift Flags" value={issues.length} />
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {bars.map((item) => {
            const pct = Math.max(0, Math.min(100, Math.round(item.score * 100)));
            const color = item.score < 0.15 ? "#ef4444" : item.score < 0.25 ? "#f59e0b" : "#22d3ee";
            return (
              <div key={item.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: "#64748b" }}>P{item.id} to P{item.id + 1}</span>
                  <span style={{ color }}>{item.score.toFixed(2)}</span>
                </div>
                <div style={{ height: 7, background: "#1e2d3d", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color }} />
                </div>
              </div>
            );
          })}
          {bars.length === 0 && <div className="explain-empty">Add multiple paragraphs to compute consistency transitions.</div>}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>
            Consistency Alerts
          </div>
          {issues.length === 0 && <div className="explain-empty">No semantic drift issues detected.</div>}
          {issues.slice(0, 10).map((issue, index) => (
            <div key={index} className="pacing-suggestion">
              {issue.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div style={{ border: "1px solid #1e2d3d", borderRadius: 10, padding: "10px 12px", background: "#0d1117" }}>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 20, color: "#e2e8f0", fontFamily: "var(--font-display)", fontWeight: 800 }}>{value}</div>
    </div>
  );
}
