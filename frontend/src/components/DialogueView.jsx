const DIMENSIONS = [
  { key: "vocab_richness", label: "Vocab Richness", max: 1 },
  { key: "avg_sentence_len", label: "Avg Sentence Length", max: 24 },
  { key: "formality", label: "Formality", max: 1 },
  { key: "exclamation_rate", label: "Exclamation Rate", max: 2 },
  { key: "question_rate", label: "Question Rate", max: 2 },
];

export default function DialogueView({ profiles = {}, issues = [], dialogueMap = {} }) {
  const characters = Object.keys(profiles);

  return (
    <div className="issues-container" style={{ gridTemplateColumns: "1fr" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="pacing-header">
            Dialogue <span style={{ color: "#f59e0b" }}>Voice</span> Consistency
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Character speech fingerprints update per line and raise drift alerts when voice changes too sharply.
          </p>
        </div>

        {characters.length === 0 && (
          <div style={{ color: "#64748b", fontSize: 12, padding: "20px 0" }}>
            No dialogue detected yet. Add quoted speech to build voice profiles.
          </div>
        )}

        {characters.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {characters.map((name) => {
              const profile = profiles[name] || {};
              const sample = dialogueMap[name]?.[0] || "";
              const charIssues = issues.filter((issue) => issue.character === name);

              return (
                <div
                  key={name}
                  style={{
                    background: "#0d1117",
                    border: `1px solid ${charIssues.length ? "#f59e0b66" : "#1e2d3d"}`,
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#e2e8f0", fontWeight: 800 }}>{name}</div>
                    <div style={{ color: "#64748b", fontSize: 10 }}>{profile.sample_size || 0} samples</div>
                  </div>

                  {DIMENSIONS.map((dim) => {
                    const value = Number(profile[dim.key] || 0);
                    const pct = Math.max(0, Math.min(100, (value / dim.max) * 100));

                    return (
                      <div key={dim.key} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                          <span style={{ color: "#64748b" }}>{dim.label}</span>
                          <span style={{ color: "#94a3b8" }}>{value.toFixed(2)}</span>
                        </div>
                        <div style={{ height: 5, background: "#1e2d3d", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "#22d3ee", transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}

                  {sample && (
                    <div style={{ marginTop: 10, padding: "8px 10px", background: "#080b12", borderRadius: 7, borderLeft: "2px solid #1e2d3d" }}>
                      <div style={{ color: "#334155", fontSize: 10, marginBottom: 3 }}>Sample line</div>
                      <div style={{ color: "#94a3b8", fontSize: 11, fontStyle: "italic" }}>
                        "{sample.slice(0, 110)}{sample.length > 110 ? "..." : ""}"
                      </div>
                    </div>
                  )}

                  {charIssues.map((issue, i) => (
                    <div
                      key={i}
                      style={{
                        marginTop: 10,
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        color: "#f59e0b",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 11,
                      }}
                    >
                      {issue.message}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
