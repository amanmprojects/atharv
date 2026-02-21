import { useState } from 'react'
import { Search, Loader2, AlertTriangle, CheckCircle2, Target, FileText, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { analyzeSEO } from '@/lib/api'
import type { SEOAnalysisResponse } from '@/types'

export default function SEOPage() {
    const [text, setText] = useState('')
    const [keywords, setKeywords] = useState('')
    const [result, setResult] = useState<SEOAnalysisResponse | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const { toast } = useToast()

    const handleAnalyze = async () => {
        if (!text.trim()) {
            toast({ title: 'No text', description: 'Enter content to analyze.', variant: 'destructive' })
            return
        }
        setIsAnalyzing(true)
        try {
            const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean)
            const data = await analyzeSEO(text, keywordList)
            setResult(data)
            toast({ title: 'SEO Analysis Complete', description: `Score: ${data.overall_score}/100` })
        } catch {
            toast({ title: 'Error', description: 'SEO analysis failed.', variant: 'destructive' })
        } finally {
            setIsAnalyzing(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500'
        if (score >= 50) return 'text-yellow-500'
        return 'text-red-500'
    }

    return (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-8">
            <div className="flex items-end justify-between gap-6 pb-6 border-b-4 border-foreground">
                <div>
                    <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tighter uppercase leading-none flex items-center gap-4">
                        <Search className="h-10 w-10 text-primary" strokeWidth={3} />
                        SEO Optimizer
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm mt-3 uppercase tracking-widest">
                        Intelligent SEO scoring, not keyword stuffing
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your content here for SEO analysis..."
                        className="h-64 resize-none border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] font-body text-base"
                    />
                    <div className="flex gap-4">
                        <Input
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="Target keywords (comma-separated)..."
                            className="flex-1 border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]"
                        />
                        <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="bg-primary text-primary-foreground px-8 font-black uppercase border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] transition-all rounded-none"
                        >
                            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            Analyze SEO
                        </Button>
                    </div>
                </div>

                {result && (
                    <div className="bg-card border-4 border-foreground p-6 shadow-[8px_8px_0_0_hsl(var(--foreground))]">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-4">Overall Score</h3>
                        <div className={`text-7xl font-black tracking-tighter ${getScoreColor(result.overall_score)}`}>
                            {result.overall_score}
                        </div>
                        <p className="text-xs font-mono uppercase text-muted-foreground mt-1">out of 100</p>
                        <Progress value={result.overall_score} className="h-3 mt-4" />

                        <div className="mt-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold uppercase text-xs">Keywords</span>
                                <span className={`font-black ${getScoreColor(result.keyword_analysis.keyword_score)}`}>
                                    {result.keyword_analysis.keyword_score}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold uppercase text-xs">Headings</span>
                                <span className={`font-black ${getScoreColor(result.heading_analysis.heading_score)}`}>
                                    {result.heading_analysis.heading_score}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold uppercase text-xs">Content</span>
                                <span className={`font-black ${getScoreColor(result.content_analysis.content_score)}`}>
                                    {result.content_analysis.content_score}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Keywords */}
                    <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-foreground/20">
                            <Hash className="h-5 w-5 text-primary" strokeWidth={2.5} />
                            <h3 className="font-black uppercase text-sm tracking-tight">Keyword Analysis</h3>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(result.keyword_analysis.keyword_data).slice(0, 5).map(([kw, data]) => (
                                <div key={kw} className="flex items-center justify-between">
                                    <span className="text-sm font-bold truncate mr-2">{kw}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono">{(data.density * 100).toFixed(1)}%</span>
                                        {data.in_ideal_range ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Issues */}
                    <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-foreground/20">
                            <AlertTriangle className="h-5 w-5 text-primary" strokeWidth={2.5} />
                            <h3 className="font-black uppercase text-sm tracking-tight">Issues ({result.issues.length})</h3>
                        </div>
                        <div className="space-y-3">
                            {result.issues.slice(0, 5).map((issue, i) => (
                                <div key={i} className="p-3 bg-muted border-2 border-foreground/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${issue.severity === 'high' ? 'bg-red-500 text-white' :
                                                issue.severity === 'medium' ? 'bg-yellow-500 text-black' :
                                                    'bg-green-500 text-white'
                                            }`}>{issue.severity}</span>
                                    </div>
                                    <p className="text-xs leading-relaxed">{issue.explanation}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-foreground/20">
                            <Target className="h-5 w-5 text-primary" strokeWidth={2.5} />
                            <h3 className="font-black uppercase text-sm tracking-tight">Recommendations</h3>
                        </div>
                        <div className="space-y-2">
                            {result.recommendations.map((rec, i) => (
                                <p key={i} className="text-sm leading-relaxed">{rec}</p>
                            ))}
                        </div>
                    </div>

                    {/* Meta Suggestions */}
                    <div className="md:col-span-2 lg:col-span-3 bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-foreground/20">
                            <FileText className="h-5 w-5 text-primary" strokeWidth={2.5} />
                            <h3 className="font-black uppercase text-sm tracking-tight">Meta Tag Suggestions</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title Tag ({result.meta_suggestions.title_length} chars)</label>
                                <p className="mt-1 p-3 bg-muted border-2 border-foreground/10 text-sm font-medium">{result.meta_suggestions.suggested_title}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Meta Description ({result.meta_suggestions.meta_description_length} chars)</label>
                                <p className="mt-1 p-3 bg-muted border-2 border-foreground/10 text-sm">{result.meta_suggestions.suggested_meta_description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
