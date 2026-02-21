import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import type { EmotionalArc } from '@/types'

interface EmotionalArcChartProps {
  data: EmotionalArc
}

const emotionColors: Record<string, string> = {
  joy: '#2f9e5b',
  sadness: '#4068b8',
  anger: '#d45555',
  fear: '#7953b8',
  surprise: '#d29a3b',
  disgust: '#769543',
  anticipation: '#2f8fb8',
  trust: '#cc6f95',
}

export default function EmotionalArcChart({ data }: EmotionalArcChartProps) {
  const chartData = data.emotion_timeline.map((item, index) => ({
    paragraph: index + 1,
    intensity: item.intensity || 0,
    dominant: item.dominant_emotion || 'neutral',
    ...item.emotions,
  }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
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
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 8px 20px -12px rgba(10, 24, 52, 0.4)',
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
      
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {Object.entries(data.statistics?.emotion_distribution || {})
          .filter(([_, value]) => value > 0.05)
          .map(([emotion, value]) => (
            <span
              key={emotion}
              className="rounded-full px-2 py-0.5 text-xs"
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
