import { useMemo, useState } from "react";
import { generateImages } from "../api/client";

const STYLES = [
  { id: "photorealistic", label: "Photorealistic" },
  { id: "illustrated", label: "Illustrated" },
  { id: "watercolor", label: "Watercolour" },
  { id: "comic", label: "Comic" },
  { id: "concept_art", label: "Concept Art" },
];

export default function IllustrationsView({ result, images, setImages, sourceText }) {
  const [artStyle, setArtStyle] = useState("illustrated");
  const [mode, setMode] = useState("mock");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const paragraphs = useMemo(
    () => (sourceText || "").split("\n\n").map((p) => p.trim()).filter(Boolean),
    [sourceText],
  );

  const handleGenerateAll = async () => {
    if (!sourceText?.trim()) {
      setError("Add text in editor before generating illustrations.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(15);
    try {
      const generated = await generateImages(sourceText, artStyle, mode, result);
      setProgress(85);
      setImages(generated || []);
      setProgress(100);
    } catch (err) {
      setError(err?.message || "Image generation failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const copyPrompt = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {
      // no-op
    }
  };

  const cards = images?.length
    ? images
    : paragraphs.map((paragraph, index) => ({
        paragraph_index: index + 1,
        text_preview: paragraph.slice(0, 80),
        full_text: paragraph,
        status: "idle",
      }));

  return (
    <div className="illustrations-wrap pacing-container">
      <div className="pacing-header">
        Scene <span>Illustrations</span>
      </div>

      <section className="pacing-chart-wrap illustrations-controls">
        <div className="illustration-style-row">
          {STYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`setup-chip ${artStyle === item.id ? "active" : ""}`}
              onClick={() => setArtStyle(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="illustration-ops-row">
          <div className={`mode-pill ${mode === "mock" ? "demo" : "api"}`}>{mode === "mock" ? "Demo Mode" : "API Mode"}</div>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="style-select">
            <option value="mock">Mock</option>
            <option value="stability">Stability</option>
            <option value="dalle">DALL-E</option>
          </select>
          <button type="button" className="btn-primary" onClick={handleGenerateAll} disabled={loading}>
            {loading ? "Generating..." : "Generate All Scenes"}
          </button>
        </div>

        {progress > 0 && (
          <div className="gen-progress-track">
            <div className="gen-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {mode === "mock" && (
          <div className="mock-banner">
            Connect a Stability AI or DALL-E API key to generate real images.
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </section>

      <section className="illustration-list">
        {cards.map((card, idx) => {
          const paraNo = card.paragraph_index || idx + 1;
          const paragraphText = card.full_text || paragraphs[paraNo - 1] || "";
          const showPrompt = mode === "mock" || !!card.full_prompt;

          return (
            <article key={`img-${paraNo}`} className="illustration-card">
              <div className="illustration-image-col">
                {loading ? (
                  <div className="img-shimmer">Generating...</div>
                ) : card.image_url ? (
                  <img src={card.image_url} alt={`Scene ${paraNo}`} className="scene-image" />
                ) : (
                  <div className="img-placeholder">?? Mock Mode</div>
                )}
              </div>

              <div className="illustration-meta-col">
                <h4>Paragraph {paraNo}</h4>
                <p>{paragraphText}</p>

                {showPrompt && (
                  <details open={mode === "mock"} className="prompt-panel">
                    <summary>View Prompt</summary>
                    <div className="prompt-row"><strong>Visual Sentence:</strong> {card.visual_sentence || "n/a"}</div>
                    <div className="prompt-row"><strong>Characters:</strong> {card.char_desc || "n/a"}</div>
                    <div className="prompt-row"><strong>Mood:</strong> {card.mood_desc || "n/a"}</div>
                    <div className="prompt-row"><strong>Genre Style:</strong> {card.genre_style || "n/a"}</div>
                    <div className="prompt-row"><strong>Art Style:</strong> {card.art_style || artStyle}</div>
                    <textarea className="prompt-box" readOnly value={card.full_prompt || ""} />
                    <button type="button" className="btn-ghost" onClick={() => copyPrompt(card.full_prompt)}>
                      Copy Prompt
                    </button>
                  </details>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
