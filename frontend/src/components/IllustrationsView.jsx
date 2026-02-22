import { useState } from "react";
import { generateImages } from "../api/client";

const ART_STYLES = [
   { id: "photorealistic", label: "📷 Photorealistic" },
   { id: "illustrated", label: "🖊️ Illustrated" },
   { id: "watercolor", label: "🎨 Watercolour" },
   { id: "comic", label: "💥 Comic" },
   { id: "concept_art", label: "🖌️ Concept Art" },
];

export default function IllustrationsView({ result, images, setImages }) {
   const [artStyle, setArtStyle] = useState("cinematic");
   const [generating, setGenerating] = useState(false);
   const [progress, setProgress] = useState(0);
   const [expandedPrompts, setExpandedPrompts] = useState({});

   const illustrations = images?.length > 0 ? images : result?.illustrations || [];
   const isMock = illustrations.length > 0 && illustrations[0]?.mode === "mock";

   const togglePrompt = (idx) => {
      setExpandedPrompts((prev) => ({ ...prev, [idx]: !prev[idx] }));
   };

   const handleGenerate = async () => {
      if (!result) return;
      setGenerating(true);
      setProgress(0);
      try {
         const data = await generateImages(
            result._sourceText || "",
            artStyle,
            "mock",
            result
         );
         setImages(data?.images || []);
      } catch (err) {
         console.error("Image generation failed:", err);
      } finally {
         setGenerating(false);
         setProgress(100);
      }
   };

   const copyPrompt = (prompt) => {
      navigator.clipboard.writeText(prompt).catch(() => { });
   };

   if (illustrations.length === 0 && !generating) {
      return (
         <div className="illustrations-container">
            <div className="illustrations-controls">
               <div className="art-style-row">
                  {ART_STYLES.map((s) => (
                     <button
                        key={s.id}
                        className={`art-style-btn ${artStyle === s.id ? "active" : ""}`}
                        onClick={() => setArtStyle(s.id)}
                     >
                        {s.label}
                     </button>
                  ))}
               </div>
               <div className="illustration-actions">
                  <span className="mode-badge mock">🎨 Demo Mode</span>
                  <button className="btn-primary" onClick={handleGenerate}>Generate All Scenes</button>
               </div>
            </div>
            <div className="empty-state">
               <div className="empty-icon">🎨</div>
               <p>Select an art style and click "Generate All Scenes" to create illustrations.</p>
            </div>
         </div>
      );
   }

   return (
      <div className="illustrations-container">
         {/* Controls */}
         <div className="illustrations-controls">
            <div className="art-style-row">
               {ART_STYLES.map((s) => (
                  <button
                     key={s.id}
                     className={`art-style-btn ${artStyle === s.id ? "active" : ""}`}
                     onClick={() => setArtStyle(s.id)}
                  >
                     {s.label}
                  </button>
               ))}
            </div>
            <div className="illustration-actions">
               <span className={`mode-badge ${isMock ? "mock" : "api"}`}>
                  {isMock ? "🎨 Demo Mode" : "🔗 API Mode"}
               </span>
               <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
                  {generating ? "Generating..." : "Regenerate All"}
               </button>
            </div>
         </div>

         {/* Progress bar */}
         {generating && (
            <div className="illustration-progress">
               <div className="illustration-progress-fill" style={{ width: `${progress}%` }} />
            </div>
         )}

         {/* Mock mode banner */}
         {isMock && (
            <div className="mock-banner">
               <span>💡</span>
               Connect a Stability AI or DALL-E API key to generate real images. Prompts below demonstrate the 5-layer prompt builder.
            </div>
         )}

         {/* Scene Cards */}
         <div className="scene-cards">
            {illustrations.map((scene, idx) => {
               const isExpanded = expandedPrompts[idx] !== false; // default open in mock

               return (
                  <div key={idx} className="scene-card">
                     {/* Image Area */}
                     <div className="scene-image-area">
                        {scene.image_url ? (
                           <img
                              src={scene.image_url}
                              alt={`Scene ${scene.paragraph}`}
                              className="scene-image"
                              onError={(e) => { e.target.style.display = "none"; }}
                           />
                        ) : (
                           <div className="scene-placeholder">
                              <span className="placeholder-icon">📷</span>
                              <span className="placeholder-label">{isMock ? "Mock Mode" : "Generating..."}</span>
                           </div>
                        )}
                        <div className="scene-badge">Scene {scene.paragraph}</div>
                     </div>

                     {/* Text + Prompt Area */}
                     <div className="scene-text-area">
                        <p className="scene-source-text">{scene.source_text}</p>

                        <div className="scene-tags">
                           <span className="scene-tag style-tag">🎨 {scene.art_style || artStyle}</span>
                           <span className="scene-tag mode-tag">{scene.mode === "mock" ? "Mock" : "Live"}</span>
                        </div>

                        <div className="prompt-section">
                           <button className="prompt-toggle" onClick={() => togglePrompt(idx)}>
                              {isExpanded ? "▾ Hide Prompt" : "▸ View Prompt"}
                           </button>

                           {isExpanded && (
                              <div className="prompt-layers">
                                 <div className="prompt-layer">
                                    <span className="prompt-layer-label">Full Prompt</span>
                                    <div className="prompt-text-box">
                                       <code>{scene.prompt}</code>
                                       <button
                                          className="copy-prompt-btn"
                                          onClick={() => copyPrompt(scene.prompt)}
                                          title="Copy prompt"
                                       >📋</button>
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}
