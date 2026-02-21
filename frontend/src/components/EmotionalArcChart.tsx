import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import type { EmotionalArc } from '@/types'

interface EmotionalArcChartProps {
  data: EmotionalArc
}

const emotionColors: Record<string, string> = {
  joy: '#22c55e',
  sadness: '#3b82f6',
  anger: '#ef4444',
  fear: '#8b5cf6',
  surprise: '#f59e0b',
  disgust: '#84cc16',
  anticipation: '#06b6d4',
  trust: '#ec4899',
}

export default function EmotionalArcChart({ data }: EmotionalArcChartProps) {
  const chartData = data.emotion_timeline.map((item, index) => ({
    paragraph: index + 1,
    intensity: item.intensity || 0,
    dominant: item.dominant_emotion || 'neutral',
    ...item.emotions,
  }))

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="paragraph" 
            tick={{ fontSize: 10 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            className="text-muted-foreground"
            domain={[0, 1]}
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
          <Area
            type="monotone"
            dataKey="intensity"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        {Object.entries(data.statistics?.emotion_distribution || {})
          .filter(([_, value]) => value > 0.05)
          .map(([emotion, value]) => (
            <span
              key={emotion}
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${emotionColors[emotion]}20`,
                color: emotionColors[emotion],
              }}
            >
              {emotion} {(value * 100).toFixed(0)}%
            </span>
          ))}
      </div>
    </div>
  )
}
