const FALLBACK = "#64748b";

export default function GenreView({
  perParagraph = [],
  dominantGenre = "unknown",
  genreColor = FALLBACK,
  topGenres = [],
  driftIssues = [],
}) {
  const rows = perParagraph.map((row) => ({
    paragraph: row.paragraph,
    genre: row.top_genre || "neutral",
    confidence: row.confidence || 0,
    color: row.color || FALLBACK,
  }));

  const total = Math.max(rows.length, 1);
  const confidenceAvg = rows.length
    ? Math.round((rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length) * 100)
    : 0;
  const diversity = new Set(rows.map((row) => row.genre)).size;

  return (
    <div className="pacing-container">
      <div className="pacing-header">
        Literary <span>Genre</span> Profile
        <p>Classifies each paragraph by likely genre to reveal consistency, drift, and tonal distribution.</p>
      </div>

      <div className="pacing-chart-wrap genre-wrap">
        <div className="analysis-metrics-grid">
          <MetricCard label="Dominant Genre" value={dominantGenre} accent={genreColor} />
          <MetricCard label="Avg Confidence" value={`${confidenceAvg}%`} />
          <MetricCard label="Genre Diversity" value={diversity} />
          <MetricCard label="Drift Signals" value={driftIssues.length} />
        </div>

        <div className="genre-feature-callout">
          <strong>What this tab does:</strong> It tracks paragraph-level genre classification and highlights where your narrative voice shifts away from the dominant genre.
        </div>

        <div className="genre-top-grid">
          <div className="genre-top-card" style={{ borderColor: `${genreColor}66` }}>
            <div className="analysis-section-title">Dominant Genre</div>
            <div className="genre-dominant-value" style={{ color: genreColor }}>
              {dominantGenre}
            </div>
          </div>
          <div className="genre-top-card">
            <div className="analysis-section-title">Genre Drift</div>
            <div className={`genre-drift-value ${driftIssues.length > 0 ? "warning" : "positive"}`}>
              {driftIssues.length > 0 ? `${driftIssues.length} shifts detected` : "No drift detected"}
            </div>
          </div>
        </div>

        <div className="genre-flow-block">
          <div className="analysis-section-title">Paragraph Flow</div>
          <div className="genre-flow-grid">
            {rows.map((row) => (
              <div
                key={row.paragraph}
                title={`Paragraph ${row.paragraph}: ${row.genre}`}
                className="genre-flow-card"
                style={{ borderColor: `${row.color}66`, background: `${row.color}14` }}
              >
                <div className="genre-flow-para">P{row.paragraph}</div>
                <div className="genre-flow-name" style={{ color: row.color }}>{row.genre}</div>
                <div className="genre-flow-score">{Math.round(row.confidence * 100)}%</div>
              </div>
            ))}
          </div>
        </div>

        {topGenres.length > 0 && (
          <div className="genre-distribution">
            <div className="analysis-section-title">Distribution</div>
            {topGenres.map((genre) => {
              const count = rows.filter((r) => r.genre === genre).length;
              const pct = Math.round((count / total) * 100);
              const color = rows.find((r) => r.genre === genre)?.color || FALLBACK;

              return (
                <div key={genre} className="genre-dist-row">
                  <div className="genre-dist-meta">
                    <span style={{ textTransform: "capitalize", color }}>{genre}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="genre-dist-track">
                    <div style={{ width: `${pct}%`, background: color }} className="genre-dist-fill" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {driftIssues.length > 0 && (
          <div className="pacing-suggestions">
            <div className="analysis-section-title">Drift Alerts</div>
            {driftIssues.map((issue, index) => (
              <div key={index} className="pacing-suggestion">
                {issue.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="analysis-metric-card">
      <div className="analysis-metric-label">{label}</div>
      <div className="analysis-metric-value" style={{ color: accent || "var(--text)" }}>{value}</div>
    </div>
  );
}
