import { useEffect, useMemo, useRef, useState } from "react";

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function Editor({
  text,
  setText,
  result,
  onAnalyze,
  loading,
  error,
  documentLoading = false,
  documentSaveState = "idle",
  documentTitle = "Chapter Draft Workspace",
  hasConnectedDocument = false,
  recentDocuments = [],
  recentDocsLoading = false,
  currentDocumentId = "",
  onOpenDocument = () => { },
  onImportFile = async () => { },
  onExportFile = () => { },
  writerType = null,
}) {
  const fileInputRef = useRef(null);

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const paragraphs = text.split("\n\n").filter((p) => p.trim()).length;
    const chars = text.length;
    const readMins = Math.max(1, Math.ceil(words / 220));
    return { words, paragraphs, chars, readMins };
  }, [text]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!loading && !documentLoading && text.trim()) onAnalyze();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [documentLoading, loading, onAnalyze, text]);

  const saveLabel = hasConnectedDocument
    ? documentSaveState === "saving"
      ? "Saving..."
      : documentSaveState === "saved"
        ? "Saved"
        : documentSaveState === "error"
          ? "Save Failed"
          : documentSaveState === "loading"
            ? "Loading..."
            : "Idle"
    : "Local";

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onImportFile(file);
    event.target.value = "";
  };

  return (
    <div className="nws-shell">
      <aside className="nws-left">
        <div className="nws-side-block">
          <div className="nws-side-head">Recently Edited</div>
          {recentDocsLoading ? (
            <div className="nws-empty-copy">Loading documents...</div>
          ) : null}
          {!recentDocsLoading && recentDocuments.length === 0 ? (
            <div className="nws-empty-copy">No saved documents yet.</div>
          ) : null}
          {!recentDocsLoading && recentDocuments.length > 0 ? (
            <>
              {recentDocuments.map((doc) => (
                <button
                  key={doc.id || doc.title}
                  className={`nws-item ${currentDocumentId === doc.id ? "active" : ""}`}
                  onClick={() => onOpenDocument(doc.id, doc.title)}
                >
                  <span className="nws-item-title">{doc.title || "Untitled Document"}</span>
                  <span className="nws-item-meta">{formatRelativeTime(doc.updatedAt)}</span>
                </button>
              ))}
            </>
          ) : null}
        </div>
      </aside>

      <section className="nws-center">
        {error && <div className="error-message">{error}</div>}

        <div className="nws-paper-wrap">
          {(loading || documentLoading) && (
            <div className="loading-overlay">
              <div className="loading-ring" />
              <div className="loading-text">
                {documentLoading ? "Loading document..." : "Analyzing narrative..."}
              </div>
            </div>
          )}

          <div className="nws-paper" style={{ position: 'relative' }}>
            <h1>{documentTitle || "Chapter Draft Workspace"}</h1>
            <textarea
              className="nws-editor"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write or paste your content here. Use paragraph breaks for better pacing and arc analysis."
              spellCheck={false}
            />
          </div>
        </div>

        <div className="nws-status">
          <div className="nws-status-left">
            <span>Words: {stats.words}</span>
            <span>Paragraphs: {stats.paragraphs}</span>
            <span>Characters: {stats.chars}</span>
            <span>Read: {stats.readMins}m</span>
            <span className={`nws-save-pill ${documentSaveState}`}>{saveLabel}</span>
          </div>
          <div className="nws-actions">
            <input
              ref={fileInputRef}
              className="nws-file-input"
              type="file"
              accept=".txt,.md,.json,text/plain,text/markdown,application/json"
              onChange={(event) => {
                void handleFileChange(event);
              }}
            />
            <button
              className="btn-ghost nws-action-btn"
              onClick={handleImportClick}
              disabled={loading || documentLoading}
            >
              Import
            </button>
            <button
              className="btn-primary"
              onClick={onAnalyze}
              disabled={loading || documentLoading || !text.trim()}
              style={{ paddingLeft: '24px', paddingRight: '24px', marginLeft: 'auto' }}
            >
              {loading ? "Analyzing..." : "Analyze & Continue →"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
