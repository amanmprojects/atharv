import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import type { StyleFingerprint } from '@/types'

interface StyleFingerprintRadarProps {
  data: StyleFingerprint
}

export default function StyleFingerprintRadar({ data }: StyleFingerprintRadarProps) {
  const chartData = [
    { metric: 'Sentence Length', value: Math.min(data.sentence_length_mean / 30, 1), fullMark: 1 },
    { metric: 'Passive Voice', value: data.passive_voice_ratio, fullMark: 1 },
    { metric: 'Vocabulary', value: data.vocabulary_complexity, fullMark: 1 },
    { metric: 'Dialogue', value: data.dialogue_percentage, fullMark: 1 },
    { metric: 'Narrative', value: data.narrative_density, fullMark: 1 },
    { metric: 'Adverbs', value: Math.min(data.adverb_usage_rate * 10, 1), fullMark: 1 },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Style Fingerprint</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 1]} 
              tick={{ fontSize: 8 }}
              className="text-muted-foreground"
            />
            <Radar
              name="Style"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${(value * 100).toFixed(0)}%`]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="text-xs">
          <span className="text-muted-foreground">Avg Sentence:</span>
          <span className="ml-1 font-medium">{data.sentence_length_mean.toFixed(1)} words</span>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">Passive:</span>
          <span className="ml-1 font-medium">{(data.passive_voice_ratio * 100).toFixed(1)}%</span>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">Dialogue:</span>
          <span className="ml-1 font-medium">{(data.dialogue_percentage * 100).toFixed(1)}%</span>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">Complexity:</span>
          <span className="ml-1 font-medium">{(data.vocabulary_complexity * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}
