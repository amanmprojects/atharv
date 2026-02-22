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

  return (
    <div className="pacing-container">
      <div className="pacing-header">
        Literary <span style={{ color: genreColor }}>Genre</span> Profile
      </div>

      <div className="pacing-chart-wrap" style={{ boxShadow: `0 0 40px ${genreColor}22` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ border: `1px solid ${genreColor}66`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b" }}>Dominant Genre</div>
            <div style={{ marginTop: 6, fontSize: 24, textTransform: "capitalize", fontFamily: "var(--font-display)", color: genreColor }}>
              {dominantGenre}
            </div>
          </div>
          <div style={{ border: "1px solid #1e2d3d", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b" }}>Genre Drift</div>
            <div style={{ marginTop: 8, color: driftIssues.length > 0 ? "#f59e0b" : "#10b981", fontWeight: 700 }}>
              {driftIssues.length > 0 ? `${driftIssues.length} shifts detected` : "No drift detected"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Paragraph Flow</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(64px, 1fr))", gap: 6 }}>
            {rows.map((row) => (
              <div
                key={row.paragraph}
                title={`Paragraph ${row.paragraph}: ${row.genre}`}
                style={{
                  border: `1px solid ${row.color}66`,
                  borderRadius: 8,
                  background: `${row.color}22`,
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, color: "#94a3b8" }}>P{row.paragraph}</div>
                <div style={{ marginTop: 4, fontSize: 10, color: row.color, textTransform: "capitalize" }}>{row.genre}</div>
                <div style={{ marginTop: 4, fontSize: 9, color: "#64748b" }}>{Math.round(row.confidence * 100)}%</div>
              </div>
            ))}
          </div>
        </div>

        {topGenres.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Distribution</div>
            {topGenres.map((genre) => {
              const count = rows.filter((r) => r.genre === genre).length;
              const pct = Math.round((count / total) * 100);
              const color = rows.find((r) => r.genre === genre)?.color || FALLBACK;

              return (
                <div key={genre} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ textTransform: "capitalize", color }}>{genre}</span>
                    <span style={{ color: "#64748b" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "#1e2d3d", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.7s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {driftIssues.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Drift Alerts</div>
            {driftIssues.map((issue, index) => (
              <div key={index} className="pacing-suggestion" style={{ marginBottom: 6 }}>
                {issue.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
