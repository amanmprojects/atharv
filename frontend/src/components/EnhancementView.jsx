import React, { useState } from "react";
import IssuePanel from "./IssuePanel";

function HighlightedText({ text, sortedChanges, reviewed, accepted, onReview, onAcceptAll }) {
    const [isEditing, setIsEditing] = useState(false);
    const [manualText, setManualText] = useState("");

    if (!text) return null;
    if (!sortedChanges || sortedChanges.length === 0) return <span>{text}</span>;

    const computeMergedText = () => {
        let elements = [text];
        sortedChanges.forEach((change, idx) => {
            if (!change.original || !change.replacement) return;
            const newElements = [];
            elements.forEach((el) => {
                if (typeof el === "string") {
                    if (el.includes(change.replacement) && change.replacement.length > 3) {
                        const parts = el.split(change.replacement);
                        for (let i = 0; i < parts.length; i++) {
                            newElements.push(parts[i]);
                            if (i < parts.length - 1) {
                                const isReviewed = reviewed.has(idx);
                                const isAccepted = accepted.has(idx);
                                if (isReviewed && !isAccepted) {
                                    newElements.push(change.original);
                                } else {
                                    newElements.push(change.replacement);
                                }
                            }
                        }
                    } else if (el.includes(change.original) && change.original.length > 3) {
                        const parts = el.split(change.original);
                        for (let i = 0; i < parts.length; i++) {
                            newElements.push(parts[i]);
                            if (i < parts.length - 1) {
                                const isReviewed = reviewed.has(idx);
                                const isAccepted = accepted.has(idx);
                                if (isReviewed && isAccepted) {
                                    newElements.push(change.replacement);
                                } else {
                                    newElements.push(change.original);
                                }
                            }
                        }
                    } else {
                        newElements.push(el);
                    }
                } else {
                    newElements.push(el);
                }
            });
            elements = newElements;
        });
        return elements.join("");
    };

    const handleEnableEdit = () => {
        setManualText(computeMergedText());
        setIsEditing(true);
    };

    let elements = [text];

    sortedChanges.forEach((change, idx) => {
        if (!change.original || !change.replacement) return;
        const newElements = [];
        elements.forEach((el) => {
            if (typeof el === "string") {
                if (el.includes(change.replacement) && change.replacement.length > 3) {
                    const parts = el.split(change.replacement);
                    for (let i = 0; i < parts.length; i++) {
                        newElements.push(parts[i]);
                        if (i < parts.length - 1) {
                            const isReviewed = reviewed.has(idx);
                            const isAccepted = accepted.has(idx);

                            if (isReviewed) {
                                if (isAccepted) {
                                    newElements.push(<span key={`hl-${idx}-${i}`} style={{ background: 'rgba(34, 211, 238, 0.1)', borderBottom: '2px solid var(--brand-primary)' }}>{change.replacement}</span>);
                                } else {
                                    newElements.push(<span key={`hl-${idx}-${i}`} style={{ background: 'rgba(239, 68, 68, 0.1)', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{change.original}</span>);
                                }
                            } else {
                                newElements.push(
                                    <span key={`hl-${idx}-${i}`} className="highlighted-text" data-tooltip={`Changed from: "${change.original}"\nReason: ${change.reason}`} style={{ position: 'relative', display: 'inline-block', borderBottom: '2px dotted var(--accent-orange)', cursor: 'help' }}>
                                        {change.replacement}
                                    </span>
                                );
                            }
                        }
                    }
                } else if (el.includes(change.original) && change.original.length > 3) {
                    const parts = el.split(change.original);
                    for (let i = 0; i < parts.length; i++) {
                        newElements.push(parts[i]);
                        if (i < parts.length - 1) {
                            const isReviewed = reviewed.has(idx);
                            const isAccepted = accepted.has(idx);

                            if (isReviewed) {
                                if (isAccepted) {
                                    newElements.push(<span key={`hl-${idx}-${i}`} style={{ background: 'rgba(34, 211, 238, 0.1)', borderBottom: '2px solid var(--brand-primary)' }}>{change.replacement}</span>);
                                } else {
                                    newElements.push(<span key={`hl-${idx}-${i}`} style={{ color: 'var(--text-primary)' }}>{change.original}</span>);
                                }
                            } else {
                                newElements.push(
                                    <span key={`hl-${idx}-${i}`} className="highlighted-text" data-tooltip={`Suggested Rewrite: "${change.replacement}"\nReason: ${change.reason}`} style={{ position: 'relative', display: 'inline-block', borderBottom: '2px dotted var(--brand-primary)', cursor: 'help' }}>
                                        {change.original}
                                    </span>
                                );
                            }
                        }
                    }
                } else {
                    newElements.push(el);
                }
            } else {
                newElements.push(el);
            }
        });
        elements = newElements;
    });

    if (isEditing) {
        return (
            <div>
                <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manual Edit Mode Active. Fine-tune your AI suggestions.</span>
                    <button onClick={() => onAcceptAll(manualText)} style={{ background: 'var(--brand-primary)', color: '#000', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(34, 211, 238, 0.4)' }}>
                        Save to Editor
                    </button>
                </div>
                <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '400px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        fontSize: '1.05rem',
                        lineHeight: '1.9',
                        resize: 'vertical',
                        outline: 'none',
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review the mapped changes. Hover over dotted lines to accept or reject AI improvements.</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleEnableEdit} style={{ background: 'transparent', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Edit Manually
                    </button>
                    <button onClick={() => onAcceptAll(computeMergedText())} style={{ background: 'var(--brand-primary)', color: '#000', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(34, 211, 238, 0.4)' }}>
                        Accept & Continue
                    </button>
                </div>
            </div>
            {elements.map((el, i) => (typeof el === 'string' ? el : React.cloneElement(el, { key: i })))}
        </div>
    );
}

export default function EnhancementView({ result, onExportFile, onApplyText }) {
    const enhanced = result?.enhanced_text || "No enhancements available.";
    const rawChanges = result?.style_result?.change_log || [];

    const sortedChanges = React.useMemo(() => {
        return [...rawChanges].sort((a, b) => (b.replacement || "").length - (a.replacement || "").length);
    }, [rawChanges]);

    const [reviewed, setReviewed] = useState(new Set());
    const [accepted, setAccepted] = useState(new Set());

    const handleReview = (idx, isAccept) => {
        setReviewed(prev => new Set(prev).add(idx));
        if (isAccept) {
            setAccepted(prev => new Set(prev).add(idx));
        } else {
            setAccepted(prev => {
                const next = new Set(prev);
                next.delete(idx);
                return next;
            });
        }
    };

    const sm = result?.sidebar_modules || {};
    const moduleStatus = [
        { name: "Character Graph", value: sm.character_graph ?? (result?.character_issues || []).length },
        { name: "Consistency", value: sm.consistency ?? (result?.consistency_issues || []).length },
        { name: "Structure", value: sm.structure ?? (result?.structure_issues || []).length },
        { name: "Pacing", value: sm.pacing ?? (result?.pacing_suggestions || []).length },
        { name: "Dialogue", value: sm.dialogue ?? (result?.dialogue_issues || []).length },
        { name: "Genre Drift", value: sm.genre_drift ?? (result?.genre_drift_issues || []).length },
        { name: "Plot Arc", value: sm.plot_arc ?? (result?.arc_issues || []).length },
    ];

    return (
        <div className="enhancement-view" style={{
            display: 'flex',
            gap: '24px',
            padding: '24px',
            height: '100%',
            overflowY: 'auto',
            background: 'var(--bg-main)',
            maxWidth: '1800px',
            margin: '0 auto',
            width: '100%'
        }}>
            {/* Main Content Column */}
            <div className="enhancement-main" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                minWidth: 0
            }}>
                {/* Enhanced Text Block */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '40px 32px 32px',
                    borderRadius: '16px',
                    border: '2px solid var(--brand-primary)',
                    boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.15), 0 4px 6px -4px rgba(34, 211, 238, 0.1)',
                    position: 'relative',
                    flexShrink: 0
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-14px',
                        left: '32px',
                        background: 'var(--brand-primary, #22d3ee)',
                        color: '#0f172a',
                        padding: '8px 24px',
                        borderRadius: '24px',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(34, 211, 238, 0.4)',
                        letterSpacing: '0.05em',
                        zIndex: 10
                    }}>
                        Enhanced Output
                    </div>
                    {onExportFile && (
                        <div style={{
                            position: 'absolute',
                            top: '-16px',
                            right: '32px',
                            zIndex: 10
                        }}>
                            <button
                                onClick={onExportFile}
                                style={{
                                    background: 'var(--bg-main)',
                                    border: '2px solid var(--brand-primary)',
                                    color: 'var(--brand-primary)',
                                    padding: '6px 20px',
                                    borderRadius: '24px',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    letterSpacing: '0.05em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--brand-primary)'; e.currentTarget.style.color = '#000'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--brand-primary)'; }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                EXPORT
                            </button>
                        </div>
                    )}
                    <div style={{
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.9',
                        fontSize: '1.1rem',
                        marginTop: '16px',
                        fontFamily: 'var(--font-sans, sans-serif)'
                    }}>
                        <HighlightedText text={enhanced} sortedChanges={sortedChanges} reviewed={reviewed} accepted={accepted} onReview={handleReview} onAcceptAll={(text) => onApplyText?.(text)} />
                    </div>
                </div>
            </div>

            {/* Sidebar Column */}
            <div className="enhancement-sidebar" style={{
                width: '440px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {/* Metrics Grid */}
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    padding: '24px',
                    boxShadow: '0 4px 6px -1px var(--color-shadow)'
                }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '700' }}>Analysis Metrics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{Number(result?.readability_scores?.flesch_kincaid || 0).toFixed(0)}</div>
                            <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px' }}>Readability</div>
                        </div>
                        <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>{result?.report?.total_issues ?? 0}</div>
                            <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px' }}>Total Issues</div>
                        </div>
                        <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', textAlign: 'center', gridColumn: 'span 2' }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>{result?.style_result?.num_changes ?? 0}</div>
                            <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px' }}>Style Changes Applied</div>
                        </div>
                    </div>
                </div>

                {/* Suggestion Panel */}
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '500px', /* Fixed height so it scrolls internally properly */
                    boxShadow: '0 4px 6px -1px var(--color-shadow)'
                }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Actionable Suggestions</h3>
                        <span style={{ background: 'var(--accent-green)', color: '#000', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Active Log</span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {result?.report ? <IssuePanel report={result.report} sortedChanges={sortedChanges} reviewed={reviewed} onReviewChange={handleReview} /> : <div style={{ padding: '32px', color: 'var(--text-secondary)', textAlign: 'center' }}>No suggestions available to fetch.</div>}
                    </div>
                </div>

                {/* Backend Modules Log */}
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    padding: '24px',
                    boxShadow: '0 4px 6px -1px var(--color-shadow)'
                }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '700' }}>Module Processing Log</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {moduleStatus.map((module) => {
                            const isClean = module.value === 0;
                            return (
                                <div key={module.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.95rem' }}>{module.name}</span>
                                    {isClean ? (
                                        <span style={{ background: 'rgba(34, 197, 94, 0.15)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>✓ Clean</span>
                                    ) : (
                                        <span style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>{module.value} Detected</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
