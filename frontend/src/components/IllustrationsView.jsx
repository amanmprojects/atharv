import { useState } from "react";

export default function IllustrationsView({
  result = {},
  images = [],
  setImages = () => {},
}) {
  const [artStyle, setArtStyle] = useState("illustrated");
  const [mode, setMode] = useState("mock");
  const [generating, setGenerating] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setGenerating(false);
    }, 2000);
  };

  const paragraphs = result.text ? result.text.split("\n").filter((p) => p.trim()) : [];
  const pacing = result.pacing || [];
  const arcMap = result.arc_map || [];

  // Mock image data for demo
  const mockImages = paragraphs
    .slice(0, 5)
    .map((para, idx) => ({
      paragraph_index: idx,
      text_preview: para.substring(0, 100),
      visual_sentence: para.split(".")[0] || para.substring(0, 80),
      char_desc: "Complex character with striking features and meaningful bearing",
      mood_desc: pacing[idx]?.score > 6 ? "Tense, high energy, dramatic lighting" : "Calm, contemplative, peaceful",
      genre_style: "Cinematic composition with professional lighting",
      art_style: artStyle,
      full_prompt:
        `${para.split(".")[0] || para.substring(0, 80)}, a complex character with striking features, ` +
        `${pacing[idx]?.score > 6 ? "tense dramatic lighting" : "soft contemplative mood"}, ` +
        `professional ${artStyle} style, detailed, artistic, high quality`,
      negative_prompt:
        "blurry, low quality, deformed, watermark, text, logo, ugly, bad anatomy",
    }));

  return (
    <div className="illustrations-container">
      <div className="illustrations-header">
        <div style={{ fontSize: 24, fontFamily: "var(--font-display)" }}>
          🎨 Scene Illustrations
        </div>
      </div>

      {/* Controls Bar */}
      <div className="illustrations-controls">
        <div className="controls-group">
          <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Art Style
          </label>
          <div className="style-buttons">
            {[
              { name: "photorealistic", label: "📷 Photo" },
              { name: "illustrated", label: "🎨 Illustrated" },
              { name: "watercolor", label: "🎭 Watercolor" },
              { name: "comic", label: "💭 Comic" },
              { name: "concept_art", label: "✨ Concept" },
            ].map((style) => (
              <button
                key={style.name}
                className={`style-btn ${artStyle === style.name ? "active" : ""}`}
                onClick={() => setArtStyle(style.name)}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className="controls-group">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 4,
                background: mode === "mock" ? "#f59e0b22" : "#10b98122",
                color: mode === "mock" ? "#f59e0b" : "#10b981",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {mode === "mock" ? "🎭 Demo Mode" : "🔌 API Mode"}
            </div>
            <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? "⏳ Generating..." : "✨ Generate All"}
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner for Demo */}
      {mode === "mock" && (
        <div
          style={{
            background: "#f59e0b22",
            border: "1px solid #f59e0b",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 12,
            color: "#fcd34d",
          }}
        >
          ℹ️ <strong>Demo Mode:</strong> Showing generated prompts. Connect a Stability AI or DALL-E API key to
          generate real images.
        </div>
      )}

      {/* Scene Cards */}
      <div className="scenes-grid">
        {mockImages.map((img) => (
          <div key={img.paragraph_index} className="scene-card">
            {/* Left Side - Image Area */}
            <div className="scene-image">
              {!img.image_url ? (
                <div className="image-placeholder">
                  <div className="placeholder-content">
                    <div style={{ fontSize: 32 }}>🎨</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
                      {mode === "mock" ? "Mock Mode" : "Generating..."}
                    </div>
                    {mode === "mock" && (
                      <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>
                        P{img.paragraph_index + 1}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <img src={img.image_url} alt={`Scene ${img.paragraph_index}`} />
              )}
            </div>

            {/* Right Side - Text and Prompt */}
            <div className="scene-info">
              <div className="scene-meta">
                <span style={{ fontSize: 10, background: "#22d3ee22", color: "#22d3ee", padding: "2px 8px", borderRadius: 3 }}>
                  Paragraph {img.paragraph_index + 1}
                </span>
                <span style={{ fontSize: 10, background: "#f59e0b22", color: "#f59e0b", padding: "2px 8px", borderRadius: 3 }}>
                  {pacing[img.paragraph_index]?.score || 5}/10 Pacing
                </span>
              </div>

              <div className="scene-text">
                <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
                  {img.text_preview}...
                </div>
              </div>

              {/* Prompt Details */}
              <div
                className="prompt-section"
                onClick={() => setExpandedPrompt(expandedPrompt === img.paragraph_index ? null : img.paragraph_index)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee" }}>
                    📝 View Prompt
                  </span>
                  <span style={{ fontSize: 12 }}>{expandedPrompt === img.paragraph_index ? "▼" : "▶"}</span>
                </div>

                {expandedPrompt === img.paragraph_index && (
                  <div className="prompt-details">
                    <div className="prompt-layer">
                      <div className="layer-label">Visual Sentence</div>
                      <div className="layer-value">{img.visual_sentence}</div>
                    </div>

                    <div className="prompt-layer">
                      <div className="layer-label">Characters</div>
                      <div className="layer-value">{img.char_desc}</div>
                    </div>

                    <div className="prompt-layer">
                      <div className="layer-label">Mood</div>
                      <div className="layer-value">{img.mood_desc}</div>
                    </div>

                    <div className="prompt-layer">
                      <div className="layer-label">Genre Style</div>
                      <div className="layer-value">{img.genre_style}</div>
                    </div>

                    <div className="prompt-layer">
                      <div className="layer-label">Art Style</div>
                      <div className="layer-value">
                        {artStyle === "photorealistic" && "Photorealistic, 8K, hyperdetailed"}
                        {artStyle === "illustrated" && "Illustrated novel style, detailed ink linework"}
                        {artStyle === "watercolor" && "Watercolor painting, soft washes, artistic"}
                        {artStyle === "comic" && "Comic book style, bold outlines, cel shading"}
                        {artStyle === "concept_art" && "Concept art, digital painting, ArtStation"}
                      </div>
                    </div>

                    <div className="prompt-layer full-prompt">
                      <div className="layer-label">Full Prompt</div>
                      <textarea
                        readOnly
                        value={img.full_prompt}
                        onClick={(e) => e.target.select()}
                        style={{
                          width: "100%",
                          minHeight: 60,
                          background: "#0d1117",
                          border: "1px solid #1e2d3d",
                          borderRadius: 4,
                          padding: 8,
                          color: "#cbd5e1",
                          fontSize: 10,
                          fontFamily: "monospace",
                          resize: "none",
                          cursor: "text",
                        }}
                      />
                      <button
                        style={{
                          marginTop: 6,
                          padding: "4px 8px",
                          fontSize: 10,
                          background: "#22d3ee22",
                          color: "#22d3ee",
                          border: "1px solid #22d3ee",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                        onClick={() => navigator.clipboard.writeText(img.full_prompt)}
                      >
                        📋 Copy Prompt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockImages.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
          <div>No text to illustrate. Analyze text first to generate images.</div>
        </div>
      )}
    </div>
  );
}
