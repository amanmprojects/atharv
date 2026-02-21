export default function Dashboard({ result }) {
  if (!result) return null;

  const report = result.report || {};
  const metrics = [
    { label: "High", value: report.high_severity || 0, cls: "red" },
    { label: "Medium", value: report.medium_severity || 0, cls: "amber" },
    { label: "Low", value: report.low_severity || 0, cls: "cyan" },
    { label: "Readability", value: `${Number(result.readability_score || 0).toFixed(0)}/100`, cls: "white" },
    { label: "Genre", value: result.dominant_genre || "unknown", cls: "green" },
    { label: "Style Changes", value: result.style_result?.num_changes || 0, cls: "cyan" },
    { label: "Characters", value: Object.keys(result.characters || {}).length, cls: "white" },
    { label: "Paragraphs", value: result.pacing?.length || 0, cls: "white" },
  ];

  return (
    <div className="dashboard-bar">
      {metrics.map(({ label, value, cls }) => (
        <div key={label} className="dash-metric">
          <div className="dash-label">{label}</div>
          <div className={`dash-value ${cls}`} style={{ fontSize: typeof value === "string" && value.length > 8 ? 14 : 22 }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
