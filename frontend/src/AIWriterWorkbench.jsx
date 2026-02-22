import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Editor from "./components/Editor";
import ConsistencyView from "./components/ConsistencyView";
import IssuePanel from "./components/IssuePanel";

import Navbar from "./components/Navbar";
import ExplainabilityView from "./components/ExplainabilityView";
import InputForm from "./components/InputForm";
import EnhancementView from "./components/EnhancementView";
import StoryWorldView from "./components/StoryWorldView";
import StyleToneView from "./components/StyleToneView";
import CharacterUniverse from "./components/CharacterUniverse";
import WriterTypeSelector from "./components/WriterTypeSelector";
import {
  analyzeText,
  getFirebaseDocument,
  getFirebaseDocumentContent,
  healthCheck,
  listFirebaseDocuments,
  saveFirebaseDocumentContent,
} from "./api/client";
import "./App.css";

const VALID_VIEWS = new Set([
  "form", "editor", "enhancement", "character", "consistency", "style", "story", "explain",
]);

export default function AIWriterWorkbench({ initialView = "editor" }) {
  const { docId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routedDocumentTitle = typeof location?.state?.documentTitle === "string"
    ? location.state.documentTitle
    : "";
  const routedSetupContext = isSetupContext(location?.state?.setupContext)
    ? location.state.setupContext
    : null;
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [activeView, setActiveView] = useState(
    VALID_VIEWS.has(initialView) ? initialView : "editor",
  );
  const [style, setStyle] = useState("formal");
  const [backendOnline, setBackendOnline] = useState(true);
  const [documentTitle, setDocumentTitle] = useState(
    routedDocumentTitle || "Chapter Draft Workspace",
  );
  const [documentLoading, setDocumentLoading] = useState(Boolean(docId));
  const [documentSaveState, setDocumentSaveState] = useState("idle");
  const [documentReady, setDocumentReady] = useState(!docId);
  const lastSavedTextRef = useRef("");
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [recentDocsLoading, setRecentDocsLoading] = useState(false);

  // Feature 1: Context from InputForm
  const [context, setContext] = useState(routedSetupContext || {});
  const [formComplete, setFormComplete] = useState(Boolean(routedSetupContext));
  const [writerType, setWriterType] = useState(null);

  // Feature 4: Illustration images
  const [images, setImages] = useState([]);

  const checkBackend = useCallback(async () => {
    try {
      const health = await healthCheck();
      const ok = health?.status === "ok" || health?.status === "healthy";
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

  useEffect(() => {
    if (!isSetupContext(routedSetupContext)) return;
    setContext(routedSetupContext);
    setFormComplete(true);
  }, [routedSetupContext]);

  const loadRecentDocuments = useCallback(async () => {
    setRecentDocsLoading(true);
    try {
      const data = await listFirebaseDocuments();
      const docs = Array.isArray(data) ? data.map(normalizeRecentDocument) : [];
      setRecentDocuments(docs);
    } catch {
      setRecentDocuments([]);
    } finally {
      setRecentDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentDocuments();
  }, [loadRecentDocuments]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadRecentDocuments();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadRecentDocuments]);

  useEffect(() => {
    if (docId && routedDocumentTitle.trim()) {
      setDocumentTitle(routedDocumentTitle.trim());
    }
  }, [docId, routedDocumentTitle]);

  useEffect(() => {
    let cancelled = false;

    const loadDocument = async () => {
      if (!docId) {
        setDocumentTitle("Chapter Draft Workspace");
        setDocumentError(null);
        setDocumentLoading(false);
        setDocumentSaveState("idle");
        setDocumentReady(true);
        lastSavedTextRef.current = "";
        if (isSetupContext(routedSetupContext)) {
          setContext(routedSetupContext);
          setFormComplete(true);
        } else {
          setContext({});
          setFormComplete(false);
        }
        return;
      }

      setDocumentLoading(true);
      setDocumentReady(false);
      setDocumentSaveState("loading");
      setDocumentError(null);
      setError(null);
      setResult(null);
      setImages([]);
      setActiveView(VALID_VIEWS.has(initialView) ? initialView : "editor");
      const incomingTitle = routedDocumentTitle.trim();
      if (incomingTitle) {
        setDocumentTitle(incomingTitle);
      } else {
        setDocumentTitle("Untitled Document");
      }
      if (isSetupContext(routedSetupContext)) {
        setContext(routedSetupContext);
        setFormComplete(true);
      } else {
        setContext({});
        setFormComplete(false);
      }

      try {
        // Load editor content first so document open feels instant.
        const rawContent = await getFirebaseDocumentContent(docId);

        if (cancelled) return;

        const initialText = extractPlainText(rawContent);
        const savedSetupContext = extractSetupContext(rawContent);
        if (isSetupContext(savedSetupContext)) {
          setContext(savedSetupContext);
          setFormComplete(true);
        }
        setText(initialText);
        lastSavedTextRef.current = initialText;
        setDocumentSaveState("saved");
        setDocumentLoading(false);
        setDocumentReady(true);

        if (!incomingTitle) {
          // Resolve title in background only when we don't already have it from route state.
          getFirebaseDocument(docId)
            .then((docMeta) => {
              if (cancelled) return;
              setDocumentTitle(docMeta?.title || "Untitled Document");
            })
            .catch(() => {
              // Ignore title refresh errors to keep content load path fast.
            });
        }
      } catch (err) {
        if (cancelled) return;
        setDocumentError(err?.message || "Failed to load document.");
        setDocumentSaveState("error");
        setDocumentLoading(false);
        setDocumentReady(true);
      }
    };

    loadDocument();
    return () => {
      cancelled = true;
    };
  }, [docId, initialView, routedDocumentTitle, routedSetupContext, setText]);

  useEffect(() => {
    if (!docId || !documentReady || documentLoading) return;
    if (text === lastSavedTextRef.current) return;

    setDocumentSaveState("saving");
    const timer = setTimeout(async () => {
      try {
        await saveFirebaseDocumentContent(docId, buildDocumentPayload(text, context));
        lastSavedTextRef.current = text;
        setDocumentSaveState("saved");
        setDocumentError(null);
      } catch (err) {
        setDocumentSaveState("error");
        setDocumentError(err?.message || "Autosave failed.");
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [context, docId, documentLoading, documentReady, text]);

  const openDocumentFromSidebar = useCallback((targetDocId, title = "Untitled Document") => {
    if (!targetDocId || targetDocId === docId) return;
    navigate(`/editor/${targetDocId}`, {
      state: { documentTitle: title },
    });
  }, [docId, navigate]);

  const handleFormComplete = useCallback(async (nextContext) => {
    const resolvedContext = isSetupContext(nextContext) ? nextContext : {};
    setContext(resolvedContext);
    setFormComplete(true);
    if (docId) {
      try {
        setDocumentSaveState("saving");
        await saveFirebaseDocumentContent(docId, buildDocumentPayload(text, resolvedContext));
        lastSavedTextRef.current = text;
        setDocumentSaveState("saved");
        setDocumentError(null);
      } catch (err) {
        setDocumentSaveState("error");
        setDocumentError(err?.message || "Failed to save setup.");
      }

      navigate(`/editor/${docId}`, {
        state: {
          documentTitle: documentTitle || "Untitled Document",
          setupContext: resolvedContext,
        },
      });
      return;
    }

    setActiveView("editor");
  }, [docId, documentTitle, navigate, text]);

  const handleFormSkip = useCallback(() => {
    if (!docId) {
      setActiveView("editor");
      return;
    }

    navigate(`/editor/${docId}`, {
      state: {
        documentTitle: documentTitle || "Untitled Document",
        setupContext: context,
      },
    });
  }, [context, docId, documentTitle, navigate]);

  const handleImportDocument = useCallback(async (file) => {
    if (!file) return;

    try {
      const raw = await file.text();
      let importedText = raw;
      let importedContext = null;
      let importedTitle = "";
      const looksJson = file.type.includes("json") || /\.json$/i.test(file.name);

      if (looksJson) {
        try {
          const parsed = JSON.parse(raw);
          const parsedText = extractPlainText(parsed);
          importedText = parsedText || (typeof parsed === "string" ? parsed : importedText);
          importedContext = extractSetupContext(parsed);
          importedTitle = String(parsed?.meta?.title || "").trim();
        } catch {
          // Keep raw file text for invalid/partial JSON uploads.
        }
      }

      const normalizedText = String(importedText || "");
      if (!normalizedText.trim()) {
        setError("Imported file is empty.");
        return;
      }

      if (!docId) {
        const nextTitle = importedTitle || deriveTitleFromFileName(file.name);
        if (nextTitle) {
          setDocumentTitle(nextTitle);
        }
      }

      if (isSetupContext(importedContext)) {
        setContext(importedContext);
        setFormComplete(true);
      }

      setText(normalizedText);
      setResult(null);
      setImages([]);
      setError(null);
      setDocumentError(null);
      setActiveView("editor");
    } catch (err) {
      setError(err?.message || "Failed to import file.");
    }
  }, [docId]);

  const handleExportDocument = useCallback(() => {
    const exportTitle = documentTitle || "Untitled Document";
    const payload = buildDocumentPayload(text, context);
    payload.meta = {
      ...payload.meta,
      title: exportTitle,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${toFileSafeName(exportTitle)}.scriptiq.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, [context, documentTitle, text]);

  const handleAnalyze = useCallback(async () => {
    if (documentLoading) {
      setError("Document is still loading. Please wait.");
      return;
    }

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
      setActiveView("enhancement");
    } catch (err) {
      setBackendOnline(false);
      setError(err?.message || "Analysis failed. Is the backend running on port 8000?");
    } finally {
      setLoading(false);
    }
  }, [context, documentLoading, style, text]);

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
        {activeView === "form" && !writerType && (
          <WriterTypeSelector
            onSelect={(type) => {
              setWriterType(type);
              // Pre-fill context based on writer type
              if (type.id === "corporate") {
                setContext(prev => ({ ...prev, writing: { ...prev.writing, genre: "article", purpose: "inform" }, writerType: type.id }));
              } else if (type.id === "academic") {
                setContext(prev => ({ ...prev, writing: { ...prev.writing, genre: "essay", purpose: "inform" }, writerType: type.id }));
              } else if (type.id === "screenwriter") {
                setContext(prev => ({ ...prev, writing: { ...prev.writing, genre: "script", purpose: "entertain" }, writerType: type.id }));
              } else if (type.id === "author") {
                setContext(prev => ({ ...prev, writing: { ...prev.writing, genre: "novel", purpose: "entertain" }, writerType: type.id }));
              } else if (type.id === "journalist") {
                setContext(prev => ({ ...prev, writing: { ...prev.writing, genre: "blog post", purpose: "inform" }, writerType: type.id }));
              } else if (type.id === "poet") {
                setContext(prev => ({ ...prev, writing: { ...prev.writing, genre: "short story", purpose: "inspire" }, writerType: type.id }));
              }
            }}
            onSkip={() => setWriterType({ id: "author", title: "General Writer" })}
          />
        )}
        {activeView === "form" && writerType && (
          <InputForm
            context={context}
            setContext={setContext}
            onComplete={handleFormComplete}
            onSkip={handleFormSkip}
          />
        )}

        {activeView === "editor" && (
          <Editor
            text={text}
            setText={setText}
            result={result}
            onAnalyze={handleAnalyze}
            loading={loading}
            error={error || documentError}
            documentLoading={documentLoading}
            documentSaveState={documentSaveState}
            documentTitle={documentTitle}
            hasConnectedDocument={Boolean(docId)}
            recentDocuments={recentDocuments}
            recentDocsLoading={recentDocsLoading}
            currentDocumentId={docId || ""}
            onOpenDocument={openDocumentFromSidebar}
            onImportFile={handleImportDocument}
            onExportFile={handleExportDocument}
            writerType={writerType}
          />
        )}
        {activeView === "enhancement" && result && (
          <EnhancementView result={result} onExportFile={handleExportDocument} onApplyText={(newText) => { setText(newText); setActiveView('editor'); }} />
        )}

        {activeView === "character" && result && (
          <div style={{ padding: '24px', height: '100%', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
            <div style={{ border: '2px solid var(--brand-primary)', borderRadius: '16px', overflow: 'hidden', height: '100%', boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.15), 0 4px 6px -4px rgba(34, 211, 238, 0.1)', background: 'var(--bg-card)' }}>
              <CharacterUniverse
                nodes={result?.character_graph_nodes || []}
                edges={result?.character_graph_edges || []}
                issues={result?.character_issues || []}
              />
            </div>
          </div>
        )}

        {activeView === "consistency" && result && (
          <div style={{ padding: '24px', height: '100%', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
            <div style={{ border: '2px solid var(--brand-primary)', borderRadius: '16px', overflow: 'hidden', height: '100%', boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.15), 0 4px 6px -4px rgba(34, 211, 238, 0.1)', background: 'var(--bg-card)' }}>
              <ConsistencyView
                similarityScores={result.similarity_scores || []}
                issues={result.consistency_issues || []}
                avgSimilarity={result.avg_similarity || 0}
              />
            </div>
          </div>
        )}

        {activeView === "style" && result && (
          <div style={{ padding: '24px', height: '100%', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
            <div style={{ border: '2px solid var(--brand-primary)', borderRadius: '16px', overflow: 'hidden', height: '100%', boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.15), 0 4px 6px -4px rgba(34, 211, 238, 0.1)', background: 'var(--bg-card)' }}>
              <StyleToneView result={result} />
            </div>
          </div>
        )}

        {activeView === "story" && result && (
          <div style={{ padding: '24px', height: '100%', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
            <div style={{ border: '2px solid var(--brand-primary)', borderRadius: '16px', overflow: 'hidden', height: '100%', boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.15), 0 4px 6px -4px rgba(34, 211, 238, 0.1)', background: 'var(--bg-card)' }}>
              <StoryWorldView result={result} />
            </div>
          </div>
        )}

        {activeView === "explain" && result && (
          <div style={{ padding: '24px', height: '100%', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
            <div style={{ border: '2px solid var(--brand-primary)', borderRadius: '16px', overflow: 'hidden', height: '100%', boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.15), 0 4px 6px -4px rgba(34, 211, 238, 0.1)', background: 'var(--bg-card)' }}>
              <ExplainabilityView result={result} />
            </div>
          </div>
        )}

        {activeView !== "editor" && activeView !== "form" && !result && (
          <div className="empty-state">
            <div className="empty-icon">AI</div>
            <p>Analyze your text first to see results here.</p>
            <button className="btn-primary" onClick={() => setActiveView("editor")}>Go to Editor</button>
          </div>
        )}
      </main>


    </div>
  );
}

function normalizeResult(raw, sourceText, style) {
  const data = raw || {};
  const paragraphs = splitParagraphs(sourceText);

  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  const suggestionIssues = suggestions.map((item) => ({
    category: toTitle(item.rule_triggered?.split(".")[0] || "General"),
    severity: item.severity || "medium",
    message: item.reason || item.rule_triggered || "Potential issue detected",
    suggestion: item.modified_text || "",
    source: item.source || "custom_pipeline",
  }));

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
    : pacing.map((row) => inferGenreRow(paragraphs[row.paragraph - 1] || "", row.paragraph));

  const dominantGenre = data.dominant_genre || mode(genreRows.map((row) => row.top_genre)) || "neutral";
  const genreColor = data.genre_color || genreRows.find((row) => row.top_genre === dominantGenre)?.color || "#64748b";

  const phaseNames = ["Setup", "Rising Action", "Climax", "Falling Action", "Resolution"];
  const phaseColors = data.phase_colors || {
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

  const characterNodes =
    Array.isArray(data.character_graph_nodes) && data.character_graph_nodes.length > 0
      ? data.character_graph_nodes
      : buildCharacterNodes(data.characters, paragraphs.length);

  const characterEdges =
    Array.isArray(data.character_graph_edges) && data.character_graph_edges.length > 0
      ? data.character_graph_edges
      : buildCharacterEdges(characterNodes);

  const styleResult = {
    style: data.style_result?.style || style,
    description: data.style_result?.description || "Rule-based enhancement",
    change_log: data.style_result?.change_log || suggestions
      .filter((item) => item.original_text || item.modified_text)
      .slice(0, 8)
      .map((item) => ({
        original: item.original_text || "(contextual rule)",
        replacement: item.modified_text || "(suggested rewrite)",
        reason: item.reason || item.rule_triggered || "Rule-based adjustment",
      })),
    num_changes: data.style_result?.num_changes ?? suggestions.length,
    diff: data.style_result?.diff || suggestions
      .filter((item) => item.original_text && item.modified_text)
      .slice(0, 8)
      .map((item) => ({ before: item.original_text, after: item.modified_text })),
    enhanced: data.style_result?.enhanced || data.enhanced_text || sourceText,
  };

  const normalizedDiff = Array.isArray(styleResult.diff)
    ? styleResult.diff.map((block) => {
      if (block && typeof block === "object" && "type" in block) {
        return block;
      }
      return {
        type: "replace",
        original: block?.original || block?.before || "",
        new: block?.new || block?.after || "",
      };
    })
    : [];

  const issues = Array.isArray(data.report?.all_issues) && data.report.all_issues.length > 0
    ? data.report.all_issues
    : suggestionIssues;

  const readabilityFromScores = Number(data.readability_scores?.flesch_kincaid || 0);
  const readabilityScore = data.report?.readability_score
    ?? data.readability_score
    ?? Math.max(0, Math.min(100, Math.round(100 - readabilityFromScores * 4)));

  const report = {
    total_issues: data.report?.total_issues ?? issues.length,
    high_severity: data.report?.high_severity ?? issues.filter((item) => item.severity === "high").length,
    medium_severity: data.report?.medium_severity ?? issues.filter((item) => item.severity === "medium").length,
    low_severity: data.report?.low_severity ?? issues.filter((item) => item.severity === "low").length,
    all_issues: issues,
    readability_score: readabilityScore,
    word_count: data.report?.word_count ?? sourceText.trim().split(/\s+/).filter(Boolean).length,
  };

  const similarityScoresFromPayload = normalizeSimilarityScores(data.similarity_scores);
  const baseSimilarityScores = similarityScoresFromPayload.length > 0
    ? similarityScoresFromPayload
    : buildSimilarityScores(paragraphs);
  const similarityScores = hydrateSimilarityScores(baseSimilarityScores, data.structural_issues);

  const explicitAvg = parseNormalizedScore(data.avg_similarity);
  const avgSimilarityBase = Number.isFinite(explicitAvg)
    ? clamp01(explicitAvg)
    : (similarityScores.reduce((sum, value) => sum + value, 0) / Math.max(similarityScores.length, 1));
  const avgSimilarity = Number(avgSimilarityBase.toFixed(2));

  const dialogueMap =
    data.dialogue_map && Object.keys(data.dialogue_map).length > 0
      ? data.dialogue_map
      : buildDialogueMap(paragraphs, characterNodes);

  const dialogueProfiles =
    data.dialogue_profiles && Object.keys(data.dialogue_profiles).length > 0
      ? data.dialogue_profiles
      : buildDialogueProfiles(dialogueMap);

  const topGenres =
    Array.isArray(data.top_genres) && data.top_genres.length > 0
      ? data.top_genres
      : Array.from(new Set(genreRows.map((row) => row.top_genre).filter(Boolean))).slice(0, 4);

  const genreDriftIssues =
    Array.isArray(data.genre_drift_issues) && data.genre_drift_issues.length > 0
      ? data.genre_drift_issues
      : genreRows.slice(1).flatMap((row, index) => {
        const prev = genreRows[index];
        if (!prev || prev.top_genre === row.top_genre || row.confidence < 0.34) {
          return [];
        }
        return [{
          paragraph: row.paragraph,
          category: "Genre",
          severity: "medium",
          message: `Genre shift near paragraph ${row.paragraph}: ${row.top_genre}`,
          issue: `Genre shift near paragraph ${row.paragraph}: ${row.top_genre}`,
        }];
      });

  const characterIssues =
    Array.isArray(data.character_issues) && data.character_issues.length > 0
      ? data.character_issues
      : issues.filter((item) => /character|narrative/i.test(String(item.category || "")));

  const consistencyIssues =
    Array.isArray(data.consistency_issues) && data.consistency_issues.length > 0
      ? data.consistency_issues.map((item) => normalizeConsistencyIssue(item))
      : mergeConsistencyIssues([
        normalizeContradictions(data.contradictions),
        normalizeStructuralConsistencyIssues(data.structural_issues),
        buildTransitionConsistencyIssues(similarityScores),
        issues
          .filter((item) => {
            const fingerprint = String(
              item.category || item.rule_triggered || item.message || item.reason || "",
            ).toLowerCase();
            if (fingerprint.includes("transition_gap")) return false;
            if (fingerprint.includes("semantic similarity between end of paragraph")) return false;
            return /\b(consistency|structural|narrative|transition|contradiction)\b/i.test(fingerprint);
          })
          .map((item) => normalizeConsistencyIssue(item)),
      ]);

  const structureIssues =
    Array.isArray(data.structure_issues) && data.structure_issues.length > 0
      ? data.structure_issues
      : Array.isArray(data.structural_issues) && data.structural_issues.length > 0
        ? data.structural_issues.map((item) => ({
          category: "Structure",
          severity: item.severity || "medium",
          message: item.explanation || item.message || "Structural issue detected.",
          suggestion: item.suggestion || "",
        }))
        : issues.filter((item) => /struct/i.test(String(item.category || item.rule_triggered || "")));

  const pacingSuggestions =
    Array.isArray(data.pacing_suggestions) && data.pacing_suggestions.length > 0
      ? data.pacing_suggestions
      : suggestions
        .filter((item) => /pacing/i.test(String(item.rule_triggered || item.category || "")))
        .map((item) => ({
          category: "Pacing",
          severity: item.severity || "low",
          message: item.reason || item.message || "Pacing suggestion.",
          suggestion: item.modified_text || "",
        }));

  const arcIssues =
    Array.isArray(data.arc_issues) && data.arc_issues.length > 0
      ? data.arc_issues
      : issues.filter((item) =>
        /\b(arc|plot|phase|resolution|climax)\b/i.test(
          String(item.category || item.message || item.rule_triggered || ""),
        ),
      );

  const dialogueIssues =
    Array.isArray(data.dialogue_issues) && data.dialogue_issues.length > 0
      ? data.dialogue_issues
      : issues.filter((item) => /dialogue/i.test(String(item.category || item.message || "")));

  const characterTimeline = data.character_timeline || buildCharacterTimeline(characterNodes, arcMap, paragraphs.length);
  const marketTrends = data.market_trends || buildMarketTrends(dominantGenre, pacing, issues.length);
  const illustrations = Array.isArray(data.illustrations) && data.illustrations.length > 0
    ? data.illustrations
    : buildMockIllustrations(paragraphs, dominantGenre);

  return {
    ...data,
    readability_score: readabilityScore,
    pacing,
    genre_per_paragraph: genreRows,
    dominant_genre: dominantGenre,
    genre_color: genreColor,
    arc_curve: arcCurve,
    arc_map: arcMap,
    phase_counts: phaseCounts,
    phase_colors: phaseColors,
    character_graph_nodes: characterNodes,
    character_graph_edges: characterEdges,
    character_issues: characterIssues,
    consistency_issues: consistencyIssues,
    structure_issues: structureIssues,
    pacing_suggestions: pacingSuggestions,
    arc_issues: arcIssues,
    similarity_scores: similarityScores,
    avg_similarity: avgSimilarity,
    dialogue_profiles: dialogueProfiles,
    dialogue_issues: dialogueIssues,
    dialogue_map: dialogueMap,
    top_genres: topGenres,
    genre_drift_issues: genreDriftIssues,
    report,
    style_result: { ...styleResult, diff: normalizedDiff },
    enhanced_text: data.enhanced_text || styleResult.enhanced,
    character_timeline: characterTimeline,
    market_trends: marketTrends,
    illustrations,
  };
}

function toTitle(text) {
  return String(text || "General")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function mode(values = []) {
  const counts = values.reduce((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
}

function inferGenreRow(paragraph, index) {
  const lower = String(paragraph || "").toLowerCase();
  const has = (pattern) => (lower.match(pattern) || []).length;
  const scores = {
    thriller: has(/\b(chase|alarm|danger|escape|weapon|blood)\b/g) * 2,
    mystery: has(/\b(clue|detective|suspect|evidence|secret)\b/g) * 2,
    fantasy: has(/\b(magic|kingdom|dragon|spell|realm)\b/g) * 2,
    romance: has(/\b(love|kiss|heart|embrace|whisper)\b/g) * 2,
    academic: has(/\b(study|analysis|method|framework|citation)\b/g) * 2,
    neutral: 1,
  };
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[0] || "neutral";
  const total = sorted.reduce((sum, entry) => sum + entry[1], 0) || 1;
  const colors = {
    thriller: "#ef4444",
    mystery: "#a855f7",
    fantasy: "#f59e0b",
    romance: "#ec4899",
    academic: "#0ea5a5",
    neutral: "#64748b",
  };
  return {
    paragraph: index,
    top_genre: top,
    confidence: +(scores[top] / total).toFixed(2),
    scores,
    color: colors[top] || "#64748b",
  };
}

function buildCharacterNodes(characters, paragraphCount) {
  if (!Array.isArray(characters) || characters.length === 0) {
    return [{
      id: "Narrator",
      name: "Narrator",
      val: Math.max(paragraphCount, 1) * 3,
      color: "#22d3ee",
      paragraphs: Array.from({ length: Math.max(paragraphCount, 1) }, (_, i) => i + 1),
      appearances: Math.max(paragraphCount, 1),
      hasIssue: false,
      locations: [],
      emotions: [],
      x: 0,
      y: 0,
      z: 0,
    }];
  }

  return characters.map((char, idx) => {
    const mentionCount = Math.max(1, Number(char.mention_count || 1));
    const first = Math.max(1, Number(char.first_mention_paragraph || 0) + 1);
    const seen = Array.from({ length: mentionCount }, (_, i) => Math.min(paragraphCount || 1, first + i));
    const angle = (idx / Math.max(characters.length, 1)) * Math.PI * 2;
    return {
      id: char.name,
      name: char.name,
      val: mentionCount * 3,
      color: mentionCount < 2 ? "#ef4444" : "#22d3ee",
      paragraphs: seen,
      appearances: mentionCount,
      hasIssue: mentionCount < 2,
      locations: [],
      emotions: Array.isArray(char.traits) ? char.traits : [],
      x: Math.cos(angle) * 180,
      y: Math.sin(angle) * 180,
      z: Math.sin(angle * 0.5) * 90,
    };
  });
}

function buildCharacterEdges(nodes) {
  const edges = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const left = nodes[i];
      const right = nodes[j];
      const overlap = left.paragraphs.filter((p) => right.paragraphs.includes(p)).length;
      if (!overlap) continue;
      edges.push({
        source: left.id,
        target: right.id,
        value: overlap,
        color: overlap > 2 ? "#f59e0b" : "#4b5563",
        label: `Appear together in ${overlap} paragraph(s)`,
      });
    }
  }
  return edges;
}

function splitParagraphs(text) {
  const rawText = String(text || "");
  const byBlankLine = rawText
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (byBlankLine.length > 1) {
    return shouldMergeMicroParagraphs(byBlankLine)
      ? mergeMicroParagraphs(byBlankLine)
      : byBlankLine;
  }

  const bySingleLine = rawText
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (bySingleLine.length > 1) {
    return shouldMergeMicroParagraphs(bySingleLine)
      ? mergeMicroParagraphs(bySingleLine)
      : bySingleLine;
  }

  const sentences = extractSentences(rawText);
  if (sentences.length > 1) {
    const chunks = [];
    for (let i = 0; i < sentences.length; i += 2) {
      chunks.push(sentences.slice(i, i + 2).join(" "));
    }
    return chunks;
  }

  return byBlankLine.length ? byBlankLine : (rawText.trim() ? [rawText.trim()] : []);
}

function buildSimilarityScores(paragraphs) {
  if (paragraphs.length <= 1) return [];

  const scores = [];
  for (let i = 0; i < paragraphs.length - 1; i += 1) {
    const leftParagraph = paragraphs[i];
    const rightParagraph = paragraphs[i + 1];
    const lastSentence = getLastSentence(leftParagraph);
    const firstSentence = getFirstSentence(rightParagraph);
    const boundarySimilarity = lexicalSimilarity(lastSentence, firstSentence);
    const paragraphSimilarity = lexicalSimilarity(leftParagraph, rightParagraph);
    const transitionBonus = hasTransitionCue(rightParagraph) ? 0.08 : 0;
    const shortBlockBonus = (isShortParagraph(leftParagraph) || isShortParagraph(rightParagraph)) ? 0.08 : 0;
    const dialogueBonus = (looksDialogueLike(leftParagraph) && looksDialogueLike(rightParagraph)) ? 0.07 : 0;
    const combined =
      boundarySimilarity * 0.55
      + paragraphSimilarity * 0.45
      + transitionBonus
      + shortBlockBonus
      + dialogueBonus;
    scores.push(Number(clamp01(combined).toFixed(3)));
  }
  return scores;
}

function normalizeSimilarityScores(input) {
  if (!Array.isArray(input)) return [];

  return input
    .map((value) => parseNormalizedScore(value))
    .filter((value) => Number.isFinite(value))
    .map((value) => clamp01(value));
}

function hydrateSimilarityScores(baseScores, structuralIssues) {
  const scores = Array.isArray(baseScores) ? baseScores.map((value) => clamp01(Number(value) || 0)) : [];
  if (!Array.isArray(structuralIssues) || structuralIssues.length === 0 || scores.length === 0) {
    return scores;
  }

  const transitionGaps = structuralIssues.filter(
    (issue) => String(issue?.issue_type || "").toLowerCase() === "transition_gap",
  );
  if (transitionGaps.length === 0) return scores;

  if (transitionGaps.length > Math.max(scores.length + 8, Math.round(scores.length * 1.5))) {
    return scores;
  }

  const transitionGapScores = transitionGaps
    .map((issue) => parseNormalizedScore(issue?.score))
    .filter((value) => Number.isFinite(value));
  const transitionAvg = transitionGapScores.length
    ? transitionGapScores.reduce((sum, value) => sum + value, 0) / transitionGapScores.length
    : null;
  if (transitionGapScores.length >= 24 && Number.isFinite(transitionAvg) && transitionAvg <= 0.08) {
    return scores;
  }

  transitionGaps.forEach((issue) => {
    if (String(issue?.issue_type || "").toLowerCase() !== "transition_gap") return;
    const boundary = issue?.location?.between_paragraphs;
    if (!Array.isArray(boundary) || boundary.length < 2) return;
    const from = Number(boundary[0]);
    const score = parseNormalizedScore(issue?.score);
    if (!Number.isFinite(score)) return;

    // Backends sometimes use 0-based and sometimes 1-based paragraph indices.
    const targetIndex = [from, from - 1].find(
      (candidate) => Number.isInteger(candidate) && candidate >= 0 && candidate < scores.length,
    );
    if (targetIndex === undefined) return;
    scores[targetIndex] = clamp01(score);
  });

  return scores;
}

function shouldMergeMicroParagraphs(blocks) {
  if (!Array.isArray(blocks) || blocks.length < 10) return false;
  const wordCounts = blocks.map((block) => countWords(block));
  const tinyRatio = wordCounts.filter((count) => count <= 8).length / Math.max(wordCounts.length, 1);
  const avgWords = wordCounts.reduce((sum, count) => sum + count, 0) / Math.max(wordCounts.length, 1);
  return tinyRatio >= 0.45 || avgWords < 14;
}

function mergeMicroParagraphs(blocks) {
  const cleaned = (Array.isArray(blocks) ? blocks : [])
    .map((block) => String(block || "").trim())
    .filter(Boolean);
  if (cleaned.length <= 1) return cleaned;

  const merged = [];
  let bucket = [];
  let bucketWords = 0;

  cleaned.forEach((block) => {
    const words = countWords(block);
    const sceneHeading = isSceneHeading(block);
    if (sceneHeading && bucket.length > 0) {
      merged.push(bucket.join("\n"));
      bucket = [];
      bucketWords = 0;
    }

    bucket.push(block);
    bucketWords += words;

    const reachedTarget = bucketWords >= 36 && /[.!?]["')\]]*$/.test(block);
    const reachedHardCap = bucketWords >= 64 || bucket.length >= 5;
    if (reachedTarget || reachedHardCap) {
      merged.push(bucket.join("\n"));
      bucket = [];
      bucketWords = 0;
    }
  });

  if (bucket.length > 0) {
    merged.push(bucket.join("\n"));
  }

  return merged.length > 1 ? merged : cleaned;
}

function countWords(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function isSceneHeading(text) {
  const value = String(text || "").trim();
  return /^(INT\.|EXT\.|FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:|SCENE\s+\d+)/i.test(value);
}

function hasTransitionCue(text) {
  return /\b(however|therefore|meanwhile|later|afterward|suddenly|then|next|finally|as a result|in contrast)\b/i.test(
    String(text || ""),
  );
}

function isShortParagraph(text) {
  return countWords(text) <= 10;
}

function looksDialogueLike(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  if (/"/.test(value)) return true;
  if (/^[A-Z][A-Z0-9 .'-]{1,28}$/.test(value)) return true;
  return /^[A-Z][A-Za-z0-9 .'-]{1,24}:\s*/.test(value);
}

function normalizeConsistencyIssue(issue) {
  if (typeof issue === "string") {
    return {
      message: issue.trim() || "Consistency issue detected.",
      severity: "medium",
      category: "Consistency",
    };
  }

  if (!issue || typeof issue !== "object") {
    return {
      message: String(issue ?? "").trim() || "Consistency issue detected.",
      severity: "medium",
      category: "Consistency",
    };
  }

  const message =
    issue?.message
    || issue?.explanation
    || issue?.issue
    || issue?.reason
    || issue?.text
    || "Consistency issue detected.";

  return {
    ...issue,
    message: String(message),
    severity: String(issue?.severity || issue?.level || "medium").toLowerCase(),
    category: issue?.category || "Consistency",
  };
}

function normalizeContradictions(contradictions) {
  if (!Array.isArray(contradictions)) return [];
  return contradictions.map((item) => normalizeConsistencyIssue({
    category: "Consistency",
    severity: item?.severity || "high",
    message:
      item?.explanation
      || `Potential contradiction around ${item?.entity || "narrative details"}.`,
    location: {
      paragraphA: item?.section_a?.paragraph,
      paragraphB: item?.section_b?.paragraph,
    },
  }));
}

function normalizeStructuralConsistencyIssues(structuralIssues) {
  if (!Array.isArray(structuralIssues)) return [];
  const structuralConsistencyTypes = new Set(["logical_jump", "timeline_error"]);

  return structuralIssues
    .filter((item) => structuralConsistencyTypes.has(String(item?.issue_type || "").toLowerCase()))
    .map((item) => normalizeConsistencyIssue({
      category: "Consistency",
      severity: item?.severity || "medium",
      message:
        item?.explanation
        || item?.message
        || "Structural consistency issue detected.",
      issue_type: item?.issue_type,
      location: item?.location,
      score: parseNormalizedScore(item?.score),
    }));
}

function buildTransitionConsistencyIssues(similarityScores) {
  if (!Array.isArray(similarityScores) || similarityScores.length === 0) return [];

  return similarityScores
    .map((value, index) => {
      const score = clamp01(Number(value) || 0);
      if (score >= 0.18) return null;
      return normalizeConsistencyIssue({
        category: "Consistency",
        severity: score < 0.1 ? "high" : "medium",
        issue_type: "transition_gap",
        score,
        message: `Low continuity between paragraph ${index + 1} and paragraph ${index + 2} (similarity ${score.toFixed(2)}).`,
      });
    })
    .filter(Boolean)
    .slice(0, 60);
}

function mergeConsistencyIssues(groups = []) {
  const seen = new Set();
  const merged = [];

  groups.forEach((group) => {
    if (!Array.isArray(group)) return;
    group.forEach((issue) => {
      const normalized = normalizeConsistencyIssue(issue);
      const key = `${normalized.message}|${normalized.severity}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(normalized);
    });
  });

  return merged;
}

function extractSentences(text) {
  const matches = String(text || "").match(/[^.!?]+[.!?]?/g);
  return (matches || []).map((part) => part.trim()).filter(Boolean);
}

function getLastSentence(text) {
  const sentences = extractSentences(text);
  return sentences[sentences.length - 1] || "";
}

function getFirstSentence(text) {
  const sentences = extractSentences(text);
  return sentences[0] || "";
}

function lexicalSimilarity(textA, textB) {
  const stopWords = new Set([
    "the", "a", "an", "is", "was", "were", "are", "been", "be", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
    "shall", "can", "need", "dare", "ought", "used", "to", "of", "in", "for", "on",
    "with", "at", "by", "from", "as", "into", "through", "during", "before", "after",
    "above", "below", "between", "under", "again", "further", "then", "once", "here",
    "there", "when", "where", "why", "how", "all", "each", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "just", "and", "but", "if", "or", "because", "until", "while",
    "although", "though",
  ]);

  const tokenize = (value) => {
    const tokens = String(value || "").toLowerCase().match(/\b\w+\b/g) || [];
    return new Set(tokens.filter((token) => !stopWords.has(token)));
  };

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  const tokenJaccard = jaccardSimilarity(tokensA, tokensB);

  const stemsA = new Set(Array.from(tokensA).map((token) => lightStem(token)));
  const stemsB = new Set(Array.from(tokensB).map((token) => lightStem(token)));
  const stemJaccard = jaccardSimilarity(stemsA, stemsB);

  const trigramSimilarity = textTrigramSimilarity(textA, textB);
  const namedEntityOverlap = namedEntityContinuity(textA, textB);

  return clamp01(
    tokenJaccard * 0.45
    + stemJaccard * 0.2
    + trigramSimilarity * 0.2
    + namedEntityOverlap * 0.15,
  );
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1;
  });
  const union = setA.size + setB.size - intersection;
  return union ? intersection / union : 0;
}

function lightStem(token) {
  return String(token || "").replace(/(ing|edly|ed|ly|es|s)$/i, "");
}

function textTrigramSimilarity(textA, textB) {
  const as = trigrams(textA);
  const bs = trigrams(textB);
  return jaccardSimilarity(as, bs);
}

function trigrams(text) {
  const normalized = String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalized) return new Set();
  if (normalized.length < 3) return new Set([normalized]);
  const out = new Set();
  for (let i = 0; i <= normalized.length - 3; i += 1) {
    out.add(normalized.slice(i, i + 3));
  }
  return out;
}

function namedEntityContinuity(textA, textB) {
  const entitiesA = extractNamedEntityTokens(textA);
  const entitiesB = extractNamedEntityTokens(textB);
  return jaccardSimilarity(entitiesA, entitiesB);
}

function extractNamedEntityTokens(text) {
  const matches = String(text || "").match(/\b[A-Z][a-zA-Z]{2,}\b/g) || [];
  return new Set(matches.map((token) => token.toLowerCase()));
}

function parseNormalizedScore(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value > 1 ? value / 100 : value;
  }

  if (value && typeof value === "object") {
    return parseNormalizedScore(value.score ?? value.similarity ?? value.value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const isPercent = trimmed.endsWith("%");
    const numeric = Number(isPercent ? trimmed.slice(0, -1).trim() : trimmed);
    if (!Number.isFinite(numeric)) return null;
    if (isPercent) return numeric / 100;
    return numeric > 1 ? numeric / 100 : numeric;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed > 1 ? parsed / 100 : parsed;
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function buildDialogueMap(paragraphs, nodes) {
  const names = nodes.map((node) => node.name);
  const map = {};
  paragraphs.forEach((paragraph) => {
    const quotes = paragraph.match(/"([^"]+)"/g) || [];
    quotes.forEach((raw) => {
      const quote = raw.slice(1, -1).trim();
      if (!quote) return;
      const speaker = names.find((name) => new RegExp(`${name}[^.?!]*"`, "i").test(paragraph)) || names[0] || "Narrator";
      map[speaker] = map[speaker] || [];
      map[speaker].push(quote);
    });
  });
  if (Object.keys(map).length === 0) {
    map.Narrator = paragraphs.slice(0, 2).map((p) => p.slice(0, 160));
  }
  return map;
}

function buildDialogueProfiles(dialogueMap) {
  const profiles = {};
  Object.entries(dialogueMap).forEach(([speaker, lines]) => {
    const joined = lines.join(" ");
    const words = joined.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const unique = new Set(words);
    const sentences = joined.split(/[.!?]+/).filter(Boolean).length || 1;
    profiles[speaker] = {
      vocab_richness: +(unique.size / Math.max(words.length, 1)).toFixed(2),
      avg_sentence_len: +(words.length / sentences).toFixed(2),
      formality: +((joined.match(/\b(therefore|however|thus|moreover)\b/gi) || []).length / Math.max(words.length, 1)).toFixed(2),
      exclamation_rate: +((joined.match(/!/g) || []).length / sentences).toFixed(2),
      question_rate: +((joined.match(/\?/g) || []).length / sentences).toFixed(2),
    };
  });
  return profiles;
}

function buildCharacterTimeline(nodes, arcMap, totalParagraphs) {
  const rows = nodes.map((node) => {
    const appearances = [...(node.paragraphs || [])].sort((a, b) => a - b);
    const appearanceCount = appearances.length;
    const first = appearances[0] || 1;
    const last = appearances[appearanceCount - 1] || first;
    const gaps = appearances.slice(1).map((value, idx) => value - appearances[idx]);
    const avgGap = gaps.length ? +(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2) : 0;
    const predictedNext = Math.min(totalParagraphs || 1, last + Math.max(1, Math.round(avgGap || 1)));
    const absenceGap = Math.max(0, (totalParagraphs || 1) - last);
    return {
      character: node.name,
      role: appearanceCount >= 4 ? "Main Character" : appearanceCount >= 2 ? "Supporting Character" : "Background",
      appearances,
      appearance_count: appearanceCount,
      first_appearance: first,
      last_appearance: last,
      avg_gap: avgGap,
      coverage_ratio: +(appearanceCount / Math.max(totalParagraphs || 1, 1)).toFixed(2),
      absence_gap: absenceGap,
      predicted_next: predictedNext,
    };
  });

  const predictions = rows.map((row) => ({
    character: row.character,
    last_seen: row.last_appearance,
    next_predicted: row.predicted_next,
    reason: row.avg_gap > 0 ? "Based on historical appearance gap" : "Maintain arc continuity",
    warning: row.absence_gap > Math.max(2, Math.floor((totalParagraphs || 1) * 0.15))
      ? `${row.character} has been absent for ${row.absence_gap} paragraph(s)`
      : "",
    arc_obligation: row.role === "Main Character"
      ? "Keep this character active through core arc transitions."
      : "",
  }));

  const arcBands = Array.isArray(arcMap)
    ? arcMap.map((entry) => ({ paragraph: entry.paragraph, phase: entry.phase }))
    : [];

  return {
    rows,
    predictions,
    arc_bands: arcBands,
    total_paragraphs: totalParagraphs || 1,
  };
}

function buildMarketTrends(dominantGenre, pacing, issueCount) {
  const avgPacing = pacing.length
    ? pacing.reduce((sum, row) => sum + Number(row.pacing_score || 0), 0) / pacing.length
    : 5;
  const alignment = Math.max(25, Math.min(92, Math.round(60 + (avgPacing - 5) * 7 - Math.min(issueCount, 12))));
  const health = alignment >= 75 ? "growing" : alignment >= 62 ? "strong" : alignment >= 45 ? "stable" : "cooling";

  return {
    alignment_score: alignment,
    market_health: health,
    summary:
      alignment >= 70
        ? "Current draft aligns with reader expectations for this genre."
        : "Draft direction is promising, but revision can improve market fit.",
    matches: [
      avgPacing >= 5 ? "Pacing pattern is commercially viable." : "Reflective pacing may suit niche audiences.",
      "Narrative consistency checks are active.",
    ],
    gaps: issueCount > 8
      ? ["Issue density is high in current draft sections.", "Tighten scene objectives for better retention."]
      : ["Increase scene-to-scene tension contrast for stronger progression."],
    trending_subgenres: [
      { name: `${String(dominantGenre || "neutral").replace(/_/g, " ")} crossover`, pace: "balanced" },
      { name: "Character-driven suspense", pace: "brisk" },
      { name: "High-clarity prose", pace: "steady" },
    ],
    hot_tropes: ["Escalating stakes", "Payoff callbacks", "Voice contrast"],
    avoid_tropes: [
      { name: "Late exposition dump", reason: "Reduces momentum in key sections." },
      { name: "Abrupt motivation shifts", reason: "Weakens character coherence." },
    ],
  };
}

function buildMockIllustrations(paragraphs, genre) {
  return paragraphs.slice(0, 4).map((paragraph, index) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='840' height='460'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0%' stop-color='#0f172a'/><stop offset='100%' stop-color='#1d4ed8'/></linearGradient></defs><rect width='840' height='460' fill='url(#g)'/><rect x='24' y='24' width='792' height='412' rx='14' fill='none' stroke='#94a3b8' stroke-width='2'/><text x='44' y='82' fill='#e2e8f0' font-family='Georgia, serif' font-size='28'>Scene ${index + 1}</text><text x='44' y='128' fill='#cbd5e1' font-family='Georgia, serif' font-size='18'>${escapeXml(String(genre || "neutral").replace(/_/g, " "))}</text><text x='44' y='186' fill='#e2e8f0' font-family='Georgia, serif' font-size='15'>${escapeXml(paragraph.slice(0, 180))}</text><text x='44' y='420' fill='#94a3b8' font-family='Georgia, serif' font-size='13'>Mock image mode (no paid API call)</text></svg>`;
    return {
      paragraph: index + 1,
      source_text: paragraph,
      prompt: `Cinematic scene ${index + 1}: ${paragraph.slice(0, 140)}`,
      mode: "mock",
      status: "generated",
      art_style: "cinematic",
      image_url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    };
  });
}

function normalizeRecentDocument(raw) {
  return {
    id: raw?.id || "",
    title: raw?.title || "Untitled Document",
    updatedAt: raw?.updatedAt || raw?.updated_at || new Date().toISOString(),
  };
}

function extractPlainText(rawContent) {
  if (!rawContent || typeof rawContent !== "object") return "";

  if (typeof rawContent.text === "string") {
    return rawContent.text;
  }

  if (typeof rawContent.plainText === "string") {
    return rawContent.plainText;
  }

  if (!Array.isArray(rawContent.content)) {
    return "";
  }

  const paragraphs = rawContent.content
    .map((node) => readNodeText(node).trim())
    .filter(Boolean);

  return paragraphs.join("\n\n");
}

function extractSetupContext(rawContent) {
  if (!rawContent || typeof rawContent !== "object") return null;

  const candidate =
    rawContent?.meta?.setupContext
    || rawContent?.setupContext
    || rawContent?.context
    || null;

  return isSetupContext(candidate) ? candidate : null;
}

function isSetupContext(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNodeText(node) {
  if (!node || typeof node !== "object") return "";

  if (typeof node.text === "string") return node.text;
  if (node.type === "hardBreak") return "\n";

  if (!Array.isArray(node.content)) return "";
  return node.content.map((child) => readNodeText(child)).join("");
}

function buildDocumentPayload(text, setupContext = null) {
  const paragraphs = String(text || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const content = paragraphs.length
    ? paragraphs.map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph }],
    }))
    : [{ type: "paragraph", content: [] }];

  const meta = {
    source: "scriptiq-editor",
    updatedAt: new Date().toISOString(),
  };

  if (isSetupContext(setupContext)) {
    meta.setupContext = setupContext;
  }

  return {
    type: "doc",
    plainText: String(text || ""),
    content,
    meta,
  };
}

function deriveTitleFromFileName(fileName) {
  const normalized = String(fileName || "").trim();
  if (!normalized) return "";
  const withoutExtension = normalized.replace(/\.[^.]+$/, "");
  return withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function toFileSafeName(value) {
  return String(value || "untitled-document")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled-document";
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
