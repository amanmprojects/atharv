export default function TrendsView({ trendData, genre }) {
   if (!trendData) {
      return <div className="empty-state"><div className="empty-icon">📈</div><p>No trend data available. Run analysis first.</p></div>;
   }

   const {
      alignment_score = 50,
      market_health = "unknown",
      summary = "",
      matches = [],
      gaps = [],
      trending_subgenres = [],
      hot_tropes = [],
      avoid_tropes = [],
   } = trendData;

   const scoreColor = alignment_score >= 71 ? "#10b981" : alignment_score >= 41 ? "#f59e0b" : "#ef4444";
   const healthIcon = market_health === "growing" ? "📈" : market_health === "strong" ? "💪" : market_health === "stable" ? "➡️" : market_health === "resurgent" ? "🔥" : "❓";
   const healthColor = market_health === "growing" || market_health === "strong" || market_health === "resurgent" ? "#10b981" : market_health === "stable" ? "#f59e0b" : "#64748b";

   return (
      <div className="trends-container">
         {/* Section A: Market Overview */}
         <div className="trends-overview">
            <div className="trends-overview-left">
               <div className="trends-genre-badge" style={{ borderColor: scoreColor }}>
                  {(genre || "Unknown").replace(/_/g, " ")}
               </div>
               <div className="trends-health" style={{ color: healthColor }}>
                  <span className="health-icon">{healthIcon}</span>
                  <span className="health-label">{market_health?.toUpperCase()}</span>
               </div>
               {summary && <p className="trends-summary">{summary}</p>}
            </div>

            <div className="trends-score-ring">
               <svg viewBox="0 0 120 120" className="score-svg">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                     cx="60" cy="60" r="52" fill="none"
                     stroke={scoreColor} strokeWidth="8"
                     strokeDasharray={`${(alignment_score / 100) * 327} 327`}
                     strokeLinecap="round"
                     transform="rotate(-90 60 60)"
                     className="score-arc"
                  />
               </svg>
               <div className="score-center">
                  <span className="score-number" style={{ color: scoreColor }}>{alignment_score}</span>
                  <span className="score-label">ALIGNMENT</span>
               </div>
            </div>
         </div>

         {/* Section B: 3 Column Cards */}
         <div className="trends-columns">
            {/* Hot Tropes */}
            <div className="trends-column">
               <h3 className="trends-column-title" style={{ color: "#10b981" }}>🔥 Hot Tropes</h3>
               <div className="trends-trope-list">
                  {hot_tropes.length > 0 ? hot_tropes.map((trope, i) => {
                     const isMatched = matches.some((m) => m.toLowerCase().includes(String(trope).toLowerCase()));
                     return (
                        <div key={i} className={`trends-trope-item ${isMatched ? "matched" : "missing"}`}>
                           <span className="trope-status">{isMatched ? "✅" : "⬜"}</span>
                           <span className="trope-name">{trope}</span>
                        </div>
                     );
                  }) : <p className="trends-empty-note">No trope data for this genre</p>}
               </div>
            </div>

            {/* Trending Sub-genres */}
            <div className="trends-column">
               <h3 className="trends-column-title" style={{ color: "var(--cyan)" }}>📊 Trending Sub-genres</h3>
               <div className="trends-trope-list">
                  {trending_subgenres.length > 0 ? trending_subgenres.map((sub, i) => {
                     const paceColor = sub.pace === "fast" || sub.pace === "brisk" ? "#10b981" : sub.pace === "steady" || sub.pace === "balanced" ? "#f59e0b" : "#64748b";
                     return (
                        <div key={i} className="trends-subgenre-item">
                           <span className="subgenre-name">{sub.name}</span>
                           <span className="subgenre-pace" style={{ color: paceColor, borderColor: paceColor }}>
                              {sub.pace}
                           </span>
                        </div>
                     );
                  }) : <p className="trends-empty-note">No sub-genre data</p>}
               </div>
            </div>

            {/* Avoid Tropes */}
            <div className="trends-column trends-avoid">
               <h3 className="trends-column-title" style={{ color: "#ef4444" }}>⚠️ Tropes to Avoid</h3>
               <div className="trends-trope-list">
                  {avoid_tropes.length > 0 ? avoid_tropes.map((trope, i) => (
                     <div key={i} className="trends-avoid-item">
                        <span className="avoid-name">{trope.name}</span>
                        <span className="avoid-reason">{trope.reason}</span>
                     </div>
                  )) : <p className="trends-empty-note">No avoid data</p>}
               </div>
            </div>
         </div>

         {/* Section C: Recommendations */}
         <div className="trends-recommendations">
            <h3 className="trends-reco-title">💡 Recommendations</h3>
            <div className="trends-reco-grid">
               {matches.length > 0 && (
                  <div className="trends-reco-section">
                     <h4 className="reco-heading matches">✅ What's Working ({matches.length})</h4>
                     {matches.slice(0, 5).map((m, i) => (
                        <div key={i} className="reco-card match">
                           <span className="reco-number">{i + 1}</span>
                           <span className="reco-text">{m}</span>
                        </div>
                     ))}
                  </div>
               )}
               {gaps.length > 0 && (
                  <div className="trends-reco-section">
                     <h4 className="reco-heading gaps">📌 Opportunities ({gaps.length})</h4>
                     {gaps.slice(0, 5).map((g, i) => (
                        <div key={i} className="reco-card gap">
                           <span className="reco-number">{i + 1}</span>
                           <span className="reco-text">{g}</span>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
