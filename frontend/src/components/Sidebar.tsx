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
    <aside className="w-72 border-r border-panel-border bg-panel-bg text-text-secondary shadow-panel">
      <div className="flex h-full flex-col">
        <div className="border-b border-panel-border px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary p-2 text-primary-foreground shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-text-main">ScriptIQ</p>
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                Writing Workspace
              </p>
            </div>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-6 overflow-auto px-4 py-5">
          <ul className="space-y-1.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'border-primary/60 bg-panel-hover text-text-main'
                        : 'border-transparent text-text-secondary hover:border-panel-border hover:bg-panel-surface hover:text-text-main'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-panel-border pt-5">
            <label className="block text-xs uppercase tracking-[0.16em] text-text-muted">
              Default Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="h-10 w-full border-panel-border bg-panel-surface px-3 text-sm text-text-main outline-none transition-colors focus:border-primary"
            >
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </nav>

        <div className="border-t border-panel-border p-4">
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 border-panel-border bg-panel-surface text-text-main hover:bg-panel-hover hover:text-text-main"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                Light Mode
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
