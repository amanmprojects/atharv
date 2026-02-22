import { useMemo, useState } from "react";

const EXPLAIN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "trace", label: "Engine Trace" },
  { id: "changes", label: "Change Trace" },
  { id: "issues", label: "Issue Rationales" },
];

export default function ExplainabilityView({ result }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const styleResult = result?.style_result || {};
  const report = result?.report || {};
  const issues = useMemo(() => normalizeIssues(report?.all_issues || []), [report]);
  const changeLog = Array.isArray(styleResult.change_log) ? styleResult.change_log : [];
  const diff = Array.isArray(styleResult.diff) ? styleResult.diff : [];

  const categories = useMemo(() => {
    const values = Array.from(new Set(issues.map((issue) => issue.category).filter(Boolean)));
    return ["all", ...values.sort((a, b) => a.localeCompare(b))];
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;
      const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q
        || issue.message.toLowerCase().includes(q)
        || issue.category.toLowerCase().includes(q)
        || String(issue.suggestion || "").toLowerCase().includes(q);
      return matchesSeverity && matchesCategory && matchesQuery;
    });
  }, [issues, severityFilter, categoryFilter, query]);

  const logicModules = useMemo(() => buildLogicModules(result, styleResult), [result, styleResult]);
  const severitySummary = useMemo(() => {
    return {
      high: issues.filter((issue) => issue.severity === "high").length,
      medium: issues.filter((issue) => issue.severity === "medium").length,
      low: issues.filter((issue) => issue.severity === "low").length,
    };
  }, [issues]);

  const explainabilityScore = useMemo(() => {
    const hasStyleTrace = changeLog.length > 0 || diff.length > 0;
    const withSuggestions = issues.filter((issue) => Boolean(issue.suggestion)).length;
    const suggestionCoverage = issues.length ? withSuggestions / issues.length : 1;
    const moduleCoverage = logicModules.length
      ? logicModules.reduce((sum, module) => sum + module.health, 0) / logicModules.length
      : 0;
    const score = Math.round(
      clamp01((moduleCoverage / 100) * 0.55 + suggestionCoverage * 0.3 + (hasStyleTrace ? 0.15 : 0.05)) * 100,
    );
    return score;
  }, [changeLog, diff, issues, logicModules]);

  const summaryText = useMemo(() => {
    return [
      `Explainability score: ${explainabilityScore}/100`,
      `Style profile: ${styleResult.style || "n/a"}`,
      `Tracked style edits: ${styleResult.num_changes || 0}`,
      `Readability: ${Number(result?.readability_score || 0).toFixed(0)}/100`,
      `Issues: ${issues.length} (H:${severitySummary.high} M:${severitySummary.medium} L:${severitySummary.low})`,
      `Top module risks: ${logicModules
        .filter((module) => module.health < 70)
        .slice(0, 3)
        .map((module) => module.name)
        .join(", ") || "none"}`,
    ].join("\n");
  }, [explainabilityScore, styleResult, result, issues, severitySummary, logicModules]);

  const narrative = useMemo(() => buildDecisionNarrative(result, styleResult, issues, logicModules), [result, styleResult, issues, logicModules]);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadJson = () => {
    const payload = {
      explainability_score: explainabilityScore,
      summary: {
        style: styleResult.style || "n/a",
        readability: Number(result?.readability_score || 0),
        total_issues: issues.length,
        severity: severitySummary,
      },
      engine_trace: logicModules,
      decision_narrative: narrative,
      style_change_log: changeLog,
      diff_blocks: diff,
      issues,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "explainability-report.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="explain-lab-page">
      <div className="explain-lab-hero">
        <div>
          <h2>Explainability Center</h2>
          <p>
            Trace why each recommendation appears, how modules contributed, and where decision confidence needs improvement.
          </p>
        </div>
        <div className="explain-lab-actions">
          <button type="button" className="btn-ghost" onClick={handleCopySummary}>
            {copied ? "Copied" : "Copy Summary"}
          </button>
          <button type="button" className="btn-primary" onClick={handleDownloadJson}>
            Download JSON
          </button>
        </div>
      </div>

      <div className="explain-lab-tabs">
        {EXPLAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`explain-lab-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="explain-overview-grid">
          <section className="explain-card-stack">
            <div className="explain-lab-card">
              <div className="consistency-section-title">Quality Snapshot</div>
              <div className="explain-overview-cards">
                <Card label="Explainability Score" value={`${explainabilityScore}/100`} tone={explainabilityScore >= 75 ? "low" : explainabilityScore >= 55 ? "medium" : "high"} />
                <Card label="Total Issues" value={issues.length} />
                <Card label="High" value={severitySummary.high} tone="high" />
                <Card label="Medium" value={severitySummary.medium} tone="medium" />
                <Card label="Low" value={severitySummary.low} tone="low" />
                <Card label="Style Edits" value={styleResult.num_changes || 0} />
              </div>
            </div>

            <div className="explain-lab-card">
              <div className="consistency-section-title">Severity Distribution</div>
              <div className="explain-severity-bars">
                {[
                  { label: "High", value: severitySummary.high, color: "var(--red)" },
                  { label: "Medium", value: severitySummary.medium, color: "var(--accent-orange)" },
                  { label: "Low", value: severitySummary.low, color: "var(--brand-primary)" },
                ].map((row) => {
                  const pct = issues.length ? Math.round((row.value / issues.length) * 100) : 0;
                  return (
                    <div key={row.label} className="explain-severity-row">
                      <div className="explain-severity-meta">
                        <span>{row.label}</span>
                        <strong>{row.value}</strong>
                      </div>
                      <div className="explain-severity-track">
                        <div style={{ width: `${pct}%`, background: row.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="explain-lab-card">
            <div className="consistency-section-title">Decision Narrative</div>
            <div className="explain-narrative">
              {narrative.map((line, index) => (
                <div key={index} className="explain-narrative-item">
                  {line}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "trace" ? (
        <div className="explain-lab-card">
          <div className="consistency-section-title">Engine Contribution Trace</div>
          <div className="trace-grid">
            {logicModules.map((module) => (
              <div key={module.name} className={`trace-card ${module.health >= 75 ? "low" : module.health >= 55 ? "medium" : "high"}`}>
                <div className="trace-card-head">
                  <span>{module.name}</span>
                  <strong>{module.health}%</strong>
                </div>
                <div className="trace-track">
                  <div style={{ width: `${module.health}%` }} />
                </div>
                <p>{module.detail}</p>
                <div className="trace-metric">{module.metric}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "changes" ? (
        <div className="explain-change-grid">
          <section className="explain-lab-card">
            <div className="consistency-section-title">Style Rule Changes</div>
            {changeLog.length === 0 ? (
              <div className="consistency-empty">No style replacements were applied.</div>
            ) : (
              <div className="explain-scroll-list">
                {changeLog.slice(0, 120).map((item, index) => (
                  <div key={`${item.original}-${index}`} className="change-item">
                    <div className="change-head">
                      <span className="change-token old">{item.original || "(empty)"}</span>
                      <span className="change-arrow">{"->"}</span>
                      <span className="change-token new">{item.replacement || "(empty)"}</span>
                    </div>
                    <p>{item.reason || "Style consistency rewrite."}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="explain-lab-card">
            <div className="consistency-section-title">Diff Blocks</div>
            {diff.length === 0 ? (
              <div className="consistency-empty">No diff blocks to display.</div>
            ) : (
              <div className="explain-scroll-list">
                {diff.slice(0, 120).map((block, index) => (
                  <div key={`${block.type}-${index}`} className="change-item">
                    <div className={`diff-badge ${block.type || "replace"}`}>{block.type || "replace"}</div>
                    {block.original ? <p>from: {block.original}</p> : null}
                    {block.new ? <p>to: {block.new}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "issues" ? (
        <div className="explain-lab-card">
          <div className="consistency-section-title">Issue Rationales</div>
          <div className="explain-filters">
            <label>
              Severity
              <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label>
              Category
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>{category === "all" ? "All" : category}</option>
                ))}
              </select>
            </label>
            <label className="query">
              Search
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find issue text..."
              />
            </label>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="consistency-empty">No issues match the selected filters.</div>
          ) : (
            <div className="explain-scroll-list">
              {filteredIssues.slice(0, 140).map((issue, index) => (
                <div key={`${issue.category}-${index}`} className={`issue-row ${issue.severity}`}>
                  <div className="issue-row-head">
                    <span className="issue-category">{issue.category}</span>
                    <span className="issue-sev">{issue.severity.toUpperCase()}</span>
                  </div>
                  <div className="issue-row-msg">{issue.message}</div>
                  {issue.suggestion ? <div className="issue-row-tip">Suggestion: {issue.suggestion}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Card({ label, value, tone = "default" }) {
  return (
    <div className={`explain-card ${tone}`}>
      <div className="explain-card-label">{label}</div>
      <div className="explain-card-value">{value}</div>
    </div>
  );
}

function normalizeIssues(list) {
  if (!Array.isArray(list)) return [];
  return list.map((issue) => {
    const severity = normalizeSeverity(issue?.severity);
    return {
      ...issue,
      category: String(issue?.category || issue?.type || "General"),
      severity,
      message: String(issue?.message || issue?.issue || issue?.reason || "Issue detected."),
      suggestion: issue?.suggestion || "",
    };
  });
}

function normalizeSeverity(value) {
  const severity = String(value || "low").toLowerCase();
  if (severity === "high" || severity === "medium" || severity === "low") return severity;
  return "low";
}

function buildLogicModules(result, styleResult) {
  const readability = Number(result?.readability_score || 0);
  const similarity = Number(result?.avg_similarity || 0);
  const contradictionCount = (result?.character_issues || []).length;
  const consistencyCount = (result?.consistency_issues || []).length;
  const structureCount = (result?.structure_issues || []).length;
  const pacingCount = (result?.pacing_suggestions || []).length;
  const dialogueCount = (result?.dialogue_issues || []).length;
  const genreDriftCount = (result?.genre_drift_issues || []).length;
  const arcIssueCount = (result?.arc_issues || []).length;
  const styleChanges = Number(styleResult?.num_changes || 0);

  const healthFromIssueCount = (count, ceiling = 10) => Math.max(20, 100 - Math.min(count, ceiling) * (70 / ceiling));

  return [
    {
      name: "Character Engine",
      metric: `${contradictionCount} contradiction signals`,
      detail: `${(result?.character_graph_nodes || []).length} character nodes mapped`,
      health: Math.round(healthFromIssueCount(contradictionCount, 8)),
    },
    {
      name: "Consistency Engine",
      metric: `${consistencyCount} drift flags`,
      detail: `Average semantic continuity ${similarity.toFixed(2)}`,
      health: Math.round(healthFromIssueCount(consistencyCount, 14) * clamp01(similarity + 0.35)),
    },
    {
      name: "Structure Engine",
      metric: `${structureCount} structural flags`,
      detail: `Readability ${readability.toFixed(0)}/100`,
      health: Math.round(healthFromIssueCount(structureCount, 14) * clamp01((readability + 15) / 100)),
    },
    {
      name: "Pacing Engine",
      metric: `${pacingCount} pacing suggestions`,
      detail: `${(result?.pacing || []).length} pacing datapoints`,
      health: Math.round(healthFromIssueCount(pacingCount, 12)),
    },
    {
      name: "Dialogue Engine",
      metric: `${dialogueCount} dialogue drifts`,
      detail: `${Object.keys(result?.dialogue_profiles || {}).length} speaker fingerprints`,
      health: Math.round(healthFromIssueCount(dialogueCount, 10)),
    },
    {
      name: "Genre Engine",
      metric: `${genreDriftCount} genre drifts`,
      detail: `Dominant genre: ${result?.dominant_genre || "unknown"}`,
      health: Math.round(healthFromIssueCount(genreDriftCount, 10)),
    },
    {
      name: "Arc Engine",
      metric: `${arcIssueCount} arc risks`,
      detail: `${(result?.arc_curve || []).length} mapped arc nodes`,
      health: Math.round(healthFromIssueCount(arcIssueCount, 10)),
    },
    {
      name: "Style Transformer",
      metric: `${styleChanges} rewrite actions`,
      detail: styleResult?.style ? `Target style: ${styleResult.style}` : "No style profile selected",
      health: styleChanges > 0 ? 82 : 64,
    },
  ].map((module) => ({ ...module, health: Math.max(12, Math.min(99, module.health)) }));
}

function buildDecisionNarrative(result, styleResult, issues, modules) {
  const lines = [];
  lines.push(`Document was analyzed through ${modules.length} deterministic engines with layered outputs.`);
  lines.push(`Style objective resolved as "${styleResult?.style || "n/a"}" with ${styleResult?.num_changes || 0} tracked rewrites.`);
  lines.push(`Readability scored ${Number(result?.readability_score || 0).toFixed(0)}/100 from structural diagnostics.`);
  lines.push(`Consistency layer flagged ${(result?.consistency_issues || []).length} shifts at avg similarity ${Number(result?.avg_similarity || 0).toFixed(2)}.`);
  lines.push(`Narrative arc map contains ${(result?.arc_map || []).length} phase checkpoints and ${(result?.arc_issues || []).length} arc risks.`);
  const weakModules = modules.filter((module) => module.health < 60).map((module) => module.name);
  if (weakModules.length > 0) {
    lines.push(`Lowest confidence modules: ${weakModules.join(", ")}. Prioritize their suggestions first.`);
  } else {
    lines.push("No low-confidence module detected; recommendation quality is broadly balanced.");
  }
  const actionableCoverage = issues.length
    ? Math.round((issues.filter((issue) => Boolean(issue.suggestion)).length / issues.length) * 100)
    : 100;
  lines.push(`Actionable suggestion coverage: ${actionableCoverage}% of issue rationales include explicit fixes.`);
  return lines;
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
