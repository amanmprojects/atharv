import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  GitCompare,
  FileText,
  BarChart2,
  TrendingUp,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Documents Analyzed', value: 12, icon: FileText },
  { label: 'Suggestions Accepted', value: '87%', icon: TrendingUp },
  { label: 'Avg. Readability', value: 72, icon: BarChart2 },
  { label: 'Writing Streak', value: '5 days', icon: Clock },
]

const recentDocuments = [
  { id: '1', title: 'Chapter 3 - The Revelation', genre: 'Fiction', readability: 72, words: 2100, time: '2 hours ago' },
  { id: '2', title: 'Blog Post - AI in Healthcare', genre: 'Blog', readability: 85, words: 890, time: 'Yesterday' },
  { id: '3', title: 'Research Paper Draft', genre: 'Academic', readability: 61, words: 4500, time: '3 days ago' },
  { id: '4', title: 'Client Email - Q4 Report', genre: 'Email', readability: 88, words: 320, time: '1 week ago' },
]

export default function Dashboard() {
  const [documents] = useState(recentDocuments)

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-foreground">
        <div>
          <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tighter lowercase leading-none">
            good morning, <br /> writer.
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-4 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/editor"
          className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-primary/90 transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_0_hsl(var(--foreground))]"
        >
          <Plus className="h-5 w-5" /> Start Writing
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border-2 border-foreground p-5 shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_hsl(var(--foreground))] transition-all"
          >
            <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-3">
              <span className="text-foreground/70 font-mono text-xs uppercase tracking-wider">{stat.label}</span>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-4xl md:text-5xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/compare"
          className="group bg-secondary border-2 border-foreground p-8 flex flex-col justify-between min-h-[160px] shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <GitCompare className="h-8 w-8" />
            <ArrowUpRight className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">Compare Drafts</p>
            <p className="font-mono text-sm mt-1 opacity-80 uppercase">Side-by-side analysis</p>
          </div>
        </Link>

        <Link
          to="/style-profile"
          className="group bg-secondary border-2 border-foreground p-8 flex flex-col justify-between min-h-[160px] shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <BarChart2 className="h-8 w-8" />
            <ArrowUpRight className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">Style Profile</p>
            <p className="font-mono text-sm mt-1 opacity-80 uppercase">Your writing fingerprint</p>
          </div>
        </Link>
      </div>

      {/* Document List */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-foreground">
          <h2 className="text-2xl font-black tracking-tighter uppercase">Recent Works</h2>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-full border-2 border-foreground font-bold hover:bg-foreground hover:text-background">Filter</Button>
            <Button variant="outline" className="rounded-full border-2 border-foreground font-bold hover:bg-foreground hover:text-background">Sort</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to={`/editor/${doc.id}`}
              className="group bg-card border-2 border-foreground p-5 shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_hsl(var(--foreground))] transition-all flex flex-col justify-between h-full"
            >
              <div>
                <h3 className="font-bold text-lg leading-tight mb-3 group-hover:underline underline-offset-4 decoration-2">{doc.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-1 rounded-full uppercase tracking-widest">{doc.genre}</span>
                  <span className="text-xs font-mono text-muted-foreground">{doc.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-auto pt-4 border-t-2 border-foreground/10 font-mono text-xs text-foreground/70">
                <span title="Readability Score">R: {doc.readability}</span>
                <span>{doc.words}W</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
