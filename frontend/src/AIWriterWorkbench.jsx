import { useState, useCallback, useEffect } from "react";
import Editor from "./components/Editor";
import CharacterUniverse from "./components/CharacterUniverse";
import ConsistencyView from "./components/ConsistencyView";
import PacingWave from "./components/PacingWave";
import VibeGraph from "./components/VibeGraph";
import IssuePanel from "./components/IssuePanel";
import PlotArcView from "./components/PlotArcView";
import GenreView from "./components/GenreView";
import DialogueView from "./components/DialogueView";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import ExplainabilityView from "./components/ExplainabilityView";
import InputForm from "./components/InputForm";
import TrendsView from "./components/TrendsView";
import CharacterTimeline from "./components/CharacterTimeline";
import IllustrationsView from "./components/IllustrationsView";
import { analyzeText, healthCheck } from "./api/client";
import "./App.css";

const VALID_VIEWS = new Set([
  "form", "editor", "universe", "timeline", "consistency", "pacing",
  "vibe", "arc", "genre", "dialogue", "trends", "illustrations",
  "explain", "issues",
]);

export default function AIWriterWorkbench({ initialView = "editor" }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState(
    VALID_VIEWS.has(initialView) ? initialView : "editor",
  );
  const [style, setStyle] = useState("formal");
  const [backendOnline, setBackendOnline] = useState(true);

  // Feature 1: Context from InputForm
  const [context, setContext] = useState({});
  const [formComplete, setFormComplete] = useState(false);

  // Feature 4: Illustration images
  const [images, setImages] = useState([]);

  const checkBackend = useCallback(async () => {
    try {
      const health = await healthCheck();
      const ok = health?.status === "ok";
      setBackendOnline(ok);
      return ok;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkBackend();
    const timer = setInterval(() => {
      checkBackend();
    }, 5000);
    return () => clearInterval(timer);
  }, [checkBackend]);

  useEffect(() => {
    if (backendOnline && error?.toLowerCase().includes("backend is offline")) {
      setError(null);
    }
  }, [backendOnline, error]);

  useEffect(() => {
    if (VALID_VIEWS.has(initialView)) {
      setActiveView(initialView);
    }
  }, [initialView]);

  const handleFormComplete = useCallback(() => {
    setFormComplete(true);
    setActiveView("editor");
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) {
      setError("Please enter text to analyze.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeText(text, style, 0.25, context);
      const normalized = normalizeResult(data, text, style);
      normalized._sourceText = text;
      setResult(normalized);
      setImages(normalized.illustrations || []);
      setBackendOnline(true);
      setActiveView("universe");
    } catch (err) {
      setBackendOnline(false);
      setError(err?.message || "Analysis failed. Is the backend running on port 8000?");
    } finally {
      setLoading(false);
    }
  }, [text, style, context]);

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        hasResult={!!result}
        formComplete={formComplete}
        style={style}
        setStyle={setStyle}
        onAnalyze={handleAnalyze}
        loading={loading}
        backendOnline={backendOnline}
      />

      <main className="main view-enter">
        {/* Feature 1: Input Form */}
        {activeView === "form" && (
          <InputForm
            context={context}
            setContext={setContext}
            onComplete={handleFormComplete}
          />
        )}

        {activeView === "editor" && (
          <Editor
            text={text}
            setText={setText}
            result={result}
            onAnalyze={handleAnalyze}
            loading={loading}
            error={error}
          />
        )}
        {activeView === "universe" && result && (
          <CharacterUniverse
            nodes={result.character_graph_nodes || []}
            edges={result.character_graph_edges || []}
            issues={result.character_issues || []}
          />
        )}

        {/* Feature 3: Character Timeline */}
        {activeView === "timeline" && result && (
          <CharacterTimeline
            timelineData={result.character_timeline}
            phaseColors={result.phase_colors}
          />
        )}

        {activeView === "consistency" && result && (
          <ConsistencyView
            similarityScores={result.similarity_scores || []}
            issues={result.consistency_issues || []}
            avgSimilarity={result.avg_similarity || 0}
          />
        )}
        {activeView === "pacing" && result && (
          <PacingWave pacing={result.pacing || []} suggestions={result.pacing_suggestions || []} />
        )}
        {activeView === "vibe" && result && (
          <VibeGraph
            pacing={result.pacing || []}
            genreRows={result.genre_per_paragraph || []}
            driftIssues={result.genre_drift_issues || []}
          />
        )}
        {activeView === "arc" && result && (
          <PlotArcView
            arcCurve={result.arc_curve || []}
            arcMap={result.arc_map || []}
            phaseCounts={result.phase_counts || {}}
            phaseColors={result.phase_colors || {}}
            issues={result.arc_issues || []}
          />
        )}
        {activeView === "genre" && result && (
          <GenreView
            dominantGenre={result.dominant_genre}
            genreColor={result.genre_color}
            perParagraph={result.genre_per_paragraph || []}
            topGenres={result.top_genres || []}
            driftIssues={result.genre_drift_issues || []}
          />
        )}
        {activeView === "dialogue" && result && (
          <DialogueView
            profiles={result.dialogue_profiles || {}}
            issues={result.dialogue_issues || []}
            dialogueMap={result.dialogue_map || {}}
          />
        )}

        {/* Feature 2: Market Trends */}
        {activeView === "trends" && result && (
          <TrendsView
            trendData={result.market_trends}
            genre={result.dominant_genre}
          />
        )}

        {/* Feature 4: Illustrations */}
        {activeView === "illustrations" && result && (
          <IllustrationsView
            result={result}
            images={images}
            setImages={setImages}
          />
        )}

        {activeView === "explain" && result && <ExplainabilityView result={result} />}
        {activeView === "issues" && result && <IssuePanel report={result.report} />}

        {activeView !== "editor" && activeView !== "form" && !result && (
          <div className="empty-state">
            <div className="empty-icon">AI</div>
            <p>Analyze your text first to see results here.</p>
            <button className="btn-primary" onClick={() => setActiveView("editor")}>Go to Editor</button>
          </div>
        )}
      </main>

      {result && <Dashboard result={result} />}
    </div>
  );
}

