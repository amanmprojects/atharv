import { useState } from 'react'
import { GitCompare, Loader2, ArrowRight, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { compareDocuments } from '@/lib/api'
import type { CompareResponse } from '@/types'

export default function Compare() {
  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const { toast } = useToast()

  const handleCompare = async () => {
    if (!textA.trim() || !textB.trim()) {
      toast({ title: 'Both texts required', description: 'Enter original and revised text.', variant: 'destructive' })
      return
    }
    setIsComparing(true)
    try {
      const data = await compareDocuments(textA, textB)
      setResult(data)
      toast({ title: 'Comparison Complete', description: `Overall improvement: ${data.improvement_score.overall}/100` })
    } catch {
      toast({ title: 'Error', description: 'Comparison failed.', variant: 'destructive' })
    } finally {
      setIsComparing(false)
    }
  }

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (delta < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-8">
      <div className="pb-6 border-b-4 border-foreground">
        <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tighter uppercase leading-none flex items-center gap-4">
          <GitCompare className="h-10 w-10 text-primary" strokeWidth={3} />
          Compare Drafts
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-3 uppercase tracking-widest">
          Quantify improvement across revisions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest">Original Draft</label>
          <Textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="Paste your original text here..."
            className="h-56 resize-none border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest">Revised Draft</label>
          <Textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Paste your revised text here..."
            className="h-56 resize-none border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))]"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleCompare}
          disabled={isComparing}
          className="bg-primary text-primary-foreground px-12 py-6 font-black text-lg uppercase border-2 border-foreground shadow-[6px_6px_0_0_hsl(var(--foreground))] hover:translate-y-1 hover:shadow-[3px_3px_0_0_hsl(var(--foreground))] transition-all rounded-none"
        >
          {isComparing ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <GitCompare className="h-5 w-5 mr-3" />}
          Compare Drafts
        </Button>
      </div>

      {result && (
        <div className="space-y-8">
          {/* Summary */}
          <div className="bg-card border-4 border-foreground p-8 shadow-[8px_8px_0_0_hsl(var(--foreground))]">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Improvement Score</p>
                <p className={`text-8xl font-black tracking-tighter ${result.improvement_score.overall >= 70 ? 'text-green-500' :
                    result.improvement_score.overall >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}>{result.improvement_score.overall}</p>
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold mb-4">{result.summary}</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(result.improvement_score.breakdown).map(([key, value]) => (
                    <div key={key} className="p-3 bg-muted border-2 border-foreground/10">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">{key.replace(/_/g, ' ')}</p>
                      <p className="text-2xl font-black">{value}</p>
                      <Progress value={value} className="h-1.5 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Word Stats */}
            <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
              <h3 className="font-black uppercase text-sm tracking-tight pb-2 border-b-2 border-foreground/20 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Word Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Original</span>
                  <span className="font-mono">{result.word_stats.word_count_original} words</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Revised</span>
                  <span className="font-mono">{result.word_stats.word_count_modified} words</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Change</span>
                  <div className="flex items-center gap-1">
                    {getDeltaIcon(result.word_stats.word_count_delta)}
                    <span className="font-mono">{result.word_stats.word_count_change_pct}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Similarity</span>
                  <span className="font-mono">{(result.word_stats.overall_similarity * 100).toFixed(1)}%</span>
                </div>
                <Progress value={result.word_stats.overall_similarity * 100} className="h-2" />
              </div>
            </div>

            {/* Structural Diff */}
            <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
              <h3 className="font-black uppercase text-sm tracking-tight pb-2 border-b-2 border-foreground/20 mb-4">
                Structural Changes
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs font-bold">Paragraphs Added</span>
                  <span className="font-mono text-green-500">+{result.structural_diff.paragraphs_added}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold">Paragraphs Deleted</span>
                  <span className="font-mono text-red-500">-{result.structural_diff.paragraphs_deleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold">Reordered</span>
                  <span className={`font-mono ${result.structural_diff.reordered ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                    {result.structural_diff.reordered ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Readability Delta */}
            <div className="bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
              <h3 className="font-black uppercase text-sm tracking-tight pb-2 border-b-2 border-foreground/20 mb-4">
                Readability
              </h3>
              <div className={`p-4 border-2 mb-4 ${result.readability_delta.readability_improved ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                }`}>
                <p className="text-sm font-bold">
                  {result.readability_delta.readability_improved ? '↑ Readability Improved' : '↓ Readability Decreased'}
                </p>
              </div>
              <div className="space-y-2">
                {Object.entries(result.readability_delta.delta).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-xs font-bold capitalize">{key.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-1">
                      {getDeltaIcon(value)}
                      <span className="font-mono text-sm">{value > 0 ? '+' : ''}{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vocabulary Changes */}
            <div className="md:col-span-2 lg:col-span-3 bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
              <h3 className="font-black uppercase text-sm tracking-tight pb-2 border-b-2 border-foreground/20 mb-4">
                Vocabulary Changes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-green-500 mb-2">New Terms ({result.vocabulary_comparison.new_terms.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.vocabulary_comparison.new_terms.slice(0, 15).map((term) => (
                      <span key={term} className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 border border-green-500/30">
                        +{term}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-red-500 mb-2">Removed Terms ({result.vocabulary_comparison.removed_terms.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.vocabulary_comparison.removed_terms.slice(0, 15).map((term) => (
                      <span key={term} className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 border border-red-500/30">
                        -{term}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                    Vocab Growth: <span className={result.vocabulary_comparison.vocabulary_growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {result.vocabulary_comparison.vocabulary_growth >= 0 ? '+' : ''}{result.vocabulary_comparison.vocabulary_growth}
                    </span>
                  </p>
                  <div className="space-y-1">
                    {result.vocabulary_comparison.frequency_changes.slice(0, 5).map((fc) => (
                      <div key={fc.word} className="flex justify-between text-xs">
                        <span>{fc.word}</span>
                        <span className={fc.delta > 0 ? 'text-green-500' : 'text-red-500'}>
                          {fc.delta > 0 ? '+' : ''}{fc.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sentence Diff */}
            <div className="md:col-span-2 lg:col-span-3 bg-card border-2 border-foreground p-6 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
              <h3 className="font-black uppercase text-sm tracking-tight pb-2 border-b-2 border-foreground/20 mb-4">
                Sentence-Level Diff
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {[
                  { label: 'Original', value: result.sentence_diff.sentences_original },
                  { label: 'Revised', value: result.sentence_diff.sentences_modified },
                  { label: 'Added', value: result.sentence_diff.sentences_added, color: 'text-green-500' },
                  { label: 'Removed', value: result.sentence_diff.sentences_removed, color: 'text-red-500' },
                  { label: 'Modified', value: result.sentence_diff.sentences_modified_count, color: 'text-yellow-500' },
                ].map((s) => (
                  <div key={s.label} className="p-3 bg-muted text-center">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-black ${s.color || ''}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
