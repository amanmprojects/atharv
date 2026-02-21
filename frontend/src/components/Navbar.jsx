export default function Navbar({
  activeView,
  setActiveView,
  hasResult,
  style,
  setStyle,
  onAnalyze,
  loading,
  backendOnline,
}) {
  const tabs = [
    { id: "editor", label: "Editor", always: true },
    { id: "universe", label: "Character Universe" },
    { id: "consistency", label: "Consistency" },
    { id: "pacing", label: "Pacing" },
    { id: "vibe", label: "Vibe Graph" },
    { id: "arc", label: "Plot Arc" },
    { id: "genre", label: "Genre Profile" },
    { id: "dialogue", label: "Dialogue Voice" },
    { id: "explain", label: "Explainability" },
    { id: "issues", label: "Issues" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">SCRIPTIQ</div>

      <div className="nav-tabs">
        {tabs.map((tab) => {
          const disabled = !tab.always && !hasResult;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${activeView === tab.id ? "active" : ""} ${disabled ? "disabled" : ""}`}
              onClick={() => !disabled && setActiveView(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="backend-pill" data-online={backendOnline}>
        {backendOnline ? "Backend Online" : "Backend Offline"}
      </div>

      <div className="nav-right">
        <select className="style-select" value={style} onChange={(e) => setStyle(e.target.value)}>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
          <option value="dramatic">Dramatic</option>
          <option value="journalistic">Journalistic</option>
        </select>
        <button className="btn-primary" onClick={onAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>
      </div>
    </nav>
  );
}
