import { useEffect, useMemo, useRef } from "react";

export default function VibeGraph({ pacing = [], genreRows = [], driftIssues = [] }) {
  const svgRef = useRef();

  const points = useMemo(() => {
    const genreByParagraph = new Map(
      genreRows.map((row) => [
        row.paragraph,
        {
          genre: row.top_genre || "neutral",
          color: row.color || "#64748b",
          confidence: row.confidence || 0,
        },
      ]),
    );
    const driftSet = new Set(driftIssues.map((issue) => issue.paragraph).filter(Boolean));

    return pacing.map((row) => {
      const genre = genreByParagraph.get(row.paragraph) || { genre: "neutral", color: "#64748b", confidence: 0 };
      const vibeScore = +(0.5 * row.emotion_score + 0.3 * row.action_score + 0.2 * row.pacing_score).toFixed(2);
      const drift = driftSet.has(row.paragraph);
      return {
        ...row,
        vibe_score: vibeScore,
        vibe_label: vibeLabel(vibeScore),
        genre: genre.genre,
        genre_color: genre.color,
        genre_confidence: genre.confidence,
        drift,
      };
    });
  }, [pacing, genreRows, driftIssues]);

  const averageVibe = useMemo(() => {
    if (!points.length) return 0;
    return points.reduce((sum, point) => sum + point.vibe_score, 0) / points.length;
  }, [points]);

  const peak = useMemo(() => {
    if (!points.length) return null;
    return points.reduce((best, current) => (current.vibe_score > best.vibe_score ? current : best), points[0]);
  }, [points]);

  const emotionPeak = useMemo(() => {
    if (!points.length) return null;
    return points.reduce((best, current) => (current.emotion_score > best.emotion_score ? current : best), points[0]);
  }, [points]);

  const volatility = useMemo(() => {
    if (points.length < 2) return 0;
    const deltas = points.slice(1).map((point, index) => Math.abs(point.vibe_score - points[index].vibe_score));
    return deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  }, [points]);

  const averageGenreConfidence = useMemo(() => {
    if (!points.length) return 0;
    return points.reduce((sum, point) => sum + point.genre_confidence, 0) / points.length;
  }, [points]);

  useEffect(() => {
    if (!svgRef.current || !points.length) return;
    drawVibe(svgRef.current, points);
  }, [points]);

  return (
    <div className="pacing-container">
      <div className="pacing-header">
        Story <span>Vibe</span> Graph
        <p>Maps emotional and tonal momentum so you can see where the story feels calm, steady, or electric.</p>
      </div>

      <div className="pacing-chart-wrap">
        <div className="analysis-metrics-grid">
          <MetricCard label="Average Vibe" value={`${averageVibe.toFixed(1)}/10`} />
          <MetricCard label="Peak Paragraph" value={peak ? `P${peak.paragraph}` : "-"} />
          <MetricCard label="Volatility" value={`${volatility.toFixed(2)} delta`} />
          <MetricCard label="Genre Certainty" value={`${Math.round(averageGenreConfidence * 100)}%`} />
          <MetricCard label="Emotion Peak" value={emotionPeak ? `P${emotionPeak.paragraph}` : "-"} />
        </div>

        <svg
          ref={svgRef}
          className="analysis-svg analysis-svg-lg"
          viewBox="0 0 1000 360"
          preserveAspectRatio="none"
        />

        <div className="analysis-legend-row">
          <Legend color="#22d3ee" text="Emotion line" />
          <Legend color="#f59e0b" text="Vibe line" />
          <Legend color="#94a3b8" text="3-point trend line" />
          <Legend color="#ef4444" text="Genre drift marker" />
          <Legend color="#10b981" text="Vibe zones (Calm to Electric)" />
        </div>

        <div className="analysis-table-wrap">
          <table className="analysis-table">
            <thead>
              <tr>
                {["Para", "Vibe", "Delta", "Label", "Genre", "Confidence", "Emotion", "Action", "Pacing", "Drift"].map((head) => (
                  <th key={head}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => {
                const previous = points[index - 1]?.vibe_score ?? point.vibe_score;
                const delta = point.vibe_score - previous;
                return (
                  <tr key={point.paragraph}>
                    <td>P{point.paragraph}</td>
                    <td className="analysis-tone warning">{point.vibe_score.toFixed(1)}</td>
                    <td className={`analysis-tone ${delta >= 0 ? "positive" : "danger"}`}>
                      {index === 0 ? "-" : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`}
                    </td>
                    <td style={{ color: vibeColor(point.vibe_score) }}>{point.vibe_label}</td>
                    <td style={{ color: point.genre_color, textTransform: "capitalize" }}>{point.genre}</td>
                    <td>{Math.round(point.genre_confidence * 100)}%</td>
                    <td className="analysis-tone healthy">{point.emotion_score}</td>
                    <td className="analysis-tone danger">{point.action_score}</td>
                    <td>{point.pacing_score}</td>
                    <td className={`analysis-tone ${point.drift ? "danger" : "positive"}`}>{point.drift ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function drawVibe(svg, points) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const W = 1000;
  const H = 360;
  const PAD = { top: 22, right: 28, bottom: 48, left: 42 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxScore = 10;
  const NS = "http://www.w3.org/2000/svg";

  const xScale = (i) => PAD.left + (i / Math.max(points.length - 1, 1)) * chartW;
  const yScale = (v) => PAD.top + chartH - (v / maxScore) * chartH;

  const vibeZones = [
    { from: 0, to: 4, color: "rgba(16,185,129,0.08)", label: "Calm" },
    { from: 4, to: 6, color: "rgba(34,211,238,0.08)", label: "Steady" },
    { from: 6, to: 8, color: "rgba(245,158,11,0.08)", label: "Elevated" },
    { from: 8, to: 10, color: "rgba(239,68,68,0.08)", label: "Electric" },
  ];

  vibeZones.forEach((zone) => {
    const yTop = yScale(zone.to);
    const yBottom = yScale(zone.from);
    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("x", PAD.left);
    rect.setAttribute("y", yTop);
    rect.setAttribute("width", chartW);
    rect.setAttribute("height", yBottom - yTop);
    rect.setAttribute("fill", zone.color);
    svg.appendChild(rect);

    const zoneLabel = document.createElementNS(NS, "text");
    zoneLabel.setAttribute("x", W - PAD.right - 4);
    zoneLabel.setAttribute("y", yTop + 12);
    zoneLabel.setAttribute("text-anchor", "end");
    zoneLabel.setAttribute("fill", "#334155");
    zoneLabel.setAttribute("font-size", "9");
    zoneLabel.textContent = zone.label;
    svg.appendChild(zoneLabel);
  });

  for (let value = 0; value <= 10; value += 1) {
    const y = yScale(value);
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", PAD.left);
    line.setAttribute("x2", W - PAD.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", value % 2 === 0 ? "#1e2d3d" : "#162232");
    line.setAttribute("stroke-width", value % 2 === 0 ? "1.1" : "0.8");
    svg.appendChild(line);

    if (value % 2 === 0) {
      const label = document.createElementNS(NS, "text");
      label.setAttribute("x", PAD.left - 8);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "#334155");
      label.setAttribute("font-size", "10");
      label.textContent = String(value);
      svg.appendChild(label);
    }
  }

  const showEvery = points.length > 24 ? 2 : 1;
  points.forEach((point, i) => {
    if (i % showEvery !== 0 && i !== points.length - 1) return;
    const x = xScale(i);
    const paraLabel = document.createElementNS(NS, "text");
    paraLabel.setAttribute("x", x);
    paraLabel.setAttribute("y", H - PAD.bottom + 18);
    paraLabel.setAttribute("text-anchor", "middle");
    paraLabel.setAttribute("fill", "#334155");
    paraLabel.setAttribute("font-size", "10");
    paraLabel.textContent = `P${point.paragraph}`;
    svg.appendChild(paraLabel);
  });

  const vibeValues = points.map((point) => point.vibe_score);
  const emotionValues = points.map((point) => point.emotion_score);
  const rollingValues = rollingAverage(vibeValues, 3);

  const vibePath = smoothPath(points.map((point, i) => [xScale(i), yScale(point.vibe_score)]));
  const emotionPath = smoothPath(points.map((point, i) => [xScale(i), yScale(point.emotion_score)]));
  const trendPath = smoothPath(rollingValues.map((value, i) => [xScale(i), yScale(value)]));

  const emotion = document.createElementNS(NS, "path");
  emotion.setAttribute("d", emotionPath);
  emotion.setAttribute("fill", "none");
  emotion.setAttribute("stroke", "#22d3ee");
  emotion.setAttribute("stroke-width", "1.8");
  emotion.setAttribute("stroke-linecap", "round");
  emotion.setAttribute("stroke-linejoin", "round");
  emotion.setAttribute("opacity", "0.9");
  svg.appendChild(emotion);

  const trend = document.createElementNS(NS, "path");
  trend.setAttribute("d", trendPath);
  trend.setAttribute("fill", "none");
  trend.setAttribute("stroke", "#94a3b8");
  trend.setAttribute("stroke-width", "1.8");
  trend.setAttribute("stroke-dasharray", "4 4");
  trend.setAttribute("stroke-linecap", "round");
  trend.setAttribute("stroke-linejoin", "round");
  trend.setAttribute("opacity", "0.8");
  svg.appendChild(trend);

  const average = vibeValues.reduce((sum, value) => sum + value, 0) / Math.max(vibeValues.length, 1);
  const averageLine = document.createElementNS(NS, "line");
  averageLine.setAttribute("x1", PAD.left);
  averageLine.setAttribute("x2", W - PAD.right);
  averageLine.setAttribute("y1", yScale(average));
  averageLine.setAttribute("y2", yScale(average));
  averageLine.setAttribute("stroke", "#64748b");
  averageLine.setAttribute("stroke-width", "1");
  averageLine.setAttribute("stroke-dasharray", "3 4");
  averageLine.setAttribute("opacity", "0.8");
  svg.appendChild(averageLine);

  const vibe = document.createElementNS(NS, "path");
  vibe.setAttribute("d", vibePath);
  vibe.setAttribute("fill", "none");
  vibe.setAttribute("stroke", "#f59e0b");
  vibe.setAttribute("stroke-width", "2.9");
  vibe.setAttribute("stroke-linecap", "round");
  vibe.setAttribute("stroke-linejoin", "round");
  svg.appendChild(vibe);

  points.forEach((point, i) => {
    const x = xScale(i);
    if (point.drift) {
      const driftLine = document.createElementNS(NS, "line");
      driftLine.setAttribute("x1", x);
      driftLine.setAttribute("x2", x);
      driftLine.setAttribute("y1", PAD.top);
      driftLine.setAttribute("y2", H - PAD.bottom);
      driftLine.setAttribute("stroke", "#ef4444");
      driftLine.setAttribute("stroke-width", "1");
      driftLine.setAttribute("stroke-dasharray", "3 4");
      driftLine.setAttribute("opacity", "0.55");
      svg.appendChild(driftLine);
    }
  });

  points.forEach((point, i) => {
    const x = xScale(i);
    const y = yScale(point.vibe_score);
    const node = document.createElementNS(NS, "circle");
    node.setAttribute("cx", x);
    node.setAttribute("cy", y);
    node.setAttribute("r", point.drift ? "5.2" : "4.2");
    node.setAttribute("fill", point.drift ? "#ef4444" : point.genre_color || vibeColor(point.vibe_score));
    node.setAttribute("stroke", "#080b12");
    node.setAttribute("stroke-width", "2");

    const title = document.createElementNS(NS, "title");
    title.textContent = `P${point.paragraph} | Vibe ${point.vibe_score.toFixed(1)} | Emotion ${point.emotion_score} | Genre ${point.genre}`;
    node.appendChild(title);

    svg.appendChild(node);
  });
}

function rollingAverage(values, windowSize = 3) {
  return values.map((_, index) => {
    const from = Math.max(0, index - Math.floor(windowSize / 2));
    const to = Math.min(values.length - 1, index + Math.floor(windowSize / 2));
    const slice = values.slice(from, to + 1);
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });
}

function smoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cx = (x0 + x1) / 2;
    path += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return path;
}

function vibeLabel(score) {
  if (score >= 8) return "Electric";
  if (score >= 6) return "Elevated";
  if (score >= 4) return "Steady";
  return "Calm";
}

function vibeColor(score) {
  if (score >= 8) return "#ef4444";
  if (score >= 6) return "#f59e0b";
  if (score >= 4) return "#22d3ee";
  return "#10b981";
}

function MetricCard({ label, value }) {
  return (
    <div className="analysis-metric-card">
      <div className="analysis-metric-label">{label}</div>
      <div className="analysis-metric-value">{value}</div>
    </div>
  );
}

function Legend({ color, text }) {
  return (
    <div className="analysis-legend-item">
      <div style={{ background: color }} className="analysis-legend-line" />
      {text}
    </div>
  );
}
