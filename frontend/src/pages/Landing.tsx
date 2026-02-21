import { Link } from 'react-router-dom'
import { ArrowUpRight, Zap, Target, BookOpen, BrainCircuit, Activity } from 'lucide-react'

const featureCards = [
  {
    icon: BrainCircuit,
    title: 'Narrative Engine',
    desc: 'Tracks character traits, relationships, and timelines while flagging contradictions.',
  },
  {
    icon: Target,
    title: 'Structural Intel',
    desc: 'Finds pacing gaps, weak transitions, and redundant passages before publishing.',
  },
  {
    icon: Activity,
    title: 'Emotional Arc',
    desc: 'Maps emotional movement across paragraphs to keep tension and flow intentional.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-editor-bg text-foreground">
      <nav className="border-b border-border bg-panel-bg/95 px-6 py-4 text-text-main md:px-8">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary p-2 text-primary-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">ScriptIQ</p>
              <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                Narrative Workspace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="hidden rounded-md border border-panel-border px-4 py-2 text-sm font-medium text-text-main transition-colors hover:bg-panel-hover md:flex"
            >
              Dashboard
            </Link>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start Writing
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-12 lg:py-20">
        <div className="space-y-7 lg:col-span-8">
          <div className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            ScriptIQ Platform
          </div>
          <h1 className="text-5xl font-bold leading-[0.92] tracking-tight text-foreground md:text-7xl lg:text-[5.6rem]">
            Write with clarity.
            <br />
            Analyze with intent.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-2xl">
            Structured narrative intelligence that improves grammar, pacing, style, and story consistency while keeping AI usage controlled.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-md bg-panel-bg px-6 py-3 text-sm font-semibold text-text-main transition-colors hover:bg-panel-surface"
            >
              Enter Editor
              <Zap className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Explore Features
            </a>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-lg border border-panel-border bg-panel-bg p-8 text-text-main shadow-panel">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,185,91,0.24),transparent_55%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <Activity className="h-32 w-32 text-primary/90" strokeWidth={1.1} />
              <div className="rounded-md border border-panel-border bg-panel-surface/60 px-3 py-2 text-xs uppercase tracking-[0.14em] text-text-secondary">
                Workspace Online
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="my-10 flex overflow-hidden whitespace-nowrap border-y border-panel-border bg-panel-bg py-3 text-text-main">
        <div className="animate-marquee flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.16em]">
          <span>Custom intelligence first</span>
          <span>•</span>
          <span>Consent-based AI enhancement</span>
          <span>•</span>
          <span>Narrative consistency tracking</span>
          <span>•</span>
          <span>Emotion and style analytics</span>
          <span>•</span>
        </div>
        <div
          className="animate-marquee flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.16em]"
          aria-hidden="true"
        >
          <span>Custom intelligence first</span>
          <span>•</span>
          <span>Consent-based AI enhancement</span>
          <span>•</span>
          <span>Narrative consistency tracking</span>
          <span>•</span>
          <span>Emotion and style analytics</span>
          <span>•</span>
        </div>
      </div>

      <section id="features" className="mx-auto max-w-[1400px] px-6 py-12 md:py-16">
        <h2 className="mb-10 text-4xl font-bold tracking-tight md:text-5xl">Core Engines</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feat) => (
            <div key={feat.title} className="rounded-lg border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-panel">
              <div className="mb-6 inline-flex rounded-md border border-border bg-muted p-3">
                <feat.icon className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-3 text-2xl font-semibold">{feat.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-14 border-t border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-6 py-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Ready to build your next draft?</h2>
          <p className="text-muted-foreground">Move from rough ideas to polished narrative faster.</p>
          <Link
            to="/dashboard"
            className="mt-2 rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Launch Dashboard
          </Link>
        </div>
      </footer>
    </div>
  )
}
