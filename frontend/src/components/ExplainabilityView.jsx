import { useMemo, useState } from "react";

export default function ExplainabilityView({ result }) {
  const [copied, setCopied] = useState(false);
  const styleResult = result?.style_result || {};
  const report = result?.report || {};
  const changeLog = styleResult.change_log || [];
  const diff = styleResult.diff || [];
  const issues = report.all_issues || [];
  const logicModules = useMemo(
    () => [
      {
        name: "Character Graph",
        metric: `${(result?.character_issues || []).length} contradictions`,
        detail: `${(result?.character_graph_nodes || []).length} characters mapped`,
      },
      {
        name: "Semantic Consistency",
        metric: `${(result?.consistency_issues || []).length} shifts`,
        detail: `avg similarity ${Number(result?.avg_similarity || 0).toFixed(2)}`,
      },
      {
        name: "Structure Analyzer",
        metric: `${(result?.structure_issues || []).length} structure issues`,
        detail: `readability ${Number(result?.readability_score || 0).toFixed(0)}/100`,
      },
      {
        name: "Show vs Tell",
        metric: `${(result?.show_dont_tell_issues || []).length} flags`,
        detail: "rule-based clarity detector",
      },
      {
        name: "Pacing Analyzer",
        metric: `${(result?.pacing_suggestions || []).length} pacing suggestions`,
        detail: `${(result?.pacing || []).length} paragraph pacing scores`,
      },
      {
        name: "Dialogue Voice",
        metric: `${(result?.dialogue_issues || []).length} drift alerts`,
        detail: `${Object.keys(result?.dialogue_profiles || {}).length} speaker profiles`,
      },
      {
        name: "Genre Detector",
        metric: `${(result?.genre_drift_issues || []).length} drift points`,
        detail: `dominant ${result?.dominant_genre || "unknown"}`,
      },
      {
        name: "Plot Arc",
        metric: `${(result?.arc_issues || []).length} arc issues`,
        detail: `${(result?.arc_curve || []).length} arc phases mapped`,
      },
      {
        name: "Style Transformer",
        metric: `${styleResult.num_changes || 0} edits`,
        detail: styleResult.style || "n/a",
      },
    ],
    [result, styleResult],
  );

  const severitySummary = useMemo(
    () => ({
      high: report.high_severity || 0,
      medium: report.medium_severity || 0,
      low: report.low_severity || 0,
    }),
    [report],
  );

  const summaryText = useMemo(() => {
    const lines = [
      `Style selected: ${styleResult.style || "n/a"}`,
      `Style changes applied: ${styleResult.num_changes || 0}`,
      `Readability score: ${Number(result?.readability_score || 0).toFixed(0)}/100`,
      `Total issues: ${report.total_issues || 0}`,
      `High/Medium/Low: ${severitySummary.high}/${severitySummary.medium}/${severitySummary.low}`,
    ];
    return lines.join("\n");
  }, [styleResult, result, report, severitySummary]);

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
      summary: {
        style: styleResult.style || "n/a",
        style_changes: styleResult.num_changes || 0,
        readability: Number(result?.readability_score || 0).toFixed(0),
        total_issues: report.total_issues || 0,
        severity: severitySummary,
      },
      style_change_log: changeLog,
      diff_blocks: diff,
      issues,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "explainability-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pacing-container">
      <div className="pacing-header">
        Explainability <span>Center</span>
      </div>

      <div className="pacing-chart-wrap explain-wrap">
        <section className="explain-panel">
          <div className="pane-label">Analysis Logic Trace</div>
          <div className="logic-grid">
            {logicModules.map((module) => (
              <div key={module.name} className="logic-card">
                <div className="logic-name">{module.name}</div>
                <div className="logic-metric">{module.metric}</div>
                <div className="logic-detail">{module.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="explain-top">
          <div className="explain-grid">
            <Card label="Style" value={styleResult.style || "n/a"} />
            <Card label="Style Changes" value={styleResult.num_changes || 0} />
            <Card label="Readability" value={`${Number(result?.readability_score || 0).toFixed(0)}/100`} />
            <Card label="Total Issues" value={report.total_issues || 0} />
            <Card label="High" value={severitySummary.high} tone="high" />
            <Card label="Medium" value={severitySummary.medium} tone="medium" />
            <Card label="Low" value={severitySummary.low} tone="low" />
          </div>

          <div className="explain-actions">
            <button type="button" className="btn-ghost" onClick={handleCopySummary}>
              {copied ? "Copied" : "Copy Summary"}
            </button>
            <button type="button" className="btn-primary" onClick={handleDownloadJson}>
              Download JSON
            </button>
          </div>
        </div>

        <div className="explain-columns">
          <section className="explain-panel">
            <div className="pane-label">What Changed (Style Rules)</div>
            {changeLog.length === 0 && <div className="explain-empty">No style replacements were applied.</div>}
            {changeLog.length > 0 && (
              <div className="explain-list">
                {changeLog.slice(0, 60).map((item, idx) => (
                  <div key={`${item.original}-${idx}`} className="explain-item">
                    <div className="explain-item-head">
                      <span className="explain-token old">{item.original}</span>
                      <span className="explain-arrow">{"->"}</span>
                      <span className="explain-token new">{item.replacement}</span>
                    </div>
                    <div className="explain-reason">{item.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="explain-panel">
            <div className="pane-label">Text Diff Blocks</div>
            {diff.length === 0 && <div className="explain-empty">No diff blocks to display.</div>}
            {diff.length > 0 && (
              <div className="explain-list">
                {diff.slice(0, 40).map((block, idx) => (
                  <div key={`${block.type}-${idx}`} className="explain-item">
                    <div className={`diff-badge ${block.type}`}>{block.type}</div>
                    {block.original && <div className="diff-line">from: {block.original}</div>}
                    {block.new && <div className="diff-line">to: {block.new}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="explain-panel">
          <div className="pane-label">Why It Matters (Issue Rationales)</div>
          {issues.length === 0 && <div className="explain-empty">No issues detected.</div>}
          {issues.length > 0 && (
            <div className="explain-list">
              {issues.slice(0, 24).map((issue, idx) => (
                <div key={`issue-${idx}`} className={`issue-row ${issue.severity || "low"}`}>
                  <div className="issue-row-head">
                    <span className="issue-category">{issue.category || "General"}</span>
                    <span className="issue-sev">{String(issue.severity || "low").toUpperCase()}</span>
                  </div>
                  <div className="issue-row-msg">{issue.message || issue.issue}</div>
                  {issue.suggestion && <div className="issue-row-tip">Suggestion: {issue.suggestion}</div>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
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
