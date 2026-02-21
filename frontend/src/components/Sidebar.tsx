import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  GitCompare,
  BarChart3,
  Settings,
  Moon,
  Sun,
  BookOpen,
  Search,
  Accessibility,
  Fingerprint,
  ShieldCheck,
  Network
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/editor', icon: FileText, label: 'Editor' },
  { to: '/compare', icon: GitCompare, label: 'Compare' },
  { to: '/style-profile', icon: BarChart3, label: 'Style Profile' },
  { to: '/seo', icon: Search, label: 'SEO Optimizer' },
  { to: '/accessibility', icon: Accessibility, label: 'Accessibility' },
  { to: '/watermark', icon: Fingerprint, label: 'Watermark' },
  { to: '/admin', icon: ShieldCheck, label: 'Admin' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const genres = [
  { id: 'fiction', label: 'Fiction' },
  { id: 'academic', label: 'Academic' },
  { id: 'blog', label: 'Blog' },
  { id: 'email', label: 'Email' },
  { id: 'technical', label: 'Technical' },
  { id: 'script', label: 'Script' },
]

export default function Sidebar() {
  const { theme, toggleTheme, genre, setGenre } = useAppStore()

  return (
    <aside className="w-64 border-r-4 border-foreground bg-card flex flex-col font-mono">
      <div className="p-6 border-b-4 border-foreground">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-1.5 shadow-[2px_2px_0_0_hsl(var(--foreground))]">
            <BookOpen className="h-6 w-6" strokeWidth={3} />
          </div>
          <span className="font-heading font-black tracking-tighter text-2xl uppercase">ScriptIQ</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-auto scrollbar-thin">
        <ul className="space-y-1.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-xs font-bold tracking-tight uppercase border-2 transition-all shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:translate-x-0.5 ${isActive
                    ? 'bg-primary text-primary-foreground border-foreground'
                    : 'bg-background border-foreground text-foreground hover:bg-foreground hover:text-background'
                  }`
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={2.5} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="pt-4 border-t-4 border-foreground space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-foreground block">
            Default Genre
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full h-10 px-3 border-2 border-foreground bg-background text-foreground font-bold uppercase text-xs shadow-[2px_2px_0_0_hsl(var(--foreground))] outline-none focus:ring-0 focus:border-primary transition-colors cursor-pointer"
          >
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </nav>

      <div className="p-4 border-t-4 border-foreground">
        <Button
          variant="outline"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background font-bold tracking-tight uppercase shadow-[2px_2px_0_0_hsl(var(--foreground))] rounded-none h-10 text-xs"
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-4 w-4" strokeWidth={2.5} />
              Dark Mode
            </>
          ) : (
            <>
              <Sun className="h-4 w-4" strokeWidth={2.5} />
              Light Mode
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
