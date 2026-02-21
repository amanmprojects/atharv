import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Suggestion } from '@/types'

interface SuggestionCardProps {
  suggestion: Suggestion
  onAccept: () => void
  onReject: () => void
}

const severityStyles: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
}

const categoryColors: Record<string, string> = {
  grammar: 'bg-red-500/15 text-red-500',
  consistency: 'bg-orange-500/15 text-orange-500',
  logic: 'bg-purple-500/15 text-purple-500',
  narrative: 'bg-violet-500/15 text-violet-500',
  style: 'bg-cyan-500/15 text-cyan-500',
  pacing: 'bg-amber-500/15 text-amber-500',
  redundancy: 'bg-yellow-500/15 text-yellow-500',
  structure: 'bg-indigo-500/15 text-indigo-500',
  structural: 'bg-indigo-500/15 text-indigo-500',
  seo: 'bg-green-500/15 text-green-500',
}

export default function SuggestionCard({ suggestion, onAccept, onReject }: SuggestionCardProps) {
  const severity = suggestion.severity || (suggestion.confidence > 0.8 ? 'high' : suggestion.confidence > 0.5 ? 'medium' : 'low')

  const getRuleLabel = (rule: string) => {
    const parts = rule.split('.')
    return parts[parts.length - 1].replace(/_/g, ' ')
  }

  const getCategory = (rule: string) => {
    return rule.split('.')[0]
  }

  const category = getCategory(suggestion.rule_triggered)
  const categoryStyle = categoryColors[category] || 'bg-muted text-muted-foreground'

  return (
    <div className={`border-2 border-foreground/20 p-3 bg-background shadow-[2px_2px_0_0_hsl(var(--foreground)/0.1)] ${suggestion.status === 'accepted' ? 'border-green-500/50 bg-green-500/5' :
        suggestion.status === 'rejected' ? 'border-red-500/30 opacity-60' : ''
      }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 font-black uppercase ${severityStyles[severity]}`}>
            {severity}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 font-bold uppercase ${categoryStyle}`}>
            {category}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-muted font-bold uppercase text-muted-foreground">
            {suggestion.source === 'custom_pipeline' ? 'NLP' : 'LLM'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
          {getRuleLabel(suggestion.rule_triggered)}
        </span>
      </div>

      {suggestion.original_text && (
        <div className="mb-2 p-2 bg-red-500/5 border border-red-500/15 text-xs line-through text-muted-foreground font-mono">
          {suggestion.original_text.slice(0, 150)}
          {suggestion.original_text.length > 150 && '...'}
        </div>
      )}

      {suggestion.modified_text && (
        <div className="mb-2 p-2 bg-green-500/10 border border-green-500/20 text-xs text-green-600 dark:text-green-400 font-mono">
          ✓ {suggestion.modified_text.slice(0, 150)}
          {suggestion.modified_text.length > 150 && '...'}
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        {suggestion.reason}
      </p>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-muted-foreground font-bold uppercase">Confidence</span>
            <span className="font-mono">{Math.round(suggestion.confidence * 100)}%</span>
          </div>
          <Progress value={suggestion.confidence * 100} className="h-1" />
        </div>
      </div>

      {suggestion.status === 'pending' ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={onAccept}
            className="flex-1 h-7 text-xs font-black uppercase bg-primary text-primary-foreground border border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))] rounded-none hover:translate-y-0.5 hover:shadow-none transition-all">
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={onReject}
            className="flex-1 h-7 text-xs font-black uppercase border-2 border-foreground/30 rounded-none hover:bg-red-500/10 transition-all">
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      ) : (
        <div className={`text-xs font-black uppercase ${suggestion.status === 'accepted' ? 'text-green-500' : 'text-red-400'}`}>
          {suggestion.status === 'accepted' ? '✓ ACCEPTED — Applied to text' : '✗ REJECTED'}
        </div>
      )}
    </div>
  )
}
