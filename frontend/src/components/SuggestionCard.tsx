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
  high: 'border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300',
  medium: 'border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  low: 'border border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
}

const categoryColors: Record<string, string> = {
  grammar: 'bg-red-500/10 text-red-700 dark:text-red-300',
  consistency: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  logic: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  narrative: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  style: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  pacing: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  redundancy: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  structure: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  structural: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  seo: 'bg-green-500/10 text-green-700 dark:text-green-300',
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
    <div className={`rounded-md border border-border bg-card p-4 shadow-sm ${suggestion.status === 'accepted' ? 'border-green-500/50 bg-green-500/5' :
        suggestion.status === 'rejected' ? 'border-red-500/30 opacity-60' : ''
      }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${severityStyles[severity]}`}>
            {severity}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${categoryStyle}`}>
            {category}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
            {suggestion.source === 'custom_pipeline' ? 'NLP' : 'LLM'}
          </span>
        </div>
        <span className="whitespace-nowrap text-[10px] text-muted-foreground">
          {getRuleLabel(suggestion.rule_triggered)}
        </span>
      </div>

      {suggestion.original_text && (
        <div className="mb-2 rounded-sm border border-red-500/15 bg-red-500/5 p-2 text-xs text-muted-foreground line-through">
          {suggestion.original_text.slice(0, 150)}
          {suggestion.original_text.length > 150 && '...'}
        </div>
      )}

      {suggestion.modified_text && (
        <div className="mb-2 rounded-sm border border-green-500/20 bg-green-500/10 p-2 text-xs text-green-700 dark:text-green-300">
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
            <span className="font-medium">{Math.round(suggestion.confidence * 100)}%</span>
          </div>
          <Progress value={suggestion.confidence * 100} className="h-1" />
        </div>
      </div>

      {suggestion.status === 'pending' ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={onAccept}
            className="h-8 flex-1 text-xs font-semibold uppercase">
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={onReject}
            className="h-8 flex-1 text-xs font-semibold uppercase hover:border-red-500/40 hover:bg-red-500/10">
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      ) : (
        <div className={`text-xs font-semibold uppercase tracking-[0.08em] ${suggestion.status === 'accepted' ? 'text-green-600 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>
          {suggestion.status === 'accepted' ? 'Accepted • Applied to text' : 'Rejected'}
        </div>
      )}
    </div>
  )
}
