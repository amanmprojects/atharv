import { useMemo, useState } from "react";

const CATEGORY_ORDER = ["All", "Character", "Consistency", "Structure", "Show", "Pacing", "Dialogue", "Genre"];

function normalizeCategory(issue) {
  const raw = String(issue?.category || issue?.type || "General").toLowerCase();
  if (raw.includes("character")) return "Character";
  if (raw.includes("consistency")) return "Consistency";
  if (raw.includes("structure")) return "Structure";
  if (raw.includes("show")) return "Show";
  if (raw.includes("pacing")) return "Pacing";
  if (raw.includes("dialogue")) return "Dialogue";
  if (raw.includes("genre")) return "Genre";
  return "General";
}

export default function IssuePanel({ report, sortedChanges = [], reviewed = new Set(), onReviewChange = () => { } }) {
  const allIssues = report?.all_issues || [];
  const [resolved, setResolved] = useState(new Set());

  const handleAction = (index, action) => {
    setResolved((prev) => {
      const next = new Set(prev);
      next.add(`${action}-${index}`);
      return next;
    });
  };

  const visibleIssues = allIssues.filter((_, idx) => !resolved.has(`accept-${idx}`) && !resolved.has(`ignore-${idx}`));
  const visibleChanges = sortedChanges.map((change, idx) => ({ change, idx })).filter(({ idx }) => !reviewed.has(idx));

  return (
    <div className="issues-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
      <div className="issues-list" style={{ flex: 1, padding: 0 }}>
        {visibleIssues.length === 0 && visibleChanges.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", textAlign: "center", marginTop: 40, background: 'var(--bg-main)', padding: '24px', borderRadius: '12px', border: '1px dashed var(--border-light)' }}>
            All suggestions addressed!
          </div>
        ) : (
          <>
            {/* Render Direct Text Edits */}
            {visibleChanges.map(({ change, idx }) => (
              <div key={`change-${idx}`} className={`issue-card high`} style={{ marginBottom: '16px', background: 'var(--bg-main)', border: '1px solid var(--brand-primary)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 12px rgba(34, 211, 238, 0.1)' }}>
                <div className="issue-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className={`severity-dot high`} style={{ background: 'var(--brand-primary)' }} />
                  <span className="issue-category" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                    Direct Text Edit
                  </span>
                </div>

                <div className="issue-message" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {change.reason || "Style consistency transform"}
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', borderLeft: '3px solid var(--accent-orange)' }}>
                  <div style={{ color: 'var(--text-secondary)', textDecoration: 'line-through', marginBottom: '6px' }}>{change.original}</div>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{change.replacement}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={() => onReviewChange(idx, true)} style={{ flex: 1, background: 'var(--accent-green)', color: '#000', border: 'none', padding: '8px 0', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}>
                    ✓ Apply Edit
                  </button>
                  <button onClick={() => onReviewChange(idx, false)} style={{ flex: 1, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', padding: '8px 0', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}

            {/* Render Abstract Issues */}
            {visibleIssues.map((issue, currentIndex) => {
              const index = allIssues.indexOf(issue);
              const severity = String(issue.severity || "low").toLowerCase();
              return (
                <div key={index} className={`issue-card ${severity}`} style={{ marginBottom: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="issue-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`severity-dot ${severity}`} />
                    <span className="issue-category" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                      {normalizeCategory(issue)}
                    </span>
                  </div>

                  <div className="issue-message" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {issue.message || issue.issue}
                  </div>

                  {issue.suggestion && (
                    <div className="issue-suggestion" style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-primary)', borderLeft: `3px solid var(--brand-primary)` }}>
                      <span style={{ fontWeight: 'bold', marginRight: '6px' }}>Tip:</span>
                      {issue.suggestion}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => handleAction(index, 'accept')} style={{ flex: 1, background: 'var(--accent-green)', color: '#000', border: 'none', padding: '8px 0', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}>
                      Accept Change
                    </button>
                    <button onClick={() => handleAction(index, 'ignore')} style={{ flex: 1, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', padding: '8px 0', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}>
                      Ignore
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
