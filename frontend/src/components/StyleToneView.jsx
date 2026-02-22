import { useMemo, useState } from "react";
import VibeGraph from "./VibeGraph";
import GenreView from "./GenreView";
import DialogueView from "./DialogueView";
import EmotionalFlowAnalyzer from "./EmotionalFlowAnalyzer";

const PANELS = [
  { id: "overview", label: "Overview" },
  { id: "emotion", label: "Emotional Flow" },
  { id: "vibe", label: "Vibe Graph" },
  { id: "genre", label: "Genre Profile" },
  { id: "dialogue", label: "Dialogue Voice" },
];

const SCOPE_OPTIONS = [
  { id: "all", label: "Entire Draft" },
  { id: "opening", label: "Opening Third" },
  { id: "middle", label: "Middle Third" },
  { id: "ending", label: "Ending Third" },
];

export default function StyleToneView({ result }) {
  const [activePanel, setActivePanel] = useState("overview");
  const [scope, setScope] = useState("all");

  const paragraphCount = useMemo(() => inferParagraphCount(result), [result]);
  const range = useMemo(() => toScopeRange(scope, paragraphCount), [scope, paragraphCount]);

  const scoped = useMemo(() => {
    const pacing = filterByParagraph(result?.pacing || [], range, (row) => Number(row?.paragraph));
    const genreRows = filterByParagraph(result?.genre_per_paragraph || [], range, (row) => Number(row?.paragraph));
    const driftIssues = filterByParagraph(result?.genre_drift_issues || [], range, (row) => Number(row?.paragraph));
    const emotionalArc = scopeEmotionalArc(result?.emotional_arc, range);
    const dominantGenre = inferDominantGenre(genreRows, result?.dominant_genre || "neutral");
    const topGenres = deriveTopGenres(genreRows, result?.top_genres || []);
    const genreColor = genreRows.find((row) => row.top_genre === dominantGenre)?.color || result?.genre_color || "#64748b";
    return {
      pacing,
      genreRows,
      driftIssues,
      emotionalArc,
      dominantGenre,
      topGenres,
      genreColor,
    };
  }, [result, range]);

  const styleMetrics = useMemo(() => buildStyleMetrics(result), [result]);
  const styleGuidance = useMemo(() => buildStyleGuidance(result), [result]);
  const emotionSnapshot = useMemo(
    () => summarizeEmotion(scoped.emotionalArc, scoped.pacing),
    [scoped.emotionalArc, scoped.pacing],
  );

  return (
    <div className="style-lab-page">
      <div className="style-lab-hero">
        <div>
          <h2>Style & Tone Lab</h2>
          <p>
            Calibrate voice, emotional rhythm, and genre consistency with section-level insights that update from your latest analysis.
          </p>
        </div>
        <div className="style-lab-scope">
          <label htmlFor="style-scope">Scope</label>
          <select id="style-scope" value={scope} onChange={(event) => setScope(event.target.value)}>
            {SCOPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="style-lab-tabs">
        {PANELS.map((panel) => (
          <button
            key={panel.id}
            type="button"
            className={`style-lab-tab ${activePanel === panel.id ? "active" : ""}`}
            onClick={() => setActivePanel(panel.id)}
          >
            {panel.label}
          </button>
        ))}
      </div>

      {activePanel === "overview" ? (
        <div className="style-overview">
          <section className="style-overview-card">
            <div className="consistency-section-title">Style Diagnostics</div>
            <div className="style-overview-metrics">
              {styleMetrics.map((metric) => (
                <div key={metric.key} className="style-overview-metric">
                  <div className="style-overview-metric-head">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                  <div className="style-overview-track">
                    <div style={{ width: `${metric.pct}%`, background: metric.color }} />
                  </div>
                  <p>{metric.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="style-overview-card">
            <div className="consistency-section-title">Tone Guidance</div>
            <div className="style-guidance-list">
              {styleGuidance.map((item, index) => (
                <div key={index} className="style-guidance-item">
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="style-overview-card">
            <div className="consistency-section-title">Emotional Snapshot</div>
            <div className="style-emotion-snapshot">
              <Metric label="Arc Shape" value={emotionSnapshot.arcShape} />
              <Metric label="Avg Intensity" value={`${emotionSnapshot.average.toFixed(2)}/10`} />
              <Metric label="Peak Paragraph" value={emotionSnapshot.peakParagraph ? `P${emotionSnapshot.peakParagraph}` : "-"} />
              <Metric label="Flat Zones" value={emotionSnapshot.flatZones} />
            </div>
            <button
              type="button"
              className="btn-ghost style-open-emotion"
              onClick={() => setActivePanel("emotion")}
            >
              Open Emotional Flow Analyzer
            </button>
          </section>
        </div>
      ) : null}

      {activePanel === "emotion" ? (
        <EmotionalFlowAnalyzer emotionalArc={scoped.emotionalArc} pacing={scoped.pacing} />
      ) : null}

      {activePanel === "vibe" ? (
        <VibeGraph
          pacing={scoped.pacing}
          genreRows={scoped.genreRows}
          driftIssues={scoped.driftIssues}
        />
      ) : null}

      {activePanel === "genre" ? (
        <GenreView
          dominantGenre={scoped.dominantGenre}
          genreColor={scoped.genreColor}
          perParagraph={scoped.genreRows}
          topGenres={scoped.topGenres}
          driftIssues={scoped.driftIssues}
        />
      ) : null}

      {activePanel === "dialogue" ? (
        <DialogueView
          profiles={result?.dialogue_profiles || {}}
          issues={result?.dialogue_issues || []}
          dialogueMap={result?.dialogue_map || {}}
        />
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
  (result?.genre_per_paragraph || []).forEach((row, index) => values.push(normalizeParagraph(row?.paragraph, index + 1, false)));
  const timeline = Array.isArray(result?.emotional_arc?.emotion_timeline) ? result.emotional_arc.emotion_timeline : [];
  const baseZero = timeline.some((row) => Number(row?.paragraph) === 0);
  timeline.forEach((row, index) => values.push(normalizeParagraph(row?.paragraph, index + 1, baseZero)));
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

function scopeEmotionalArc(emotionalArc, range) {
  if (!emotionalArc || typeof emotionalArc !== "object") return null;
  const timeline = Array.isArray(emotionalArc.emotion_timeline) ? emotionalArc.emotion_timeline : [];
  if (timeline.length === 0) return emotionalArc;

  const baseZero = timeline.some((row) => Number(row?.paragraph) === 0);
  const selected = timeline
    .map((row, index) => ({ row, index, paragraph: normalizeParagraph(row?.paragraph, index + 1, baseZero) }))
    .filter((entry) => entry.paragraph >= range.start && entry.paragraph <= range.end);

  const scoring = Array.isArray(emotionalArc.pacing_scores) ? emotionalArc.pacing_scores : [];
  const flatZones = Array.isArray(emotionalArc.flat_zones) ? emotionalArc.flat_zones : [];

  return {
    ...emotionalArc,
    emotion_timeline: selected.map((entry) => entry.row),
    pacing_scores: selected.map((entry) => scoring[entry.index]).filter((value) => Number.isFinite(Number(value))),
    flat_zones: flatZones.filter((zone) => zoneOverlapsRange(zone, range)),
  };
}

function zoneOverlapsRange(zone, range) {
  const paragraphs = Array.isArray(zone?.paragraphs) ? zone.paragraphs : [];
  const numeric = paragraphs.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (!numeric.length) return false;
  const baseZero = numeric.some((value) => value === 0);
  return numeric.some((value) => {
    const paragraph = baseZero ? value + 1 : value;
    return paragraph >= range.start && paragraph <= range.end;
  });
}

function inferDominantGenre(rows, fallback) {
  if (!Array.isArray(rows) || rows.length === 0) return fallback || "neutral";
  const counts = rows.reduce((acc, row) => {
    const genre = row?.top_genre || row?.genre || "neutral";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || fallback || "neutral";
}

function deriveTopGenres(rows, fallback) {
  const fromRows = Array.from(
    new Set((rows || []).map((row) => row?.top_genre || row?.genre).filter(Boolean)),
  );
  if (fromRows.length > 0) return fromRows.slice(0, 4);
  return Array.isArray(fallback) ? fallback.slice(0, 4) : [];
}

function normalizeParagraph(value, fallback, isZeroBased) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (isZeroBased) return Math.max(1, Math.round(parsed) + 1);
  return Math.max(1, Math.round(parsed));
}

function buildStyleMetrics(result) {
  const fp = result?.style_fingerprint || {};
  const readability = clamp01((Number(result?.readability_score || 0) || 0) / 100);
  const sentenceMean = Number(fp?.sentence_length_mean || 0);
  const passive = clamp01(Number(fp?.passive_voice_ratio || 0));
  const dialogue = clamp01(Number(fp?.dialogue_percentage || 0));
  const complexity = clamp01(Number(fp?.vocabulary_complexity || 0));
  const adverbRate = clamp01(Number(fp?.adverb_usage_rate || 0) * 15);
  const rewrites = Number(result?.style_result?.num_changes || 0);

  return [
    {
      key: "readability",
      label: "Readability",
      value: `${Math.round(readability * 100)}/100`,
      pct: Math.round(readability * 100),
      color: "var(--brand-primary)",
      note: "Higher means easier to scan quickly while retaining nuance.",
    },
    {
      key: "sentence",
      label: "Sentence Rhythm",
      value: sentenceMean ? `${sentenceMean.toFixed(1)} words` : "N/A",
      pct: Math.round(clamp01(sentenceMean / 24) * 100),
      color: "var(--accent-orange)",
      note: "Balanced rhythm usually sits between 12 and 22 words per sentence.",
    },
    {
      key: "passive",
      label: "Passive Voice",
      value: `${Math.round(passive * 100)}%`,
      pct: Math.round(passive * 100),
      color: "var(--red)",
      note: "High passive ratio can reduce urgency in dramatic scenes.",
    },
    {
      key: "dialogue",
      label: "Dialogue Share",
      value: `${Math.round(dialogue * 100)}%`,
      pct: Math.round(dialogue * 100),
      color: "var(--accent-green)",
      note: "Tracks spoken lines against narration for voice balance.",
    },
    {
      key: "complexity",
      label: "Lexical Depth",
      value: `${Math.round(complexity * 100)}%`,
      pct: Math.round(complexity * 100),
      color: "#2563eb",
      note: "Vocabulary complexity indicates sophistication and difficulty.",
    },
    {
      key: "style",
      label: "Style Rewrites",
      value: `${rewrites}`,
      pct: Math.min(100, rewrites * 8),
      color: "#7c3aed",
      note: "How many line-level style interventions were identified.",
    },
    {
      key: "adverb",
      label: "Adverb Density",
      value: `${(Number(fp?.adverb_usage_rate || 0) * 100).toFixed(1)}%`,
      pct: Math.round(adverbRate * 100),
      color: "#0f766e",
      note: "Lower density often produces sharper prose and stronger verbs.",
    },
  ];
}

function buildStyleGuidance(result) {
  const fp = result?.style_fingerprint || {};
  const suggestions = [];

  if (Number(fp.passive_voice_ratio || 0) > 0.2) {
    suggestions.push({
      title: "Reduce Passive Voice",
      copy: "Convert key lines to active voice in high-stakes scenes to sharpen momentum.",
    });
  }

  if (Number(fp.adverb_usage_rate || 0) > 0.03) {
    suggestions.push({
      title: "Trim Adverbs",
      copy: "Replace adverb-heavy lines with stronger verbs for more precise character voice.",
    });
  }

  if (Number(fp.dialogue_percentage || 0) < 0.08) {
    suggestions.push({
      title: "Increase Dialogue Presence",
      copy: "Add short exchanges in emotional beats so character tone is shown, not only narrated.",
    });
  }

  if (Number(fp.vocabulary_complexity || 0) > 0.78) {
    suggestions.push({
      title: "Simplify Dense Segments",
      copy: "Break dense wording in exposition-heavy passages to improve readability and retention.",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: "Tone Is Balanced",
      copy: "Current style metrics are stable. Focus revisions on scene-level emotional pacing and genre drift.",
    });
  }

  return suggestions.slice(0, 4);
}

function summarizeEmotion(emotionalArc, pacing) {
  const timeline = Array.isArray(emotionalArc?.emotion_timeline) ? emotionalArc.emotion_timeline : [];
  if (timeline.length > 0) {
    const baseZero = timeline.some((row) => Number(row?.paragraph) === 0);
    const points = timeline.map((row, index) => {
      const paragraph = normalizeParagraph(row?.paragraph, index + 1, baseZero);
      const emotions = row?.emotions && typeof row.emotions === "object" ? row.emotions : {};
      const intensityRaw = Number(row?.intensity);
      const inferred = Number.isFinite(intensityRaw)
        ? clamp01(intensityRaw)
        : clamp01(Math.max(...Object.values(emotions).map((value) => Number(value) || 0), 0));
      return { paragraph, intensity: inferred * 10 };
    });
    const average = points.reduce((sum, point) => sum + point.intensity, 0) / Math.max(points.length, 1);
    const peak = points.reduce((best, point) => (point.intensity > best.intensity ? point : best), points[0]);
    return {
      arcShape: toTitle(emotionalArc?.arc_shape || "steady"),
      average,
      peakParagraph: peak?.paragraph || null,
      flatZones: Array.isArray(emotionalArc?.flat_zones) ? emotionalArc.flat_zones.length : 0,
    };
  }

  if (Array.isArray(pacing) && pacing.length > 0) {
    const average = pacing.reduce((sum, row) => sum + Number(row?.emotion_score || 0), 0) / pacing.length;
    const peak = pacing.reduce((best, row) => (Number(row?.emotion_score || 0) > Number(best?.emotion_score || 0) ? row : best), pacing[0]);
    return {
      arcShape: "Derived",
      average,
      peakParagraph: peak?.paragraph || null,
      flatZones: 0,
    };
  }

  return {
    arcShape: "Unknown",
    average: 0,
    peakParagraph: null,
    flatZones: 0,
  };
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function toTitle(text) {
  return String(text || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
