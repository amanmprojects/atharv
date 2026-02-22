import { useState, useMemo } from "react";

export default function CharacterTimeline({ timelineData, phaseColors }) {
   const [selectedChar, setSelectedChar] = useState(null);

   const data = timelineData || {};
   const rows = data.rows || [];
   const arcBands = data.arc_bands || [];
   const predictions = data.predictions || [];
   const totalParagraphs = data.total_paragraphs || 0;

   const paragraphNums = useMemo(() =>
      Array.from({ length: totalParagraphs }, (_, i) => i + 1),
      [totalParagraphs]
   );

   const phaseForParagraph = useMemo(() => {
      const map = {};
      for (const band of arcBands) {
         map[band.paragraph] = band.phase;
      }
      return map;
   }, [arcBands]);

   const colors = phaseColors || {
      Setup: "#22d3ee",
      "Rising Action": "#f59e0b",
      Climax: "#ef4444",
      "Falling Action": "#8b5cf6",
      Resolution: "#10b981",
   };

   const roleColor = (role) => {
      if (role === "Main Character") return "#22d3ee";
      if (role === "Supporting Character") return "#f59e0b";
      return "#64748b";
   };

   const roleBadge = (role) => {
      const short = role === "Main Character" ? "MAIN" : role === "Supporting Character" ? "SUPPORT" : "BG";
      return short;
   };

   if (totalParagraphs === 0 || rows.length === 0) {
      return (
         <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>No character timeline data. Run analysis on a text with named characters.</p>
         </div>
      );
   }

   const selectedProfile = selectedChar ? rows.find((r) => r.character === selectedChar) : null;
   const selectedPrediction = selectedChar ? predictions.find((p) => p.character === selectedChar) : null;

   return (
      <div className="timeline-container">
         <div className="timeline-header">
            <h2 className="timeline-title">📅 Character Timeline</h2>
            <div className="timeline-legend">
               {Object.entries(colors).map(([phase, c]) => (
                  <span key={phase} className="legend-item">
                     <span className="legend-dot" style={{ background: c }} />
                     {phase}
                  </span>
               ))}
               <span className="legend-item">
                  <span className="legend-dot" style={{ background: "#f59e0b", border: "2px dashed #f59e0b", width: 10, height: 10 }} />
                  Predicted
               </span>
            </div>
         </div>

         {/* Heatmap */}
         <div className="timeline-heatmap-wrap">
            <div className="timeline-heatmap" style={{ gridTemplateColumns: `140px repeat(${totalParagraphs}, 1fr)` }}>
               {/* Arc phase band */}
               <div className="heatmap-corner" />
               {paragraphNums.map((p) => {
                  const phase = phaseForParagraph[p] || "Setup";
                  return (
                     <div
                        key={`arc-${p}`}
                        className="heatmap-arc-cell"
                        style={{ background: colors[phase] || "#22d3ee" }}
                        title={`P${p}: ${phase}`}
                     />
                  );
               })}

               {/* Column headers */}
               <div className="heatmap-label-cell">Character</div>
               {paragraphNums.map((p) => (
                  <div key={`header-${p}`} className="heatmap-header-cell">{p}</div>
               ))}

               {/* Character rows */}
               {rows.map((row) => {
                  const appearances = new Set(row.appearances || []);
                  const predicted = row.predicted_next;
                  const absence = row.absence_gap || 0;
                  const allowed = Math.max(2, Math.floor(totalParagraphs * 0.15));
                  const hasWarning = absence > allowed;

                  return (
                     <React.Fragment key={row.character}>
                        <div
                           className={`heatmap-label-cell clickable ${selectedChar === row.character ? "active" : ""}`}
                           onClick={() => setSelectedChar(selectedChar === row.character ? null : row.character)}
                        >
                           <span className="char-name">{row.character}</span>
                           <span className="char-role-badge" style={{ background: roleColor(row.role) + "22", color: roleColor(row.role), borderColor: roleColor(row.role) }}>
                              {roleBadge(row.role)}
                           </span>
                        </div>

                        {paragraphNums.map((p) => {
                           const present = appearances.has(p);
                           const isPredicted = predicted && p === predicted && !present;
                           const phase = phaseForParagraph[p] || "Setup";
                           const cellColor = present ? colors[phase] || "#22d3ee" : "transparent";

                           let className = "heatmap-cell";
                           if (present) className += " present";
                           if (isPredicted) className += " predicted";
                           if (!present && hasWarning && p > (row.last_appearance || 0)) className += " absent-warning";

                           return (
                              <div
                                 key={`${row.character}-${p}`}
                                 className={className}
                                 style={present ? { background: cellColor } : undefined}
                                 title={`${row.character} — P${p}${present ? ` (${phase})` : isPredicted ? " (predicted)" : ""}`}
                              />
                           );
                        })}
                     </React.Fragment>
                  );
               })}
            </div>
         </div>

         {/* Profile card + Predictions panel */}
         <div className="timeline-bottom">
            {/* Profile Card */}
            <div className="timeline-profile-panel">
               {selectedProfile ? (
                  <div className="profile-card">
                     <div className="profile-header">
                        <h3>{selectedProfile.character}</h3>
                        <span className="char-role-badge" style={{
                           background: roleColor(selectedProfile.role) + "22",
                           color: roleColor(selectedProfile.role),
                           borderColor: roleColor(selectedProfile.role),
                        }}>
                           {selectedProfile.role}
                        </span>
                     </div>

                     <div className="profile-stats">
                        <div className="profile-stat">
                           <span className="stat-label">Appearances</span>
                           <span className="stat-value">{selectedProfile.appearance_count}</span>
                        </div>
                        <div className="profile-stat">
                           <span className="stat-label">First Seen</span>
                           <span className="stat-value">P{selectedProfile.first_appearance}</span>
                        </div>
                        <div className="profile-stat">
                           <span className="stat-label">Last Seen</span>
                           <span className="stat-value">P{selectedProfile.last_appearance}</span>
                        </div>
                        <div className="profile-stat">
                           <span className="stat-label">Avg Gap</span>
                           <span className="stat-value">{selectedProfile.avg_gap}p</span>
                        </div>
                        <div className="profile-stat">
                           <span className="stat-label">Absence</span>
                           <span className="stat-value">{selectedProfile.absence_gap}p</span>
                        </div>
                        <div className="profile-stat">
                           <span className="stat-label">Coverage</span>
                           <span className="stat-value">{Math.round(selectedProfile.coverage_ratio * 100)}%</span>
                        </div>
                     </div>

                     {/* Phase Distribution */}
                     <div className="phase-distribution">
                        <span className="stat-label">Phase Distribution</span>
                        <div className="phase-bar">
                           {Object.entries(colors).map(([phase]) => {
                              const count = (selectedProfile.appearances || []).filter(
                                 (p) => phaseForParagraph[p] === phase
                              ).length;
                              if (count === 0) return null;
                              const width = (count / Math.max(selectedProfile.appearance_count, 1)) * 100;
                              return (
                                 <div
                                    key={phase}
                                    className="phase-bar-segment"
                                    style={{ width: `${width}%`, background: colors[phase] }}
                                    title={`${phase}: ${count}`}
                                 />
                              );
                           })}
                        </div>
                     </div>

                     {/* Prediction */}
                     {selectedPrediction && (
                        <div className="profile-prediction">
                           {selectedPrediction.next_predicted ? (
                              <div className="prediction-callout amber">
                                 <span>📍 Expected around P{selectedPrediction.next_predicted}</span>
                                 <span className="prediction-reason">{selectedPrediction.reason}</span>
                              </div>
                           ) : (
                              <div className="prediction-callout muted">Story arc complete for this character</div>
                           )}
                        </div>
                     )}

                     {/* Arc Obligation */}
                     {selectedPrediction?.arc_obligation && (
                        <div className="prediction-callout amber">
                           {selectedPrediction.arc_obligation}
                        </div>
                     )}

                     {/* Warning */}
                     {selectedPrediction?.warning && (
                        <div className="prediction-callout red">
                           ⚠️ {selectedPrediction.warning}
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="profile-empty">
                     <p>Click a character name to view their profile</p>
                  </div>
               )}
            </div>

            {/* Predictions Panel */}
            <div className="timeline-predictions-panel">
               <h3 className="predictions-title">🔮 Predictions</h3>
               {predictions.map((pred) => (
                  <div key={pred.character} className={`prediction-row ${pred.warning ? "has-warning" : ""}`}>
                     <div className="prediction-char">
                        <strong>{pred.character}</strong>
                     </div>
                     <div className="prediction-detail">
                        <span>Last seen P{pred.last_seen}</span>
                        <span className="pred-arrow">→</span>
                        <span style={{ color: "#f59e0b" }}>
                           {pred.next_predicted ? `P${pred.next_predicted}` : "Done"}
                        </span>
                     </div>
                     {pred.warning && <div className="prediction-warning">{pred.warning}</div>}
                  </div>
               ))}
               {predictions.length === 0 && <p className="trends-empty-note">No predictions available</p>}
            </div>
         </div>
      </div>
   );
}

// Need React in scope for Fragment usage
import React from "react";
