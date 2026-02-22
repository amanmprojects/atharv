export default function ConsistencyView({ similarityScores = [], issues = [], avgSimilarity = 0 }) {
  const average = Number(avgSimilarity || 0);
  const averagePct = Math.max(0, Math.min(100, Math.round(average * 100)));
  const health = getHealth(average, issues.length);
  const bars = similarityScores.map((score, index) => ({
    id: index + 1,
    score: Number(score || 0),
  }));
  const weakestTransition = bars.reduce((min, item) => (item.score < min.score ? item : min), { score: 1 });
  const hasTransitions = bars.length > 0;

  return (
    <div className="consistency-container">
      <div className="consistency-header">
        Semantic <span>Consistency</span> Studio
        <p>Track coherence flow between paragraphs and catch tonal drift before it compounds.</p>
      </div>

      <div className="consistency-panel">
        <div className="consistency-hero">
          <div className="consistency-hero-copy">
            <div className={`consistency-health-pill ${health.tone}`}>{health.label}</div>
            <h3>Narrative Signal</h3>
            <p>
              {hasTransitions
                ? `Weakest transition: P${weakestTransition.id} to P${weakestTransition.id + 1}`
                : "Need at least 2 paragraphs to estimate narrative continuity."}
            </p>
          </div>
          <div className={`consistency-orb-wrap ${health.tone}`}>
            <div
              className="consistency-orb"
              style={{
                background: `conic-gradient(var(--consistency-accent) ${averagePct}%, rgba(100,116,139,0.2) ${averagePct}% 100%)`,
              }}
            >
              <div className="consistency-orb-core">
                <strong>{averagePct}%</strong>
                <span>avg score</span>
              </div>
            </div>
          </div>
        </div>

        <div className="consistency-metrics">
          <MetricCard label="Avg Similarity" value={Number(avgSimilarity || 0).toFixed(2)} />
          <MetricCard label="Transitions" value={bars.length} />
          <MetricCard label="Shift Flags" value={issues.length} />
        </div>

        <div className="consistency-sections">
          <section className="consistency-section">
            <div className="consistency-section-title">Transition Similarity</div>
            <div className="consistency-bars">
              {bars.map((item) => {
                const pct = Math.max(0, Math.min(100, Math.round(item.score * 100)));
                const tone = getTone(item.score);
                return (
                  <div key={item.id} className={`consistency-bar-row ${tone}`}>
                    <div className="consistency-bar-meta">
                      <span className="consistency-bar-label">P{item.id} to P{item.id + 1}</span>
                      <span className={`consistency-bar-score ${tone}`}>{item.score.toFixed(2)}</span>
                    </div>
                    <div className="consistency-track">
                      <div className={`consistency-fill ${tone}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {bars.length === 0 && (
                <div className="consistency-empty">
                  Add multiple paragraphs to compute consistency transitions.
                </div>
              )}
            </div>
          </section>

          <section className="consistency-section">
            <div className="consistency-section-title">Consistency Alerts</div>
            {issues.length === 0 && <div className="consistency-empty">No semantic drift issues detected.</div>}
            <div className="consistency-alerts">
              {issues.slice(0, 10).map((issue, index) => (
                <div key={index} className="consistency-alert-item">
                  <span className="consistency-alert-index">{index + 1}</span>
                  <span>{issue.message || issue.explanation || issue.issue || "Consistency issue detected."}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="consistency-metric-card">
      <div className="consistency-metric-label">{label}</div>
      <div className="consistency-metric-value">{value}</div>
    </div>
  );
}

function getTone(score) {
  if (score < 0.15) return "danger";
  if (score < 0.25) return "warning";
  return "healthy";
}

function getHealth(avg, issueCount) {
  if (avg >= 0.28 && issueCount <= 1) return { label: "Stable Flow", tone: "healthy" };
  if (avg >= 0.18 && issueCount <= 4) return { label: "Needs Tuning", tone: "warning" };
  return { label: "High Drift Risk", tone: "danger" };
}