function normalizeResult(raw, sourceText, style) {
  const data = raw || {};
  const paragraphs = sourceText
    .split("\n\n")
    .map((part) => part.trim())
    .filter(Boolean);

  const pacing = Array.isArray(data.pacing) && data.pacing.length > 0
    ? data.pacing
    : paragraphs.map((paragraph, index) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      const actionHits = (paragraph.match(/\b(run|rush|fight|chase|hit|slam|attack|grab|jump)\b/gi) || []).length;
      const punctHits = (paragraph.match(/[!?]/g) || []).length;
      const actionScore = Math.min(10, actionHits * 2 + punctHits);
      const emotionScore = Math.min(10, punctHits * 1.5 + Math.min(words.length / 15, 4));
      const pacingScore = +(actionScore * 0.6 + emotionScore * 0.4).toFixed(2);
      return {
        paragraph: index + 1,
        action_score: +actionScore.toFixed(2),
        emotion_score: +emotionScore.toFixed(2),
        pacing_score: pacingScore,
        label: pacingScore >= 7 ? "High Tension" : pacingScore >= 4 ? "Moderate" : "Slow / Reflective",
      };
    });

  const genreRows = Array.isArray(data.genre_per_paragraph) && data.genre_per_paragraph.length > 0
    ? data.genre_per_paragraph
    : pacing.map((row) => ({
      paragraph: row.paragraph,
      top_genre: "neutral",
      confidence: 0,
      scores: {},
      color: "#64748b",
    }));

  const dominantGenre = data.dominant_genre || (genreRows[0]?.top_genre || "unknown");
  const genreColor = data.genre_color || (genreRows[0]?.color || "#64748b");

  const phaseNames = ["Setup", "Rising Action", "Climax", "Falling Action", "Resolution"];
  const phaseColors = {
    Setup: "#22d3ee",
    "Rising Action": "#f59e0b",
    Climax: "#ef4444",
    "Falling Action": "#8b5cf6",
    Resolution: "#10b981",
  };

  const arcCurve = Array.isArray(data.arc_curve) && data.arc_curve.length > 0
    ? data.arc_curve
    : pacing.map((row, idx) => {
      const phaseIndex = Math.round((idx / Math.max(pacing.length - 1, 1)) * (phaseNames.length - 1));
      const phase = phaseNames[phaseIndex];
      return {
        paragraph: row.paragraph,
        phase,
        phase_index: phaseIndex,
        color: phaseColors[phase],
        max_score: row.pacing_score,
      };
    });

  const arcMap = Array.isArray(data.arc_map) && data.arc_map.length > 0
    ? data.arc_map
    : arcCurve.map((row) => ({
      paragraph: row.paragraph,
      phase: row.phase,
      phase_desc: "Auto-generated from pacing pattern",
      color: row.color,
      scores: [],
      max_score: row.max_score,
      position: +(row.paragraph / Math.max(arcCurve.length, 1)).toFixed(2),
    }));

  const phaseCounts = data.phase_counts && Object.keys(data.phase_counts).length > 0
    ? data.phase_counts
    : arcCurve.reduce((acc, row) => {
      acc[row.phase] = (acc[row.phase] || 0) + 1;
      return acc;
    }, {});

  const characterNodes = Array.isArray(data.character_graph_nodes) && data.character_graph_nodes.length > 0
    ? data.character_graph_nodes
    : [
      {
        id: "Narrator",
        name: "Narrator",
        val: Math.max(paragraphs.length, 1) * 3,
        color: "#22d3ee",
        paragraphs: Array.from({ length: Math.max(paragraphs.length, 1) }, (_, i) => i),
        appearances: Math.max(paragraphs.length, 1),
        hasIssue: false,
        locations: [],
        emotions: [],
        x: 0,
        y: 0,
        z: 0,
      },
    ];

  const styleResult = {
    style: data.style_result?.style || style,
    description: data.style_result?.description || "Rule-based enhancement",
    change_log: data.style_result?.change_log || [],
    num_changes: data.style_result?.num_changes ?? 0,
    diff: data.style_result?.diff || [],
    enhanced: data.style_result?.enhanced || data.enhanced_text || sourceText,
  };

  const issues = data.report?.all_issues || [];
  const report = {
    total_issues: data.report?.total_issues ?? issues.length,
    high_severity: data.report?.high_severity ?? issues.filter((item) => item.severity === "high").length,
    medium_severity: data.report?.medium_severity ?? issues.filter((item) => item.severity === "medium").length,
    low_severity: data.report?.low_severity ?? issues.filter((item) => item.severity === "low").length,
    all_issues: issues,
    readability_score: data.report?.readability_score ?? data.readability_score ?? 0,
    word_count: data.report?.word_count ?? sourceText.trim().split(/\s+/).filter(Boolean).length,
  };

  return {
    ...data,
    pacing,
    genre_per_paragraph: genreRows,
    dominant_genre: dominantGenre,
    genre_color: genreColor,
    arc_curve: arcCurve,
    arc_map: arcMap,
    phase_counts: phaseCounts,
    phase_colors: data.phase_colors || phaseColors,
    character_graph_nodes: characterNodes,
    character_graph_edges: data.character_graph_edges || [],
    character_issues: data.character_issues || [],
    consistency_issues: data.consistency_issues || [],
    similarity_scores: data.similarity_scores || [],
    avg_similarity: data.avg_similarity || 0,
    dialogue_profiles: data.dialogue_profiles || {},
    dialogue_issues: data.dialogue_issues || [],
    dialogue_map: data.dialogue_map || {},
    top_genres:
      Array.isArray(data.top_genres) && data.top_genres.length > 0
        ? data.top_genres
        : Array.from(new Set(genreRows.map((row) => row.top_genre).filter(Boolean))).slice(0, 4),
    genre_drift_issues: data.genre_drift_issues || [],
    report,
    style_result: styleResult,
    enhanced_text: data.enhanced_text || styleResult.enhanced,
    // New feature data
    character_timeline: data.character_timeline || null,
    market_trends: data.market_trends || null,
    illustrations: data.illustrations || [],
  };
}
