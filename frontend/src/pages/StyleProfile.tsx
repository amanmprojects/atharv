import { BarChart3, TrendingUp } from 'lucide-react'

export default function StyleProfile() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-semibold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Style Profile
        </h1>
        <p className="text-muted-foreground mt-1">Your writing fingerprint across all documents</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Aggregate Style Fingerprint</h2>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Analyze more documents to build your style profile
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Archetype Match</h2>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Closest match</p>
              <p className="text-xl font-semibold">Hemingway</p>
              <p className="text-sm text-primary">78% match</p>
            </div>
            <div className="space-y-2">
              {['Tolkien', 'Academic', 'Journalistic'].map((archetype) => (
                <div key={archetype} className="flex items-center justify-between text-sm">
                  <span>{archetype}</span>
                  <span className="text-muted-foreground">65%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sentence Length', value: '14.2 words', trend: '+2%' },
          { label: 'Passive Voice', value: '18%', trend: '-5%' },
          { label: 'Vocabulary', value: '0.52', trend: '+8%' },
          { label: 'Dialogue', value: '12%', trend: '+3%' },
        ].map((metric) => (
          <div key={metric.label} className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-xl font-semibold">{metric.value}</p>
              <span className="text-xs text-green-500 flex items-center mb-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {metric.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
