import { useState } from "react";

const GENRES = ["Novel", "Short Story", "Script", "Article", "Essay", "Blog Post"];
const PURPOSES = ["Entertain", "Inform", "Persuade", "Inspire"];
const WORD_COUNTS = ["Flash (<1000)", "Short (1k-10k)", "Novella (10k-40k)", "Novel (40k-100k)", "Epic (100k+)"];
const DRAFT_STAGES = ["First Draft", "Revision", "Final Polish"];
const AGE_GROUPS = ["Children (8-12)", "YA (13-18)", "Adult", "Academic"];
const READING_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const FAMILIARITY = ["New to genre", "Genre fan", "Expert reader"];
const PLATFORMS = ["Self-publish", "Traditional", "Web novel", "Academic journal", "Blog"];
const TONES = ["Dark", "Funny", "Heartwarming", "Tense", "Lyrical", "Suspenseful", "Romantic", "Gritty", "Whimsical"];
const VOICES = ["First person", "Third limited", "Third omniscient", "Second person"];
const SENSITIVITY = ["PG", "PG-13", "Adult"];

const PACING_LABELS = ["Very Slow", "Slow", "Balanced", "Fast", "Very Fast"];

export default function InputForm({ context, setContext, onComplete }) {
   const [step, setStep] = useState(0);
   const [slideDir, setSlideDir] = useState("right");

   const [form, setForm] = useState({
      genre: context?.writing?.genre || "",
      subGenre: context?.writing?.sub_genre || "",
      writingPurpose: context?.writing?.purpose || "Entertain",
      targetWordCount: context?.writing?.target_word_count || "Short (1k-10k)",
      draftStage: context?.writing?.draft_stage || "First Draft",
      targetAgeGroup: context?.audience?.age_group || "Adult",
      readingLevel: context?.audience?.reading_level || 1,
      audienceFamiliarity: context?.audience?.familiarity || "Genre fan",
      marketPlatform: context?.audience?.market_platform || "Self-publish",
      desiredTone: context?.tone?.desired_tone ? (Array.isArray(context.tone.desired_tone) ? context.tone.desired_tone : [context.tone.desired_tone]) : [],
      narrativeVoice: context?.tone?.narrative_voice || "Third limited",
      pacingPreference: context?.tone?.pacing_preference || 3,
      contentSensitivity: context?.tone?.content_sensitivity || "PG-13",
   });

   const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

   const toggleTone = (tone) => {
      setForm((prev) => {
         const tones = prev.desiredTone.includes(tone)
            ? prev.desiredTone.filter((t) => t !== tone)
            : [...prev.desiredTone, tone];
         return { ...prev, desiredTone: tones };
      });
   };

   const goNext = () => {
      setSlideDir("right");
      setStep((s) => Math.min(s + 1, 3));
   };
   const goBack = () => {
      setSlideDir("left");
      setStep((s) => Math.max(s - 1, 0));
   };

   const handleFinish = () => {
      const ctx = {
         writing: {
            genre: form.genre.toLowerCase() || "unknown",
            sub_genre: form.subGenre,
            purpose: form.writingPurpose.toLowerCase(),
            target_word_count: form.targetWordCount,
            draft_stage: form.draftStage.toLowerCase().replace(/ /g, "_"),
         },
         audience: {
            age_group: form.targetAgeGroup.toLowerCase().replace(/[()]/g, "").replace(/ /g, "_"),
            reading_level: READING_LEVELS[form.readingLevel].toLowerCase(),
            familiarity: form.audienceFamiliarity.toLowerCase().replace(/ /g, "_"),
            market_platform: form.marketPlatform.toLowerCase().replace(/ /g, "_"),
         },
         tone: {
            desired_tone: form.desiredTone.map((t) => t.toLowerCase()),
            narrative_voice: form.narrativeVoice.toLowerCase().replace(/ /g, "_"),
            pacing_preference: PACING_LABELS[form.pacingPreference - 1]?.toLowerCase().replace(/ /g, "_") || "balanced",
            content_sensitivity: form.contentSensitivity.toLowerCase().replace(/-/g, "_"),
         },
      };
      setContext(ctx);
      onComplete();
   };

   const stepLabels = ["About the Writing", "About the Audience", "Tone & Style", "Review"];
   const progress = ((step + 1) / stepLabels.length) * 100;

   return (
      <div className="input-form-container">
         {/* Progress Bar */}
         <div className="form-progress">
            {stepLabels.map((label, i) => (
               <div key={i} className={`form-step-indicator ${i <= step ? "active" : ""} ${i === step ? "current" : ""}`}>
                  <div className="step-number">{i < step ? "✓" : i + 1}</div>
                  <span className="step-label">{label}</span>
               </div>
            ))}
            <div className="form-progress-track">
               <div className="form-progress-fill" style={{ width: `${progress}%` }} />
            </div>
         </div>

         {/* Step Content */}
         <div className="form-step-content" key={step} data-slide={slideDir}>
            {step === 0 && (
               <div className="form-section">
                  <h2 className="form-section-title">📝 About Your Writing</h2>
                  <p className="form-section-desc">Tell us about your manuscript so analysis can be tailored to your genre and goals.</p>

                  <div className="form-grid">
                     <div className="form-field">
                        <label>Genre</label>
                        <select value={form.genre} onChange={(e) => updateField("genre", e.target.value)}>
                           <option value="">Select genre...</option>
                           {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                     </div>

                     <div className="form-field">
                        <label>Sub-Genre</label>
                        <input
                           type="text"
                           placeholder="e.g. Dark Romance, Cozy Mystery..."
                           value={form.subGenre}
                           onChange={(e) => updateField("subGenre", e.target.value)}
                        />
                     </div>

                     <div className="form-field full-width">
                        <label>Writing Purpose</label>
                        <div className="radio-group">
                           {PURPOSES.map((p) => (
                              <button
                                 key={p}
                                 className={`radio-btn ${form.writingPurpose === p ? "selected" : ""}`}
                                 onClick={() => updateField("writingPurpose", p)}
                              >{p}</button>
                           ))}
                        </div>
                     </div>

                     <div className="form-field">
                        <label>Target Word Count</label>
                        <select value={form.targetWordCount} onChange={(e) => updateField("targetWordCount", e.target.value)}>
                           {WORD_COUNTS.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                     </div>

                     <div className="form-field full-width">
                        <label>Draft Stage</label>
                        <div className="radio-group">
                           {DRAFT_STAGES.map((d) => (
                              <button
                                 key={d}
                                 className={`radio-btn ${form.draftStage === d ? "selected" : ""}`}
                                 onClick={() => updateField("draftStage", d)}
                              >{d}</button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {step === 1 && (
               <div className="form-section">
                  <h2 className="form-section-title">🎯 About Your Audience</h2>
                  <p className="form-section-desc">Help us calibrate readability, tone, and market alignment scores.</p>

                  <div className="form-grid">
                     <div className="form-field full-width">
                        <label>Target Age Group</label>
                        <div className="radio-group">
                           {AGE_GROUPS.map((a) => (
                              <button
                                 key={a}
                                 className={`radio-btn ${form.targetAgeGroup === a ? "selected" : ""}`}
                                 onClick={() => updateField("targetAgeGroup", a)}
                              >{a}</button>
                           ))}
                        </div>
                     </div>

                     <div className="form-field full-width">
                        <label>Reading Level</label>
                        <div className="slider-field">
                           <input
                              type="range"
                              min="0"
                              max="2"
                              value={form.readingLevel}
                              onChange={(e) => updateField("readingLevel", Number(e.target.value))}
                           />
                           <div className="slider-labels">
                              {READING_LEVELS.map((l, i) => (
                                 <span key={l} className={form.readingLevel === i ? "active" : ""}>{l}</span>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="form-field full-width">
                        <label>Audience Familiarity</label>
                        <div className="radio-group">
                           {FAMILIARITY.map((f) => (
                              <button
                                 key={f}
                                 className={`radio-btn ${form.audienceFamiliarity === f ? "selected" : ""}`}
                                 onClick={() => updateField("audienceFamiliarity", f)}
                              >{f}</button>
                           ))}
                        </div>
                     </div>

                     <div className="form-field">
                        <label>Market / Platform</label>
                        <select value={form.marketPlatform} onChange={(e) => updateField("marketPlatform", e.target.value)}>
                           {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                     </div>
                  </div>
               </div>
            )}

            {step === 2 && (
               <div className="form-section">
                  <h2 className="form-section-title">🎨 Tone & Style Goals</h2>
                  <p className="form-section-desc">Define the aesthetic direction so analysis modules align with your creative intent.</p>

                  <div className="form-grid">
                     <div className="form-field full-width">
                        <label>Desired Tone <span className="form-hint">(select multiple)</span></label>
                        <div className="chip-group">
                           {TONES.map((t) => (
                              <button
                                 key={t}
                                 className={`tone-chip ${form.desiredTone.includes(t) ? "selected" : ""}`}
                                 onClick={() => toggleTone(t)}
                              >{t}</button>
                           ))}
                        </div>
                     </div>

                     <div className="form-field full-width">
                        <label>Narrative Voice</label>
                        <div className="radio-group">
                           {VOICES.map((v) => (
                              <button
                                 key={v}
                                 className={`radio-btn ${form.narrativeVoice === v ? "selected" : ""}`}
                                 onClick={() => updateField("narrativeVoice", v)}
                              >{v}</button>
                           ))}
                        </div>
                     </div>

                     <div className="form-field full-width">
                        <label>Pacing Preference</label>
                        <div className="slider-field">
                           <input
                              type="range"
                              min="1"
                              max="5"
                              value={form.pacingPreference}
                              onChange={(e) => updateField("pacingPreference", Number(e.target.value))}
                           />
                           <div className="slider-labels pacing-slider-labels">
                              {PACING_LABELS.map((l, i) => (
                                 <span key={l} className={form.pacingPreference === i + 1 ? "active" : ""}>{l}</span>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="form-field full-width">
                        <label>Content Sensitivity</label>
                        <div className="radio-group">
                           {SENSITIVITY.map((s) => (
                              <button
                                 key={s}
                                 className={`radio-btn ${form.contentSensitivity === s ? "selected" : ""}`}
                                 onClick={() => updateField("contentSensitivity", s)}
                              >{s}</button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {step === 3 && (
               <div className="form-section">
                  <h2 className="form-section-title">✅ Review Your Setup</h2>
                  <p className="form-section-desc">Everything look right? This context will tailor all analysis modules to your writing.</p>

                  <div className="summary-card">
                     <div className="summary-section">
                        <h3>📝 Writing</h3>
                        <div className="summary-grid">
                           <div className="summary-item"><span className="summary-label">Genre</span><span className="summary-value">{form.genre || "Not set"}</span></div>
                           <div className="summary-item"><span className="summary-label">Sub-Genre</span><span className="summary-value">{form.subGenre || "—"}</span></div>
                           <div className="summary-item"><span className="summary-label">Purpose</span><span className="summary-value">{form.writingPurpose}</span></div>
                           <div className="summary-item"><span className="summary-label">Word Count</span><span className="summary-value">{form.targetWordCount}</span></div>
                           <div className="summary-item"><span className="summary-label">Draft Stage</span><span className="summary-value">{form.draftStage}</span></div>
                        </div>
                     </div>

                     <div className="summary-section">
                        <h3>🎯 Audience</h3>
                        <div className="summary-grid">
                           <div className="summary-item"><span className="summary-label">Age Group</span><span className="summary-value">{form.targetAgeGroup}</span></div>
                           <div className="summary-item"><span className="summary-label">Reading Level</span><span className="summary-value">{READING_LEVELS[form.readingLevel]}</span></div>
                           <div className="summary-item"><span className="summary-label">Familiarity</span><span className="summary-value">{form.audienceFamiliarity}</span></div>
                           <div className="summary-item"><span className="summary-label">Platform</span><span className="summary-value">{form.marketPlatform}</span></div>
                        </div>
                     </div>

                     <div className="summary-section">
                        <h3>🎨 Tone & Style</h3>
                        <div className="summary-grid">
                           <div className="summary-item"><span className="summary-label">Tones</span><span className="summary-value">{form.desiredTone.length > 0 ? form.desiredTone.join(", ") : "None selected"}</span></div>
                           <div className="summary-item"><span className="summary-label">Voice</span><span className="summary-value">{form.narrativeVoice}</span></div>
                           <div className="summary-item"><span className="summary-label">Pacing</span><span className="summary-value">{PACING_LABELS[form.pacingPreference - 1]}</span></div>
                           <div className="summary-item"><span className="summary-label">Sensitivity</span><span className="summary-value">{form.contentSensitivity}</span></div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Navigation */}
         <div className="form-nav">
            {step > 0 && (
               <button className="btn-ghost" onClick={goBack}>← Back</button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
               <button className="btn-primary" onClick={goNext}>Next →</button>
            ) : (
               <button className="btn-primary form-finish-btn" onClick={handleFinish}>
                  ✨ Looks Good — Start Writing
               </button>
            )}
         </div>
      </div>
   );
}
