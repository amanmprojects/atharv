import { useMemo, useState } from "react";

const ROLE_COLORS = {
  main: "#22d3ee",
  supporting: "#f59e0b",
  background: "#64748b",
  mentioned: "#94a3b8",
};

export default function CharacterTimeline({ heatmapData, profiles, predictions, phaseColors, issues }) {
  const [selected, setSelected] = useState(null);

  const profileMap = useMemo(() => new Map((profiles || []).map((p) => [p.name, p])), [profiles]);
  const predictionMap = useMemo(() => new Map((predictions || []).map((p) => [p.character, p])), [predictions]);

  const cellMap = useMemo(() => {
    const map = new Map();
    for (const cell of heatmapData?.cells || []) {
      map.set(`${cell.character}-${cell.paragraph}`, cell);
    }
    return map;
  }, [heatmapData]);

  const selectedProfile = selected ? profileMap.get(selected) : null;
  const selectedPrediction = selected ? predictionMap.get(selected) : null;

  return (
    <div className="timeline-wrap pacing-container">
      <div className="pacing-header">
        Character <span>Timeline</span>
      </div>

      <div className="pacing-chart-wrap timeline-heatmap-wrap">
        <div className="timeline-phase-band">
          {(heatmapData?.paragraphs || []).map((p) => {
            const anyCell = (heatmapData?.cells || []).find((c) => c.paragraph === p);
            const color = phaseColors?.[anyCell?.phase] || "#1e2d3d";
            return <span key={`phase-${p}`} style={{ background: color }} title={`${anyCell?.phase || "Setup"} · P${p}`} />;
          })}
        </div>

        <div className="timeline-grid">
          <div className="timeline-corner" />
          {(heatmapData?.paragraphs || []).map((p) => (
            <div key={`head-${p}`} className="timeline-col-head">P{p}</div>
          ))}

          {(heatmapData?.characters || []).map((name) => {
            const profile = profileMap.get(name);
            const role = profile?.role || "background";
            const predicted = predictionMap.get(name)?.predicted_next;
            const warning = predictionMap.get(name)?.warning;
            return (
              <>
                <button
                  key={`row-${name}`}
                  className={`timeline-row-head ${selected === name ? "active" : ""}`}
                  onClick={() => setSelected(name)}
                >
                  {name}
                  <span style={{ background: ROLE_COLORS[role] || "#64748b" }}>{role}</span>
                </button>
                {(heatmapData?.paragraphs || []).map((p) => {
                  const cell = cellMap.get(`${name}-${p}`);
                  const present = !!cell?.present;
                  const phaseColor = phaseColors?.[cell?.phase] || "#1e2d3d";
                  const isPredicted = predicted === p;
                  const warningCell = !!warning && !present;
                  return (
                    <div
                      key={`${name}-${p}`}
                      className={`timeline-cell ${present ? "present" : "absent"} ${isPredicted ? "predicted" : ""} ${warningCell ? "warn" : ""}`}
                      style={present ? { background: phaseColor } : undefined}
                      title={`${name} · P${p} · ${cell?.phase || "Setup"}${isPredicted ? " · predicted" : ""}`}
                    />
                  );
                })}
              </>
            );
          })}
        </div>
      </div>

      <div className="timeline-lower">
        <section className="pacing-chart-wrap">
          <h3>Character Profile</h3>
          {!selectedProfile && <p className="nws-card-copy">Click a character row to inspect details.</p>}
          {selectedProfile && (
            <div className="timeline-profile-card">
              <div className="timeline-profile-line">Role: <strong>{selectedProfile.role}</strong></div>
              <div className="timeline-profile-line">Appearances: <strong>{selectedProfile.total_appearances}</strong></div>
              <div className="timeline-profile-line">First seen: <strong>P{selectedProfile.first_appearance}</strong></div>
              <div className="timeline-profile-line">Last seen: <strong>P{selectedProfile.last_appearance}</strong></div>
              <div className="timeline-profile-line">Longest absence: <strong>{selectedProfile.longest_absence}</strong></div>
              <div className="timeline-profile-line">Current absence: <strong>{selectedProfile.current_absence}</strong></div>
              {selectedPrediction?.predicted_next && (
                <div className="timeline-callout">
                  Expected around P{selectedPrediction.predicted_next}. {selectedPrediction.prediction_basis}
                </div>
              )}
              {selectedPrediction?.arc_obligation && <div className="timeline-callout amber">{selectedPrediction.arc_obligation}</div>}
              {selectedPrediction?.warning && <div className="timeline-callout red">{selectedPrediction.warning}</div>}
            </div>
          )}
        </section>

        <section className="pacing-chart-wrap">
          <h3>Predictions</h3>
          <div className="timeline-pred-list">
            {(predictions || []).map((item) => (
              <article key={item.character} className={`timeline-pred-item ${item.warning ? "warn" : ""}`}>
                <strong>{item.character}</strong>
                <span>Last P{item.last_seen}</span>
                <span>{item.predicted_next ? `Pred P${item.predicted_next}` : "No further prediction"}</span>
                {item.warning && <small>{item.warning}</small>}
              </article>
            ))}
          </div>
        </section>
      </div>

      {!!issues?.length && (
        <section className="pacing-chart-wrap">
          <h3>Timeline Issues</h3>
          <div className="trends-recs">
            {issues.map((issue, idx) => (
              <article key={`${idx}-${issue.character || "issue"}`} className="trend-rec-card">
                <span>{idx + 1}</span>
                <p>
                  <strong>{issue.character || issue.category}</strong>: {issue.message}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
