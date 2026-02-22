import { useState } from "react";

const WRITER_TYPES = [
    {
        id: "author",
        icon: "✍️",
        title: "Author / Fiction Writer",
        subtitle: "Novels, short stories, creative fiction",
        color: "#22d3ee",
        glow: "rgba(34, 211, 238, 0.3)",
        desc: "Craft immersive narratives with character development, plot structure, and emotional arc.",
        suggestions: ["story", "novel", "fiction"],
    },
    {
        id: "corporate",
        icon: "💼",
        title: "Corporate / Business Writer",
        subtitle: "Reports, emails, presentations, proposals",
        color: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.3)",
        desc: "Create professional content that communicates clearly and drives business outcomes.",
        suggestions: ["professional", "business", "corporate"],
    },
    {
        id: "journalist",
        icon: "🗞️",
        title: "Journalist / Content Creator",
        subtitle: "Articles, blogs, news, social content",
        color: "#a855f7",
        glow: "rgba(168, 85, 247, 0.3)",
        desc: "Publish compelling content that informs, engages, and reaches wide audiences.",
        suggestions: ["article", "blog", "informative"],
    },
    {
        id: "academic",
        icon: "🎓",
        title: "Academic / Research Writer",
        subtitle: "Papers, theses, essays, technical writing",
        color: "#22c55e",
        glow: "rgba(34, 197, 94, 0.3)",
        desc: "Produce rigorous, well-structured academic content with clear argumentation.",
        suggestions: ["research", "academic", "essay"],
    },
    {
        id: "screenwriter",
        icon: "🎬",
        title: "Screenwriter / Playwright",
        subtitle: "Scripts, screenplays, stage plays, dialogue",
        color: "#ef4444",
        glow: "rgba(239, 68, 68, 0.3)",
        desc: "Write compelling scripts with strong dialogue, scene setting, and dramatic tension.",
        suggestions: ["script", "screenplay", "dialogue"],
    },
    {
        id: "poet",
        icon: "🌸",
        title: "Poet / Lyricist",
        subtitle: "Poetry, song lyrics, spoken word",
        color: "#ec4899",
        glow: "rgba(236, 72, 153, 0.3)",
        desc: "Express emotions through rhythm, imagery, and the musicality of language.",
        suggestions: ["poetry", "lyrical", "verse"],
    },
];

export default function WriterTypeSelector({ onSelect, onSkip }) {
    const [hovered, setHovered] = useState(null);
    const [selected, setSelected] = useState(null);
    const [animating, setAnimating] = useState(false);

    const handleSelect = (writerType) => {
        setSelected(writerType.id);
        setAnimating(true);
        setTimeout(() => {
            onSelect(writerType);
        }, 400);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100%',
            padding: '40px 24px',
            background: 'var(--bg-main)',
            overflowY: 'auto',
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '600px' }}>
                <div style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, var(--brand-primary), #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '3rem',
                    fontWeight: '900',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    marginBottom: '12px',
                }}>
                    What kind of writer are you?
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: '1.6', margin: 0 }}>
                    Your writing type shapes how our AI personalizes suggestions, tone calibration, and real-time completions just for you.
                </p>
            </div>

            {/* Writer type cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                width: '100%',
                maxWidth: '960px',
                marginBottom: '40px',
            }}>
                {WRITER_TYPES.map((type) => {
                    const isHovered = hovered === type.id;
                    const isSelected = selected === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => handleSelect(type)}
                            onMouseEnter={() => setHovered(type.id)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                background: isSelected
                                    ? `linear-gradient(135deg, ${type.color}22, ${type.color}11)`
                                    : isHovered
                                        ? `linear-gradient(135deg, ${type.color}18, var(--bg-card))`
                                        : 'var(--bg-card)',
                                border: `2px solid ${isSelected || isHovered ? type.color : 'var(--border-light)'}`,
                                borderRadius: '16px',
                                padding: '28px 24px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.25s ease',
                                transform: isHovered ? 'translateY(-4px)' : isSelected ? 'scale(0.97)' : 'none',
                                boxShadow: isHovered ? `0 12px 32px ${type.glow}` : isSelected ? `0 0 0 4px ${type.color}44` : 'none',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Subtle glow bg on hover */}
                            {isHovered && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    right: '-20px',
                                    width: '100px',
                                    height: '100px',
                                    background: `radial-gradient(circle, ${type.glow} 0%, transparent 70%)`,
                                    pointerEvents: 'none',
                                }} />
                            )}

                            <div style={{ fontSize: '2.5rem', marginBottom: '12px', lineHeight: 1 }}>{type.icon}</div>
                            <div style={{
                                fontSize: '1.05rem',
                                fontWeight: '700',
                                color: isHovered || isSelected ? type.color : 'var(--text-primary)',
                                marginBottom: '4px',
                                transition: 'color 0.2s',
                            }}>
                                {type.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                {type.subtitle}
                            </div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {type.desc}
                            </div>

                            {isSelected && (
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: type.color,
                                    color: '#000',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                }}>✓</div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Skip option */}
            <button
                onClick={onSkip}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textDecoration: 'underline',
                    padding: '8px',
                }}
            >
                Skip — I'll set up manually
            </button>
        </div>
    );
}
