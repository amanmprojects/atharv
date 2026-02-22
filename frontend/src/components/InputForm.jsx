import { useState } from "react";

export default function InputForm({ onComplete, initialContext = {} }) {
  const [step, setStep] = useState(1);
  const [context, setContext] = useState(initialContext || {});

  const updateField = (field, value) => {
    setContext((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete(context);
  };

  return (
    <div className="input-form-container">
      <div className="form-header">
        <div className="form-title">📋 Setup Your Writing Context</div>
        <div className="form-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <div className="progress-text">Step {step} of 3</div>
        </div>
      </div>

      <div className="form-content">
        {step === 1 && (
          <div className="form-step">
            <h2>About the Writing</h2>

            <div className="form-group">
              <label>Genre</label>
              <select
                value={context.genre || ""}
                onChange={(e) => updateField("genre", e.target.value)}
              >
                <option value="">Select genre...</option>
                <option value="novel">Novel</option>
                <option value="short_story">Short Story</option>
                <option value="script">Script</option>
                <option value="article">Article</option>
                <option value="essay">Essay</option>
                <option value="blog_post">Blog Post</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sub-Genre</label>
              <input
                type="text"
                placeholder="e.g. Dark Romance, Cozy Mystery"
                value={context.subGenre || ""}
                onChange={(e) => updateField("subGenre", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Writing Purpose</label>
              <div className="radio-group">
                {["Entertain", "Inform", "Persuade", "Inspire"].map((purpose) => (
                  <label key={purpose} className="radio-label">
                    <input
                      type="radio"
                      name="purpose"
                      value={purpose.toLowerCase()}
                      checked={context.writingPurpose === purpose.toLowerCase()}
                      onChange={(e) => updateField("writingPurpose", e.target.value)}
                    />
                    {purpose}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Target Word Count</label>
              <select
                value={context.targetWordCount || ""}
                onChange={(e) => updateField("targetWordCount", e.target.value)}
              >
                <option value="">Select range...</option>
                <option value="flash">Flash (&lt;1000)</option>
                <option value="short">Short (1k-10k)</option>
                <option value="novella">Novella (10k-40k)</option>
                <option value="novel">Novel (40k-100k)</option>
                <option value="epic">Epic (100k+)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Draft Stage</label>
              <div className="radio-group">
                {["First Draft", "Revision", "Final Polish"].map((stage) => (
                  <label key={stage} className="radio-label">
                    <input
                      type="radio"
                      name="stage"
                      value={stage.replace(" ", "_").toLowerCase()}
                      checked={context.draftStage === stage.replace(" ", "_").toLowerCase()}
                      onChange={(e) => updateField("draftStage", e.target.value)}
                    />
                    {stage}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2>About the Audience</h2>

            <div className="form-group">
              <label>Target Age Group</label>
              <div className="radio-group">
                {["Children (8-12)", "YA (13-18)", "Adult", "Academic"].map((group) => (
                  <label key={group} className="radio-label">
                    <input
                      type="radio"
                      name="agegroup"
                      value={group.replace(/[() -]/g, "_").toLowerCase()}
                      checked={
                        context.targetAgeGroup === group.replace(/[() -]/g, "_").toLowerCase()
                      }
                      onChange={(e) => updateField("targetAgeGroup", e.target.value)}
                    />
                    {group}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Reading Level: {["Beginner", "Intermediate", "Advanced"][((context.readingLevel || 2) - 1)]}</label>
              <input
                type="range"
                min="1"
                max="3"
                value={context.readingLevel || 2}
                onChange={(e) => updateField("readingLevel", parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Audience Familiarity</label>
              <div className="radio-group">
                {["New to genre", "Genre fan", "Expert reader"].map((familiarity) => (
                  <label key={familiarity} className="radio-label">
                    <input
                      type="radio"
                      name="familiarity"
                      value={familiarity.replace(" ", "_").toLowerCase()}
                      checked={context.audienceFamiliarity === familiarity.replace(" ", "_").toLowerCase()}
                      onChange={(e) => updateField("audienceFamiliarity", e.target.value)}
                    />
                    {familiarity}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Market Platform</label>
              <select
                value={context.marketPlatform || ""}
                onChange={(e) => updateField("marketPlatform", e.target.value)}
              >
                <option value="">Select platform...</option>
                <option value="self_publish">Self-publish</option>
                <option value="traditional">Traditional</option>
                <option value="web_novel">Web novel</option>
                <option value="academic">Academic journal</option>
                <option value="blog">Blog</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h2>Tone and Style Goals</h2>

            <div className="form-group">
              <label>Desired Tone (select multiple)</label>
              <div className="chips-group">
                {["Dark", "Funny", "Heartwarming", "Tense", "Lyrical", "Suspenseful", "Romantic", "Gritty", "Whimsical"].map((tone) => (
                  <button
                    key={tone}
                    className={`chip ${(context.desiredTone || []).includes(tone.toLowerCase()) ? "active" : ""}`}
                    onClick={() => {
                      const tones = context.desiredTone || [];
                      if (tones.includes(tone.toLowerCase())) {
                        updateField(
                          "desiredTone",
                          tones.filter((t) => t !== tone.toLowerCase())
                        );
                      } else {
                        updateField("desiredTone", [...tones, tone.toLowerCase()]);
                      }
                    }}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Narrative Voice</label>
              <div className="radio-group">
                {["First person", "Third limited", "Third omniscient", "Second person"].map((voice) => (
                  <label key={voice} className="radio-label">
                    <input
                      type="radio"
                      name="voice"
                      value={voice.replace(" ", "_").toLowerCase()}
                      checked={context.narrativeVoice === voice.replace(" ", "_").toLowerCase()}
                      onChange={(e) => updateField("narrativeVoice", e.target.value)}
                    />
                    {voice}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Pacing Preference: {["Very Slow", "Slow", "Moderate", "Fast", "Very Fast"][(context.pacingPreference || 3) - 1]}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={context.pacingPreference || 3}
                onChange={(e) => updateField("pacingPreference", parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Content Sensitivity</label>
              <div className="radio-group">
                {["PG", "PG-13", "Adult"].map((sensitivity) => (
                  <label key={sensitivity} className="radio-label">
                    <input
                      type="radio"
                      name="sensitivity"
                      value={sensitivity.toLowerCase()}
                      checked={context.contentSensitivity === sensitivity.toLowerCase()}
                      onChange={(e) => updateField("contentSensitivity", e.target.value)}
                    />
                    {sensitivity}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-summary">
              <h3>Summary</h3>
              <div className="summary-grid">
                <div>Genre: <strong>{context.genre || "—"}</strong></div>
                <div>Purpose: <strong>{context.writingPurpose || "—"}</strong></div>
                <div>Audience: <strong>{context.targetAgeGroup || "—"}</strong></div>
                <div>Platform: <strong>{context.marketPlatform || "—"}</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn-ghost" onClick={handleBack} disabled={step === 1}>
          ← Back
        </button>
        {step < 3 ? (
          <button className="btn-primary" onClick={handleNext}>
            Next →
          </button>
        ) : (
          <button className="btn-primary" onClick={handleComplete}>
            ✓ Complete Setup
          </button>
        )}
      </div>
    </div>
  );
}
