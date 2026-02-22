import { Link } from "react-router-dom";

export default function Navbar({
  activeView,
  setActiveView,
  hasResult,
  formComplete,
  style,
  setStyle,
  onAnalyze,
  loading,
  backendOnline,
}) {
  const tabs = [
    { id: "form", label: "📋 Setup", always: true },
    { id: "editor", label: "Editor", always: true },
    { id: "enhancement", label: "✨ Enhancement" },
    { id: "character", label: "👥 Characters" },
    { id: "consistency", label: "Consistency" },
    { id: "style", label: "🎭 Style & Tone" },
    { id: "story", label: "📖 Story Arc" },
    { id: "explain", label: "Explainability" },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>SCRIPTIQ</Link>

      <div className="nav-tabs">
        {tabs.map((tab) => {
          const needsResult = !tab.always && !hasResult;
          const disabled = needsResult;
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


    </nav>
  );
}
