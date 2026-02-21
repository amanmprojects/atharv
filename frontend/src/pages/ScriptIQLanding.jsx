import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "Context Consistency",
    desc: "Detect entity drift, timeline mismatches, and narrative discontinuity.",
  },
  {
    title: "Structure Intelligence",
    desc: "Flag weak flow, sentence heaviness, and pacing drop-offs with explainable logic.",
  },
  {
    title: "Controlled Style Shift",
    desc: "Transform tone while preserving meaning with deterministic rewrite rules.",
  },
  {
    title: "Visual Analysis Workspace",
    desc: "Character graph, vibe curve, plot arc, issue center, and explainability in one suite.",
  },
];

export default function ScriptIQLanding() {
  return (
    <div className="nip-page">
      <nav className="nip-nav">
        <div className="nip-brand">
          <span className="nip-brand-icon">S</span>
          <span>SCRIPTIQ</span>
        </div>
        <div className="nip-nav-actions">
          <Link to="/dashboard" className="nip-link">Dashboard</Link>
          <Link to="/editor" className="nip-btn nip-btn-primary">Start Writing</Link>
        </div>
      </nav>

      <section className="nip-hero">
        <p className="nip-chip">Story Intelligence Platform</p>
        <h1>Scholarly Workspace For Serious Writing</h1>
        <p>
          The recently uploaded interface is now active. Your existing backend logic and analysis features are
          fully retained.
        </p>
        <div className="nip-cta-row">
          <Link to="/editor" className="nip-btn nip-btn-accent">Open Workspace</Link>
          <Link to="/explainability" className="nip-btn nip-btn-outline">View Explainability</Link>
        </div>
      </section>

      <section className="nip-feature-grid">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="nip-card">
            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
          </article>
        ))}
      </section>

      <section className="nip-route-strip">
        <Link to="/character-universe">Character Universe</Link>
        <Link to="/consistency">Consistency</Link>
        <Link to="/vibe-graph">Vibe Graph</Link>
        <Link to="/issues">Issue Center</Link>
      </section>
    </div>
  );
}
