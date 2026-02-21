import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/Layout'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import Editor from '@/pages/Editor'
import Compare from '@/pages/Compare'
import StyleProfile from '@/pages/StyleProfile'
import Settings from '@/pages/Settings'
import SEOPage from '@/pages/SEO'
import AccessibilityPage from '@/pages/AccessibilityPage'
import WatermarkPage from '@/pages/WatermarkPage'
import AdminDashboard from '@/pages/AdminDashboard'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:docId" element={<Editor />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/compare/:docId1/:docId2" element={<Compare />} />
          <Route path="/style-profile" element={<StyleProfile />} />
          <Route path="/seo" element={<SEOPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/watermark" element={<WatermarkPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
