import { useMemo, useState } from "react";
import CharacterUniverse from "./CharacterUniverse";
import CharacterTimeline from "./CharacterTimeline";
import PacingWave from "./PacingWave";
import PlotArcView from "./PlotArcView";

const STORY_TABS = [
  { id: "overview", label: "Overview" },
  { id: "pacing", label: "Pacing & Flow" },
  { id: "arc", label: "Story Arc" },
  { id: "universe", label: "Character Universe" },
  { id: "timeline", label: "Character Timeline" },
];

const STORY_SCOPE = [
  { id: "all", label: "Entire Draft" },
  { id: "opening", label: "Opening Third" },
  { id: "middle", label: "Middle Third" },
  { id: "ending", label: "Ending Third" },
];

export default function StoryWorldView({ result }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [scope, setScope] = useState("all");

  const paragraphCount = useMemo(() => inferParagraphCount(result), [result]);
  const scopeRange = useMemo(() => toScopeRange(scope, paragraphCount), [scope, paragraphCount]);

  const scoped = useMemo(() => {
    const pacing = filterByParagraph(result?.pacing || [], scopeRange, (row) => row?.paragraph);
    const arcCurve = filterByParagraph(result?.arc_curve || [], scopeRange, (row) => row?.paragraph);
    const arcMap = filterByParagraph(result?.arc_map || [], scopeRange, (row) => row?.paragraph);
    const arcIssues = filterArcIssues(result?.arc_issues || [], scopeRange);

    const phaseCounts = arcCurve.reduce((acc, row) => {
      const phase = row?.phase || "Unknown";
      acc[phase] = (acc[phase] || 0) + 1;
      return acc;
    }, {});

    const characterGraph = scopeCharacterGraph(
      result?.character_graph_nodes || [],
      result?.character_graph_edges || [],
      result?.character_issues || [],
      scopeRange,
    );

    return {
      pacing,
      pacingSuggestions: result?.pacing_suggestions || [],
      arcCurve,
      arcMap,
      arcIssues,
      phaseCounts,
      phaseColors: result?.phase_colors || {},
      characterGraph,
      characterTimeline: scopeCharacterTimeline(result?.character_timeline, scopeRange),
    };
  }, [result, scopeRange]);

  const summary = useMemo(() => buildStorySummary(scoped, result), [scoped, result]);

  return (
    <div className="story-lab-page">
      <div className="story-lab-hero">
        <div>
          <h2>Story Arc Studio</h2>
          <p>
            Inspect narrative momentum, arc phase progression, and character presence with scoped diagnostics.
          </p>
        </div>
        <div className="story-lab-controls">
          <label htmlFor="story-scope">Scope</label>
          <select id="story-scope" value={scope} onChange={(event) => setScope(event.target.value)}>
            {STORY_SCOPE.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="story-lab-tabs">
        {STORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`story-lab-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="story-overview-grid">
          <section className="story-card">
            <div className="consistency-section-title">Arc Health</div>
            <div className="story-metric-grid">
              <Metric label="Arc Health" value={summary.arcHealthLabel} />
              <Metric label="Avg Pacing" value={summary.avgPacing.toFixed(2)} />
              <Metric label="High Tension" value={summary.highTensionCount} />
              <Metric label="Arc Issues" value={summary.arcIssueCount} />
              <Metric label="Phase Coverage" value={`${summary.phaseCoverage}/5`} />
              <Metric label="Active Characters" value={summary.activeCharacters} />
            </div>
          </section>

          <section className="story-card">
            <div className="consistency-section-title">Phase Progression</div>
            {scoped.arcMap.length === 0 ? (
              <div className="consistency-empty">No arc map data available for this scope.</div>
            ) : (
              <div className="story-phase-ribbon">
                {scoped.arcMap.slice(0, 60).map((entry, index) => (
                  <div
                    key={`${entry.phase}-${index}-${entry.paragraph}`}
                    className="story-phase-cell"
                    style={{
                      borderColor: `${scoped.phaseColors[entry.phase] || "#64748b"}66`,
                      background: `${scoped.phaseColors[entry.phase] || "#64748b"}22`,
                    }}
                    title={`Paragraph ${entry.paragraph} - ${entry.phase}`}
                  >
                    <span>P{entry.paragraph}</span>
                    <strong>{entry.phase}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="story-card">
            <div className="consistency-section-title">Current Risks</div>
            {scoped.arcIssues.length === 0 ? (
              <div className="consistency-empty">No arc risks detected in the selected scope.</div>
            ) : (
              <div className="story-risk-list">
                {scoped.arcIssues.slice(0, 12).map((issue, index) => (
                  <div key={index} className={`story-risk-item ${String(issue?.severity || "medium").toLowerCase()}`}>
                    <div className="story-risk-head">
                      <span>{issue?.category || "Arc"}</span>
                      <strong>{String(issue?.severity || "medium").toUpperCase()}</strong>
                    </div>
                    <p>{issue?.message || issue?.issue || "Narrative arc issue detected."}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "pacing" ? (
        <div className="story-tab-panel">
          <PacingWave pacing={scoped.pacing} suggestions={scoped.pacingSuggestions} />
        </div>
      ) : null}

      {activeTab === "arc" ? (
        <div className="story-tab-panel">
          <PlotArcView
            arcCurve={scoped.arcCurve}
            arcMap={scoped.arcMap}
            phaseCounts={scoped.phaseCounts}
            phaseColors={scoped.phaseColors}
            issues={scoped.arcIssues}
          />
        </div>
      ) : null}

      {activeTab === "universe" ? (
        <div className="story-tab-panel story-character-panel">
          <CharacterUniverse
            nodes={scoped.characterGraph.nodes}
            edges={scoped.characterGraph.edges}
            issues={scoped.characterGraph.issues}
          />
        </div>
      ) : null}

      {activeTab === "timeline" ? (
        <div className="story-tab-panel">
          <CharacterTimeline
            timelineData={scoped.characterTimeline}
            phaseColors={scoped.phaseColors}
          />
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="consistency-metric-card">
      <div className="consistency-metric-label">{label}</div>
      <div className="consistency-metric-value">{value}</div>
    </div>
  );
}

function inferParagraphCount(result) {
  const values = [];
  (result?.pacing || []).forEach((row, index) => values.push(normalizeParagraph(row?.paragraph, index + 1, false)));
  (result?.arc_curve || []).forEach((row, index) => values.push(normalizeParagraph(row?.paragraph, index + 1, false)));
  (result?.arc_map || []).forEach((row, index) => values.push(normalizeParagraph(row?.paragraph, index + 1, false)));
  return Math.max(1, ...values, 1);
}

function toScopeRange(scope, paragraphCount) {
  const total = Math.max(1, Number(paragraphCount) || 1);
  if (scope === "opening") {
    return { start: 1, end: Math.max(1, Math.ceil(total / 3)) };
  }
  if (scope === "middle") {
    const start = Math.max(1, Math.floor(total / 3) + 1);
    const end = Math.max(start, Math.ceil((total * 2) / 3));
    return { start, end };
  }
  if (scope === "ending") {
    const start = Math.min(total, Math.max(1, Math.ceil((total * 2) / 3) + (total > 1 ? 1 : 0)));
    return { start, end: total };
  }
  return { start: 1, end: total };
}

function filterByParagraph(items, range, getParagraph) {
  if (!Array.isArray(items)) return [];
  return items.filter((item, index) => {
    const paragraph = normalizeParagraph(getParagraph(item, index), index + 1, false);
    return paragraph >= range.start && paragraph <= range.end;
  });
}

function filterArcIssues(issues, range) {
  if (!Array.isArray(issues)) return [];
  return issues.filter((issue) => {
    const candidates = [
      issue?.paragraph,
      issue?.location?.paragraph,
      issue?.location?.paragraphA,
      issue?.location?.paragraphB,
      issue?.location?.start_paragraph,
      issue?.location?.end_paragraph,
    ].filter((value) => Number.isFinite(Number(value)));
    const message = String(issue?.message || issue?.issue || "");
    const matches = [...message.matchAll(/paragraph\s+(\d+)/gi)].map((entry) => Number(entry[1]));
    const all = [...candidates, ...matches].map((value) => normalizeParagraph(value, 1, false));
    if (all.length === 0) return true;
    return all.some((paragraph) => paragraph >= range.start && paragraph <= range.end);
  });
}

function scopeCharacterGraph(nodes, edges, issues, range) {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];
  const safeIssues = Array.isArray(issues) ? issues : [];
  if (safeNodes.length === 0) {
    return { nodes: [], edges: [], issues: safeIssues };
  }

  const scopedNodes = safeNodes
    .map((node) => {
      const paragraphs = Array.isArray(node?.paragraphs)
        ? node.paragraphs
          .map((value) => normalizeParagraph(value, 1, false))
          .filter((paragraph) => paragraph >= range.start && paragraph <= range.end)
        : [];
      const appearances = paragraphs.length || Number(node?.appearances || 0);
      return {
        ...node,
        paragraphs,
        appearances,
        val: Math.max(3, appearances * 3),
      };
    })
    .filter((node) => node.paragraphs.length > 0 || !Array.isArray(node?.paragraphs) || node.paragraphs.length === 0);

  const nodeIds = new Set(scopedNodes.map((node) => node.id));
  const scopedEdges = safeEdges.filter((edge) => nodeIds.has(edge?.source) && nodeIds.has(edge?.target));

  return {
    nodes: scopedNodes,
    edges: scopedEdges,
    issues: safeIssues,
  };
}

function scopeCharacterTimeline(timelineData, range) {
  if (!timelineData || typeof timelineData !== "object") return timelineData;
  const rows = Array.isArray(timelineData.rows) ? timelineData.rows : [];
  const scopedRows = rows
    .map((row) => {
      const appearances = Array.isArray(row?.appearances)
        ? row.appearances
          .map((value) => normalizeParagraph(value, 1, false))
          .filter((paragraph) => paragraph >= range.start && paragraph <= range.end)
        : [];
      if (appearances.length === 0) return null;
      const first = appearances[0];
      const last = appearances[appearances.length - 1];
      return {
        ...row,
        appearances,
        appearance_count: appearances.length,
        first_appearance: first,
        last_appearance: last,
        coverage_ratio: Number((appearances.length / Math.max(range.end - range.start + 1, 1)).toFixed(2)),
      };
    })
    .filter(Boolean);

  const scopedBands = (Array.isArray(timelineData.arc_bands) ? timelineData.arc_bands : [])
    .filter((entry) => {
      const paragraph = normalizeParagraph(entry?.paragraph, 1, false);
      return paragraph >= range.start && paragraph <= range.end;
    });

  return {
    ...timelineData,
    rows: scopedRows,
    predictions: scopedRows.map((row) => ({
      character: row.character,
      last_seen: row.last_appearance,
      next_predicted: Math.min(range.end, row.last_appearance + 1),
      reason: "Scoped from selected draft range.",
      warning: "",
      arc_obligation: row.role === "Main Character" ? "Keep active in upcoming arc beats." : "",
    })),
    arc_bands: scopedBands,
    total_paragraphs: Math.max(range.end - range.start + 1, 1),
  };
}

function buildStorySummary(scoped, result) {
  const pacingRows = Array.isArray(scoped?.pacing) ? scoped.pacing : [];
  const avgPacing = pacingRows.length
    ? pacingRows.reduce((sum, row) => sum + Number(row?.pacing_score || 0), 0) / pacingRows.length
    : 0;
  const highTensionCount = pacingRows.filter((row) => Number(row?.pacing_score || 0) >= 7).length;
  const arcIssueCount = Array.isArray(scoped?.arcIssues) ? scoped.arcIssues.length : 0;
  const phaseCoverage = Object.keys(scoped?.phaseCounts || {}).length;
  const activeCharacters = Array.isArray(scoped?.characterGraph?.nodes) ? scoped.characterGraph.nodes.length : 0;
  const totalCharacters = Array.isArray(result?.character_graph_nodes) ? result.character_graph_nodes.length : activeCharacters;

  const arcHealthLabel =
    arcIssueCount === 0 && phaseCoverage >= 4
      ? "Strong"
      : arcIssueCount <= 2 && phaseCoverage >= 3
        ? "Stable"
        : "Needs Tuning";

  return {
    avgPacing,
    highTensionCount,
    arcIssueCount,
    phaseCoverage,
    activeCharacters: `${activeCharacters}/${Math.max(totalCharacters, activeCharacters)}`,
    arcHealthLabel,
  };
}

function normalizeParagraph(value, fallback, isZeroBased) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (isZeroBased) return Math.max(1, Math.round(parsed) + 1);
  return Math.max(1, Math.round(parsed));
}
