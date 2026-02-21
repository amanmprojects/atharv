import { Settings as SettingsIcon, User, Palette, Bell, Shield, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
]

export default function Settings() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-semibold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          Settings
        </h1>
      </div>
      
      <div className="flex gap-8">
        <nav className="w-48 space-y-1">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-muted text-left"
            >
              <section.icon className="h-4 w-4 text-muted-foreground" />
              {section.label}
            </button>
          ))}
        </nav>
        
        <div className="flex-1 max-w-2xl">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Display Name</label>
                <Input placeholder="Your name" />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <Input type="email" placeholder="you@example.com" />
              </div>
              
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-4">Writing Preferences</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Default Genre</label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="fiction">Fiction</option>
                      <option value="academic">Academic</option>
                      <option value="blog">Blog</option>
                      <option value="email">Email</option>
                      <option value="technical">Technical</option>
                      <option value="script">Script</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium block mb-1">Target Readability Level</label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="easy">Easy (Grade 6-8)</option>
                      <option value="medium">Medium (Grade 9-12)</option>
                      <option value="advanced">Advanced (College+)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-4">Accessibility</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-input" />
                    <span className="text-sm">Dyslexia-friendly font</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-input" />
                    <span className="text-sm">High contrast mode</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-input" />
                    <span className="text-sm">Audio feedback</span>
                  </label>
                </div>
              </div>
              
              <div className="pt-4 flex gap-2">
                <Button>Save Changes</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
