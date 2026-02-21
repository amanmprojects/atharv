import { useState } from 'react'
import { Accessibility as AccessibilityIcon, Loader2, Brain, BookOpen, Languages, Eye, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { analyzeAccessibility } from '@/lib/api'
import type { AccessibilityResponse } from '@/types'

export default function AccessibilityPage() {
    const [text, setText] = useState('')
    const [result, setResult] = useState<AccessibilityResponse | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const { toast } = useToast()

    const handleAnalyze = async () => {
        if (!text.trim()) {
            toast({ title: 'No text', description: 'Enter content to analyze.', variant: 'destructive' })
            return
        }
        setIsAnalyzing(true)
        try {
            const data = await analyzeAccessibility(text)
            setResult(data)
            toast({ title: 'Accessibility Analysis Complete', description: `Score: ${data.overall_accessibility_score.overall}/100` })
        } catch {
            toast({ title: 'Error', description: 'Analysis failed.', variant: 'destructive' })
        } finally {
            setIsAnalyzing(false)
        }
    }

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'Excellent': return 'text-green-500'
            case 'Good': return 'text-blue-500'
            case 'Fair': return 'text-yellow-500'
            default: return 'text-red-500'
        }
    }

    return (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-8">
            <div className="pb-6 border-b-4 border-foreground">
                <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tighter uppercase leading-none flex items-center gap-4">
                    <AccessibilityIcon className="h-10 w-10 text-primary" strokeWidth={3} />
                    Accessibility
                </h1>
                <p className="text-muted-foreground font-mono text-sm mt-3 uppercase tracking-widest">
                    Inclusive AI — Sentence simplification, ADHD support, dyslexia-friendly output
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your text here for accessibility analysis..."
                        className="h-64 resize-none border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                    />
                    <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="bg-primary text-primary-foreground px-8 font-black uppercase border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] transition-all rounded-none"
                    >
                        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AccessibilityIcon className="h-4 w-4 mr-2" />}
                        Analyze Accessibility
                    </Button>
                </div>

                {result && (
                    <div className="bg-card border-4 border-foreground p-6 shadow-[8px_8px_0_0_hsl(var(--foreground))]">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-2">Overall Score</h3>
                        <div className={`text-7xl font-black tracking-tighter ${getGradeColor(result.overall_accessibility_score.grade)}`}>
                            {result.overall_accessibility_score.overall}
                        </div>
                        <p className={`text-lg font-black uppercase mt-1 ${getGradeColor(result.overall_accessibility_score.grade)}`}>
                            {result.overall_accessibility_score.grade}
                        </p>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase">
                                <span>Simplification</span>
                                <span>{result.overall_accessibility_score.simplification}</span>
                            </div>
                            <Progress value={result.overall_accessibility_score.simplification} className="h-2" />
                            <div className="flex justify-between text-xs font-bold uppercase">
                                <span>Naturalness</span>
                                <span>{result.overall_accessibility_score.naturalness}</span>
                            </div>
                            <Progress value={result.overall_accessibility_score.naturalness} className="h-2" />
                            <div className="flex justify-between text-xs font-bold uppercase">
                                <span>Readability</span>
                                <span>{result.overall_accessibility_score.readability}</span>
                            </div>
                            <Progress value={result.overall_accessibility_score.readability} className="h-2" />
                        </div>
                    </div>
                )}
            </div>

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sentence Simplification */}
                    <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-foreground/20">
                            <BookOpen className="h-5 w-5 text-primary" strokeWidth={2.5} />
                            <h3 className="font-black uppercase text-sm tracking-tight">Sentence Simplification</h3>
                        </div>
                        <p className="text-sm mb-4">
                            <span className="font-black text-2xl">{result.simplification.complex_count}</span>
                            <span className="text-muted-foreground ml-2">of {result.simplification.total_sentences} sentences need simplification ({result.simplification.simplification_potential}%)</span>
                        </p>
                        <div className="space-y-3 max-h-80 overflow-auto scrollbar-thin">
                            {result.simplification.complex_sentences.slice(0, 5).map((s, i) => (
                                <div key={i} className="p-3 bg-muted border-l-4 border-primary">
                                    <p className="text-xs text-red-500 line-through mb-1">{s.original.slice(0, 120)}...</p>
                                    <p className="text-xs text-green-600 font-medium">{s.simplified.slice(0, 120)}...</p>
                                    <div className="flex gap-2 mt-2">
                                        {s.changes.map((c, j) => (
                                            <span key={j} className="text-[10px] bg-background px-2 py-0.5 border border-foreground/20">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Idea Clustering (ADHD Support) */}
                    <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-foreground/20">
                            <Brain className="h-5 w-5 text-primary" strokeWidth={2.5} />
                            <h3 className="font-black uppercase text-sm tracking-tight">Idea Clustering (ADHD Support)</h3>
                        </div>
                        <p className="text-sm mb-2">{result.idea_clusters.suggestion}</p>
                        <div className="space-y-3 mt-4">
                            {result.idea_clusters.clusters.map((cluster, i) => (
                                <div key={i} className={`p-3 border-2 ${cluster.is_scattered ? 'border-yellow-500 bg-yellow-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-black uppercase">{cluster.topic}</span>
                                        {cluster.is_scattered && <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 font-bold">SCATTERED</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Paragraphs: {cluster.paragraph_indices.map(p => p + 1).join(', ')}
                                    </p>
                                    {cluster.suggestion && <p className="text-xs mt-1 text-yellow-600">{cluster.suggestion}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Naturalness Score */}
                    <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-foreground/20">
                            <Languages className="h-5 w-5 text-primary" strokeWidth={2.5} />
                            <h3 className="font-black uppercase text-sm tracking-tight">Naturalness (L2 English)</h3>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black">{result.naturalness.score}</span>
                            <span className={`text-lg font-bold ${getGradeColor(
                                result.naturalness.score > 90 ? 'Excellent' :
                                    result.naturalness.score > 70 ? 'Good' :
                                        result.naturalness.score > 50 ? 'Fair' : 'Needs Improvement'
                            )}`}>{result.naturalness.grade}</span>
                        </div>
                        {result.naturalness.issues.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {result.naturalness.issues.slice(0, 5).map((issue, i) => (
                                    <div key={i} className="p-2 bg-muted text-xs">
                                        <span className="font-bold">{issue.issue}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dyslexia Suggestions */}
                    <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-foreground/20">
                            <Eye className="h-5 w-5 text-primary" strokeWidth={2.5} />
                            <h3 className="font-black uppercase text-sm tracking-tight">Dyslexia-Friendly</h3>
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-3xl font-black">{result.dyslexia_suggestions.dyslexia_friendly_score}</span>
                            <span className="text-xs text-muted-foreground font-mono">/ 100</span>
                        </div>
                        <div className="space-y-2">
                            {result.dyslexia_suggestions.suggestions.map((s, i) => (
                                <div key={i} className={`p-2 border-l-4 text-xs ${s.priority === 'high' ? 'border-red-500 bg-red-500/5' :
                                        s.priority === 'medium' ? 'border-yellow-500 bg-yellow-500/5' :
                                            'border-green-500 bg-green-500/5'
                                    }`}>
                                    {s.suggestion}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
