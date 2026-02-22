export default function TrendsView({ trendData, genre }) {
  const data = trendData || {};
  const score = Number(data.alignment_score || 0);
  const scoreClass = score >= 71 ? "good" : score >= 41 ? "mid" : "bad";
  const health = String(data.market_health || "stable").toLowerCase();

  const matched = data.matched_tropes || [];
  const missing = data.missing_tropes || [];
  const hot = data.hot_tropes || [];
  const trends = data.trending_subgenres || [];
  const avoid = data.avoid_tropes || [];
  const warnings = data.avoid_warnings || [];
  const warningMap = new Map(warnings.map((w) => [w.name, w]));

  return (
    <div className="trends-wrap pacing-container">
      <div className="pacing-header">
        Market <span>Trends</span>
      </div>

      <div className="pacing-chart-wrap trends-top">
        <div className="trends-badge">{(genre || data.genre || "unknown").toUpperCase()}</div>
        <div className={`trends-health ${health}`}>{health}</div>
        <div className={`trends-score ${scoreClass}`}>{score}<small>/100</small></div>
        <p className="trends-notes">{data.market_notes || "No market notes available yet."}</p>
      </div>

      <div className="trends-grid">
        <section className="trends-col trends-hot">
          <h3>Hot Tropes</h3>
          {(hot.length ? hot : [...matched, ...missing]).map((item) => {
            const name = item.name;
            const hit = matched.some((row) => row.name === name);
            const source = matched.find((row) => row.name === name) || item;
            return (
              <article key={name} className={`trend-item ${hit ? "found" : "missing"}`}>
                <div className="trend-head">
                  <strong>{name}</strong>
                  <span>{hit ? "?" : "?"}</span>
                </div>
                <p>{source.why_trending || source.description || ""}</p>
                <small>{(source.signal_words_found || []).join(", ") || "No signal words detected"}</small>
              </article>
            );
          })}
        </section>

        <section className="trends-col trends-subgenre">
          <h3>Trending Sub-genres</h3>
          {trends.map((item) => {
            const active = data.trending_subgenre?.name === item.name;
            return (
              <article key={item.name} className={`trend-item ${active ? "active" : ""}`}>
                <div className="trend-head">
                  <strong>{item.name}</strong>
                  <span className={`trend-growth ${item.growth}`}>{item.growth}</span>
                </div>
                <p>{item.description}</p>
              </article>
            );
          })}
        </section>

        <section className="trends-col trends-avoid">
          <h3>Avoid</h3>
          {avoid.map((item) => {
            const detected = warningMap.has(item.name);
            return (
              <article key={item.name} className={`trend-item ${detected ? "detected" : ""}`}>
                <div className="trend-head">
                  <strong>{item.name}</strong>
                  {detected && <span className="detected-badge">DETECTED</span>}
                </div>
                <p>{item.reason}</p>
              </article>
            );
          })}
        </section>
      </div>

      <section className="pacing-chart-wrap">
        <h3>Recommendations</h3>
        <div className="trends-recs">
          {(data.recommendations || []).map((item, idx) => (
            <article key={`${idx}-${item.slice(0, 12)}`} className="trend-rec-card">
              <span>{idx + 1}</span>
              <p>{item}</p>
            </article>
          ))}
          {!data.recommendations?.length && <p className="nws-card-copy">Run analysis to get recommendations.</p>}
        </div>
      </section>
    </div>
  );
}
