import { useEffect, useMemo } from "react";

const SAMPLE_TEXTS = {
  thriller: `Mira locked the steel door and checked the hallway camera feed. The red light blinked twice.

"We have ninety seconds," said Arjun. "If they breach this floor, burn the drive."

Footsteps moved overhead. Mira steadied her breath, slid the keycard into the panel, and waited for the vault to release.`,
  romance: `Asha stood by the rain-streaked window, tracing circles on the glass.

"I was afraid you would not come," she whispered.

Rohan smiled, stepped closer, and placed the old letter in her hands. "I kept every word you wrote."`,
  mystery: `Inspector Nair unfolded the note and frowned at the final line.

The clock had stopped at 10:14, but no one heard it break.

On the mantle, one frame was turned backward. Dust marked where it had been moved recently.`,
};

export default function Editor({ text, setText, result, onAnalyze, loading, error }) {
  const enhanced = result?.enhanced_text || "";
  const issues = result?.report?.all_issues || [];
  const moduleStatus = [
    { name: "Character Graph", value: (result?.character_issues || []).length },
    { name: "Consistency", value: (result?.consistency_issues || []).length },
    { name: "Structure", value: (result?.structure_issues || []).length },
    { name: "Pacing", value: (result?.pacing_suggestions || []).length },
    { name: "Dialogue", value: (result?.dialogue_issues || []).length },
    { name: "Genre Drift", value: (result?.genre_drift_issues || []).length },
    { name: "Plot Arc", value: (result?.arc_issues || []).length },
  ];

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
        if (!loading && text.trim()) onAnalyze();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onAnalyze, text]);

  return (
    <div className="nws-shell">
      <aside className="nws-left">
        <div className="nws-side-block">
          <div className="nws-side-head">Structure</div>
          <button className="nws-item active">Ch 1: Working Draft</button>
          <button className="nws-item">Ch 2: Next Scene</button>
          <button className="nws-item">Ch 3: Resolution</button>
        </div>

        <div className="nws-side-block">
          <div className="nws-side-head">Quick Load</div>
          <button className="nws-item" onClick={() => setText(SAMPLE_TEXTS.thriller)}>Thriller Sample</button>
          <button className="nws-item" onClick={() => setText(SAMPLE_TEXTS.romance)}>Romance Sample</button>
          <button className="nws-item" onClick={() => setText(SAMPLE_TEXTS.mystery)}>Mystery Sample</button>
          <button className="nws-item" onClick={() => setText("")}>Clear</button>
        </div>
      </aside>

      <section className="nws-center">
        {error && <div className="error-message">{error}</div>}

        <div className="nws-paper-wrap">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-ring" />
              <div className="loading-text">Analyzing narrative...</div>
            </div>
          )}

          <div className="nws-paper">
            <h1>Chapter Draft Workspace</h1>
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
          </div>
          <button className="btn-primary" onClick={onAnalyze} disabled={loading || !text.trim()}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </section>

      <aside className="nws-right">
        <div className="nws-panel-head">Suggestions</div>

        <div className="nws-card">
          <div className="nws-card-title">Enhancement Preview</div>
          <p className="nws-card-copy">
            {enhanced
              ? enhanced.slice(0, 240) + (enhanced.length > 240 ? "..." : "")
              : "Run analysis to generate enhanced text and style transformations."}
          </p>
        </div>

        <div className="nws-card">
          <div className="nws-card-title">Top Issues</div>
          {issues.slice(0, 4).map((issue, index) => (
            <div key={`${issue.category || "issue"}-${index}`} className="nws-issue">
              <div className="nws-issue-head">
                <span>{issue.category || "General"}</span>
                <span>{String(issue.severity || "low").toUpperCase()}</span>
              </div>
              <p>{issue.message || issue.issue}</p>
            </div>
          ))}
          {issues.length === 0 && <p className="nws-card-copy">No issues yet. Analyze to populate suggestions.</p>}
        </div>

        <div className="nws-card">
          <div className="nws-card-title">Metrics</div>
          <div className="nws-metric-row">
            <span>Readability</span>
            <strong>{Number(result?.readability_score || 0).toFixed(0)}/100</strong>
          </div>
          <div className="nws-metric-row">
            <span>Total Issues</span>
            <strong>{result?.report?.total_issues ?? 0}</strong>
          </div>
          <div className="nws-metric-row">
            <span>Style Changes</span>
            <strong>{result?.style_result?.num_changes ?? 0}</strong>
          </div>
        </div>

        <div className="nws-card">
          <div className="nws-card-title">Backend Modules</div>
          {moduleStatus.map((module) => (
            <div key={module.name} className="nws-metric-row">
              <span>{module.name}</span>
              <strong>{module.value}</strong>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
