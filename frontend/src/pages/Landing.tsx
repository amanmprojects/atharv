import { Link } from 'react-router-dom'
import { ArrowUpRight, Zap, Target, BookOpen, BrainCircuit, Activity } from 'lucide-react'

export default function Landing() {
    return (
        <div className="bg-background text-foreground min-h-screen font-body selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
            {/* Navigation */}
            <nav className="flex items-center justify-between p-6 md:p-8 border-b-4 border-foreground">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground p-1 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                        <BookOpen className="h-8 w-8" strokeWidth={3} />
                    </div>
                    <span className="font-heading font-black tracking-tighter text-3xl md:text-4xl uppercase lowercase">
                        Script<span className="text-primary">IQ</span>
                    </span>
                </div>
                <div className="flex gap-4 items-center">
                    <Link
                        to="/dashboard"
                        className="hidden md:flex font-bold uppercase tracking-widest text-sm hover:underline decoration-2 underline-offset-4"
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/editor"
                        className="bg-primary text-primary-foreground px-6 py-3 font-black tracking-tight uppercase text-lg border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                    >
                        Start Writing <ArrowUpRight className="h-5 w-5" strokeWidth={3} />
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="px-6 md:px-12 py-12 md:py-24 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="inline-flex max-w-max border-2 border-foreground px-3 py-1 bg-secondary shadow-[2px_2px_0_0_hsl(var(--foreground))]">
                        <span className="font-mono text-sm uppercase tracking-widest font-bold">ScriptIQ Platform</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-heading font-black tracking-tighter leading-[0.85] uppercase">
                        Write <br /> <span className="text-primary [-webkit-text-stroke:2px_hsl(var(--foreground))] lg:[-webkit-text-stroke:4px_hsl(var(--foreground))] text-transparent">Better.</span> <br /> No BS.
                    </h1>
                    <p className="text-xl md:text-3xl font-bold max-w-2xl leading-snug">
                        Structured narrative intelligence that analyzes, enhances, and explains writing—with minimal LLM integration.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-4">
                        <Link
                            to="/editor"
                            className="bg-foreground text-background px-8 py-5 text-xl font-black uppercase tracking-tight shadow-[6px_6px_0_0_hsl(var(--primary))] hover:translate-y-1 hover:shadow-[2px_2px_0_0_hsl(var(--primary))] transition-all flex items-center gap-3"
                        >
                            Enter Editor <Zap className="h-6 w-6" />
                        </Link>
                        <a
                            href="#features"
                            className="bg-secondary text-foreground px-8 py-5 text-xl font-black uppercase tracking-tight border-4 border-foreground shadow-[6px_6px_0_0_hsl(var(--foreground))] hover:translate-y-1 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] transition-all flex items-center gap-3"
                        >
                            How it works
                        </a>
                    </div>
                </div>

                {/* Abstract Graphic */}
                <div className="lg:col-span-4 flex justify-center lg:justify-end">
                    <div className="relative w-full aspect-square max-w-[400px] bg-primary border-4 border-foreground shadow-[12px_12px_0_0_hsl(var(--foreground))] flex items-center justify-center overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                        <Activity className="w-48 h-48 text-foreground group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
                        <div className="absolute bottom-4 right-4 bg-background border-2 border-foreground px-4 py-2 font-mono font-bold text-sm shadow-[2px_2px_0_0_hsl(var(--foreground))]">
                            V.1.0_ONLINE
                        </div>
                    </div>
                </div>
            </main>

            {/* Marquee Banner */}
            <div className="border-y-4 border-foreground bg-primary overflow-hidden flex whitespace-nowrap py-4 my-12 relative z-10 shadow-[0_8px_0_0_hsl(var(--foreground))]">
                <div className="animate-marquee flex gap-8 items-center font-mono font-black text-2xl uppercase tracking-widest text-foreground">
                    <span>80% CUSTOM INTELLIGENCE</span>
                    <span>•</span>
                    <span>20% CONTROLLED LLM</span>
                    <span>•</span>
                    <span>DETERMINISTIC ANALYSIS</span>
                    <span>•</span>
                    <span>NARRATIVE CONSISTENCY</span>
                    <span>•</span>
                    <span>EMOTIONAL FLOW</span>
                    <span>•</span>
                    <span>EXPLAINABLE EDITS</span>
                    <span>•</span>
                </div>
                <div className="animate-marquee flex gap-8 items-center font-mono font-black text-2xl uppercase tracking-widest text-foreground" aria-hidden="true">
                    <span>80% CUSTOM INTELLIGENCE</span>
                    <span>•</span>
                    <span>20% CONTROLLED LLM</span>
                    <span>•</span>
                    <span>DETERMINISTIC ANALYSIS</span>
                    <span>•</span>
                    <span>NARRATIVE CONSISTENCY</span>
                    <span>•</span>
                    <span>EMOTIONAL FLOW</span>
                    <span>•</span>
                    <span>EXPLAINABLE EDITS</span>
                    <span>•</span>
                </div>
            </div>

            {/* Feature Section */}
            <section id="features" className="px-6 md:px-12 py-24 max-w-[1400px] mx-auto">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-16 underline decoration-primary decoration-8 underline-offset-8">
                    The Architecture.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: BrainCircuit,
                            title: "Narrative Engine",
                            desc: "Tracks character traits, relationships, and story timelines. Flags logical contradictions effortlessly."
                        },
                        {
                            icon: Target,
                            title: "Structural Intel",
                            desc: "Diagnoses transition gaps, redundant clauses, and pacing. We fix weak hooks before you post."
                        },
                        {
                            icon: Activity,
                            title: "Emotional Arc",
                            desc: "Detects emotional flatlines. Maps the journey of your words ensuring rising tension."
                        }
                    ].map((feat, i) => (
                        <div
                            key={i}
                            className="group bg-card border-4 border-foreground p-8 shadow-[8px_8px_0_0_hsl(var(--foreground))] hover:bg-primary transition-colors flex flex-col h-full"
                        >
                            <div className="bg-background border-4 border-foreground w-16 h-16 flex items-center justify-center shadow-[4px_4px_0_0_hsl(var(--foreground))] mb-8 group-hover:-translate-y-2 transition-transform">
                                <feat.icon className="w-8 h-8 text-foreground" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-3xl font-black uppercase tracking-tight mb-4 group-hover:text-primary-foreground">{feat.title}</h3>
                            <p className="text-lg font-medium leading-relaxed group-hover:text-primary-foreground/90">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="border-t-4 border-foreground bg-secondary mt-24">
                <div className="px-6 md:px-12 py-24 max-w-[1400px] mx-auto flex flex-col items-center text-center gap-8">
                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase">
                        Ready to <span className="text-primary [-webkit-text-stroke:2px_hsl(var(--foreground))] text-transparent">Execute?</span>
                    </h2>
                    <p className="text-2xl font-bold max-w-2xl font-mono uppercase">
                        Stop scrolling. Start writing.
                    </p>
                    <Link
                        to="/dashboard"
                        className="mt-8 bg-foreground text-background px-12 py-6 text-2xl font-black uppercase tracking-widest shadow-[8px_8px_0_0_hsl(var(--primary))] hover:translate-y-2 hover:shadow-none transition-all"
                    >
                        Launch Dashboard
                    </Link>
                </div>
                <div className="border-t-4 border-foreground py-6 px-12 flex justify-between items-center bg-primary text-primary-foreground font-mono font-bold uppercase text-sm">
                    <span>© 2026 ScriptIQ</span>
                    <span>All Rights Reserved</span>
                </div>
            </footer>
        </div>
    )
}
