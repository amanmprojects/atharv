import { useMemo, useState } from "react";

const CATEGORY_ORDER = ["All", "Character", "Consistency", "Structure", "Show", "Pacing", "Dialogue", "Genre"];

function normalizeCategory(issue) {
  const raw = String(issue?.category || issue?.type || "General").toLowerCase();
  if (raw.includes("character")) return "Character";
  if (raw.includes("consistency")) return "Consistency";
  if (raw.includes("structure")) return "Structure";
  if (raw.includes("show")) return "Show";
  if (raw.includes("pacing")) return "Pacing";
  if (raw.includes("dialogue")) return "Dialogue";
  if (raw.includes("genre")) return "Genre";
  return "General";
}

export default function IssuePanel({ report }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const allIssues = report?.all_issues || [];

  const grouped = useMemo(() => {
    const map = { All: allIssues };
    for (const issue of allIssues) {
      const category = normalizeCategory(issue);
      if (!map[category]) map[category] = [];
      map[category].push(issue);
    }
    return map;
  }, [allIssues]);

  const categories = useMemo(() => {
    const dynamic = Object.keys(grouped).filter((key) => key !== "All");
    const ordered = CATEGORY_ORDER.filter((key) => key === "All" || dynamic.includes(key));
    const extras = dynamic.filter((key) => !CATEGORY_ORDER.includes(key));
    return [...ordered, ...extras];
  }, [grouped]);

  const visibleIssues = grouped[activeCategory] || [];

  return (
    <div className="issues-container">
      <div className="issues-sidebar">
        <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#334155", marginBottom: 8 }}>
          Categories
        </div>

        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`sidebar-category ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
            <span className="category-count">{grouped[cat]?.length || 0}</span>
          </button>
        ))}

        <div style={{ marginTop: "auto", padding: "12px 0", borderTop: "1px solid #1e2d3d" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
              <span>High</span>
              <span style={{ color: "#ef4444" }}>{report?.high_severity || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
              <span>Medium</span>
              <span style={{ color: "#f59e0b" }}>{report?.medium_severity || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
              <span>Low</span>
              <span style={{ color: "#22d3ee" }}>{report?.low_severity || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="issues-list">
        {visibleIssues.length === 0 ? (
          <div style={{ color: "#334155", fontSize: 12, textAlign: "center", marginTop: 40 }}>
            No issues in this category.
          </div>
        ) : (
          visibleIssues.map((issue, index) => {
            const severity = String(issue.severity || "low").toLowerCase();
            return (
              <div key={index} className={`issue-card ${severity}`}>
                <div className="issue-meta">
                  <div className={`severity-dot ${severity}`} />
                  <span className="issue-category">{normalizeCategory(issue)}</span>
                </div>
                <div className="issue-message">{issue.message || issue.issue}</div>
                {issue.suggestion && <div className="issue-suggestion">Tip: {issue.suggestion}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
