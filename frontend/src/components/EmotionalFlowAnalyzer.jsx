import { useMemo, useState } from "react";

const MODES = {
  intensity: {
    label: "Emotional Intensity",
    key: "emotionScore",
    color: "var(--brand-primary)",
    fill: "rgba(14, 165, 165, 0.16)",
  },
  tension: {
    label: "Dramatic Tension",
    key: "tensionScore",
    color: "var(--accent-orange)",
    fill: "rgba(180, 83, 9, 0.16)",
  },
  pacing: {
    label: "Emotional Pacing",
    key: "pacingScore",
    color: "var(--accent-green)",
    fill: "rgba(21, 128, 61, 0.16)",
  },
};

const EMOTION_COLORS = {
  joy: "#f59e0b",
  sadness: "#3b82f6",
  anger: "#ef4444",
  fear: "#8b5cf6",
  surprise: "#06b6d4",
  disgust: "#84cc16",
  anticipation: "#f97316",
  trust: "#10b981",
  neutral: "#64748b",
};

export default function EmotionalFlowAnalyzer({ emotionalArc = null, pacing = [] }) {
  const [mode, setMode] = useState("intensity");
  const [smooth, setSmooth] = useState(true);

  const timeline = useMemo(() => buildTimeline(emotionalArc, pacing), [emotionalArc, pacing]);
  const modeConfig = MODES[mode] || MODES.intensity;

  const rawValues = useMemo(
    () => timeline.map((point) => clampScore(point[modeConfig.key])),
    [timeline, modeConfig.key],
  );
  const values = useMemo(
    () => (smooth ? movingAverage(rawValues, 3) : rawValues),
    [rawValues, smooth],
  );

  const points = useMemo(() => {
    if (!values.length) return [];
    const width = 980;
    const height = 260;
    const pad = { top: 20, right: 20, bottom: 38, left: 34 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    return values.map((value, index) => {
      const x = pad.left + (index / Math.max(values.length - 1, 1)) * chartW;
      const y = pad.top + chartH - (clampScore(value) / 10) * chartH;
      return { x, y };
    });
  }, [values]);

  const linePath = useMemo(() => toSmoothPath(points), [points]);
  const areaPath = useMemo(() => toAreaPath(points, 260, 38), [points]);

  const summary = useMemo(() => {
    if (!timeline.length) {
      return {
        arcShape: "Unknown",
        average: 0,
        volatility: 0,
        peakParagraph: null,
        flatZoneCount: 0,
      };
    }
    const average = timeline.reduce((sum, point) => sum + point.emotionScore, 0) / timeline.length;
    const deltas = timeline
      .slice(1)
      .map((point, idx) => Math.abs(point.emotionScore - timeline[idx].emotionScore));
    const volatility = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : 0;
    const peak = timeline.reduce((best, point) => (point.emotionScore > best.emotionScore ? point : best), timeline[0]);
    return {
      arcShape: toTitle(emotionalArc?.arc_shape || inferArcShape(timeline)),
      average: average.toFixed(2),
      volatility: volatility.toFixed(2),
      peakParagraph: peak.paragraph,
      flatZoneCount: Array.isArray(emotionalArc?.flat_zones) ? emotionalArc.flat_zones.length : 0,
    };
  }, [timeline, emotionalArc]);

  const distribution = useMemo(() => {
    const counts = timeline.reduce((acc, point) => {
      const key = point.dominantEmotion || "neutral";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const total = Math.max(timeline.length, 1);
    return Object.entries(counts)
      .map(([emotion, count]) => ({ emotion, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
  }, [timeline]);

  const flatZones = useMemo(() => normalizeFlatZones(emotionalArc?.flat_zones), [emotionalArc]);

  if (!timeline.length) {
    return (
      <div className="emotion-lab">
        <div className="consistency-empty">No emotional flow data yet. Analyze text with at least two paragraphs.</div>
      </div>
    );
  }

  return (
    <div className="emotion-lab">
      <div className="emotion-lab-head">
        <div>
          <div className="consistency-section-title">Emotional Flow Analyzer</div>
          <h3>{summary.arcShape} Arc</h3>
          <p>
            Tracks paragraph-level feeling shifts so tone changes stay intentional, not accidental.
          </p>
        </div>
        <div className="emotion-mode-tabs">
          {Object.entries(MODES).map(([id, info]) => (
            <button
              key={id}
              className={`emotion-mode-tab ${mode === id ? "active" : ""}`}
              type="button"
              onClick={() => setMode(id)}
            >
              {info.label}
            </button>
          ))}
        </div>
      </div>

      <div className="emotion-metrics">
        <Metric label="Arc Shape" value={summary.arcShape} />
        <Metric label="Avg Intensity" value={`${summary.average}/10`} />
        <Metric label="Peak Paragraph" value={summary.peakParagraph ? `P${summary.peakParagraph}` : "-"} />
        <Metric label="Volatility" value={summary.volatility} />
      </div>

      <div className="emotion-chart-shell">
        <div className="emotion-chart-toolbar">
          <div className="emotion-legend">
            <span className="emotion-dot" style={{ background: modeConfig.color }} />
            <span>{modeConfig.label}</span>
          </div>
          <label className="emotion-toggle">
            <input type="checkbox" checked={smooth} onChange={(event) => setSmooth(event.target.checked)} />
            Smooth line
          </label>
        </div>

        <svg viewBox="0 0 980 260" className="emotion-chart" preserveAspectRatio="none" role="img" aria-label="Emotional flow chart">
          {[0, 2, 4, 6, 8, 10].map((level) => {
            const y = 20 + (202 - (level / 10) * 202);
            return (
              <g key={level}>
                <line x1="34" x2="960" y1={y} y2={y} stroke="var(--border-light)" strokeWidth={level % 4 === 0 ? "1" : "0.6"} />
                <text x="26" y={y + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">{level}</text>
              </g>
            );
          })}

          {areaPath ? <path d={areaPath} fill={modeConfig.fill} /> : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke={modeConfig.color}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {timeline.map((point, index) => {
            const dot = points[index];
            if (!dot) return null;
            return (
              <g key={`${point.paragraph}-${index}`}>
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={4}
                  fill={EMOTION_COLORS[point.dominantEmotion] || EMOTION_COLORS.neutral}
                  stroke="var(--bg-main)"
                  strokeWidth="1.8"
                >
                  <title>
                    {`Paragraph ${point.paragraph} | ${point.dominantEmotion} | Intensity ${point.emotionScore.toFixed(2)} | Tension ${point.tensionScore.toFixed(2)}`}
                  </title>
                </circle>
                {timeline.length <= 22 ? (
                  <text x={dot.x} y="250" textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                    P{point.paragraph}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="emotion-bottom">
        <section className="emotion-card">
          <div className="consistency-section-title">Dominant Emotion Mix</div>
          {distribution.map((entry) => (
            <div key={entry.emotion} className="emotion-distribution-row">
              <div className="emotion-distribution-label">
                <span className="emotion-dot" style={{ background: EMOTION_COLORS[entry.emotion] || EMOTION_COLORS.neutral }} />
                <span>{toTitle(entry.emotion)}</span>
              </div>
              <div className="emotion-distribution-bar">
                <div style={{ width: `${entry.pct}%`, background: EMOTION_COLORS[entry.emotion] || EMOTION_COLORS.neutral }} />
              </div>
              <span className="emotion-distribution-pct">{entry.pct}%</span>
            </div>
          ))}
        </section>

        <section className="emotion-card">
          <div className="consistency-section-title">Flat Zones</div>
          {flatZones.length === 0 ? (
            <div className="consistency-empty">No prolonged flat emotional zones detected.</div>
          ) : (
            <div className="emotion-flat-list">
              {flatZones.map((zone, index) => (
                <div key={index} className="emotion-flat-item">
                  <div>
                    <strong>P{zone.start} to P{zone.end}</strong>
                    <p>{zone.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
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

function buildTimeline(emotionalArc, pacing) {
  const paceRows = Array.isArray(pacing) ? pacing : [];
  const paceByParagraph = new Map();
  paceRows.forEach((row, index) => {
    const paragraph = normalizeParagraph(row?.paragraph, index + 1, false);
    paceByParagraph.set(paragraph, row);
  });

  const timelineRows = Array.isArray(emotionalArc?.emotion_timeline) ? emotionalArc.emotion_timeline : [];
  if (timelineRows.length > 0) {
    const baseZero = timelineRows.some((row) => Number(row?.paragraph) === 0);
    const timeline = timelineRows.map((row, index) => {
      const paragraph = normalizeParagraph(row?.paragraph, index + 1, baseZero);
      const emotions = row?.emotions && typeof row.emotions === "object" ? row.emotions : {};
      const topEmotion = dominantEmotion(emotions);
      const intensityFromPayload = Number(row?.intensity);
      const intensity01 = Number.isFinite(intensityFromPayload)
        ? clamp01(intensityFromPayload)
        : clamp01(Number(emotions[topEmotion] || 0));
      const emotionScore = clampScore(intensity01 * 10);

      const paceRow = paceByParagraph.get(paragraph);
      const actionScore = clampScore(normalizeToTen(paceRow?.action_score, 0));
      const paceFromArc = normalizeToTen(Array.isArray(emotionalArc?.pacing_scores) ? emotionalArc.pacing_scores[index] : undefined, NaN);
      const pacingScore = Number.isFinite(paceFromArc)
        ? clampScore(paceFromArc)
        : clampScore(normalizeToTen(paceRow?.pacing_score, emotionScore));
      const tensionScore = clampScore(emotionScore * 0.65 + actionScore * 0.35);

      return {
        paragraph,
        emotions,
        dominantEmotion: row?.dominant_emotion || topEmotion || "neutral",
        emotionScore,
        pacingScore,
        actionScore,
        tensionScore,
      };
    });
    return dedupeByParagraph(timeline);
  }

  if (paceRows.length === 0) return [];
  return dedupeByParagraph(
    paceRows.map((row, index) => {
      const paragraph = normalizeParagraph(row?.paragraph, index + 1, false);
      const emotionScore = clampScore(normalizeToTen(row?.emotion_score, 0));
      const actionScore = clampScore(normalizeToTen(row?.action_score, 0));
      const pacingScore = clampScore(normalizeToTen(row?.pacing_score, emotionScore));
      return {
        paragraph,
        emotions: {},
        dominantEmotion: "neutral",
        emotionScore,
        pacingScore,
        actionScore,
        tensionScore: clampScore(emotionScore * 0.65 + actionScore * 0.35),
      };
    }),
  );
}

function dedupeByParagraph(rows) {
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.paragraph)) {
      map.set(row.paragraph, row);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.paragraph - b.paragraph);
}

function normalizeParagraph(value, fallback, isZeroBased) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (isZeroBased) return Math.max(1, Math.round(parsed) + 1);
  return Math.max(1, Math.round(parsed));
}

function normalizeToTen(value, fallback) {
  const primary = Number(value);
  if (Number.isFinite(primary)) {
    if (primary <= 1) return primary * 10;
    return primary;
  }
  const backup = Number(fallback);
  if (Number.isFinite(backup)) {
    if (backup <= 1) return backup * 10;
    return backup;
  }
  return NaN;
}

function dominantEmotion(emotions) {
  const entries = Object.entries(emotions || {}).filter((entry) => Number.isFinite(Number(entry[1])));
  if (entries.length === 0) return "neutral";
  return entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0][0];
}

function movingAverage(values, windowSize) {
  if (!Array.isArray(values) || values.length === 0) return [];
  return values.map((_, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(values.length - 1, index + Math.floor(windowSize / 2));
    const slice = values.slice(start, end + 1);
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });
}

function toSmoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index];
    const p1 = points[index + 1];
    const cX = (p0.x + p1.x) / 2;
    path += ` C ${cX} ${p0.y}, ${cX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return path;
}

function toAreaPath(points, height, bottomPad) {
  if (!points.length) return "";
  const baseY = height - bottomPad;
  if (points.length === 1) {
    return `M ${points[0].x} ${baseY} L ${points[0].x} ${points[0].y} L ${points[0].x} ${baseY} Z`;
  }
  const line = toSmoothPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
}

function normalizeFlatZones(flatZones) {
  if (!Array.isArray(flatZones)) return [];
  return flatZones
    .map((zone) => {
      const paragraphs = Array.isArray(zone?.paragraphs) ? zone.paragraphs : [];
      const numeric = paragraphs.map((value) => Number(value)).filter((value) => Number.isFinite(value));
      if (!numeric.length) return null;
      const baseZero = numeric.some((value) => value === 0);
      const normalized = numeric.map((value) => (baseZero ? value + 1 : value)).sort((a, b) => a - b);
      return {
        start: normalized[0],
        end: normalized[normalized.length - 1],
        suggestion: zone?.suggestion || "Consider adding contrast in emotion and stakes.",
      };
    })
    .filter(Boolean);
}

function inferArcShape(timeline) {
  if (!Array.isArray(timeline) || timeline.length < 2) return "unknown";
  const values = timeline.map((point) => point.emotionScore);
  const midpoint = Math.max(1, Math.floor(values.length / 2));
  const left = average(values.slice(0, midpoint));
  const right = average(values.slice(midpoint));
  if (right > left + 0.9) return "rising";
  if (right < left - 0.9) return "falling";
  const variance = average(values.map((value) => (value - average(values)) ** 2));
  if (variance > 2.8) return "oscillating";
  return "steady";
}

function average(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, value));
}

function toTitle(text) {
  return String(text || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
