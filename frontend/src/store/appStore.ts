import { create } from 'zustand'
import type { AnalysisResponse, Document } from '@/types'

interface AppState {
  currentDocument: Document | null
  analysisResult: AnalysisResponse | null
  isAnalyzing: boolean
  theme: 'light' | 'dark'
  genre: string
  
  setCurrentDocument: (doc: Document | null) => void
  setAnalysisResult: (result: AnalysisResponse | null) => void
  setIsAnalyzing: (isAnalyzing: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setGenre: (genre: string) => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentDocument: null,
  analysisResult: null,
  isAnalyzing: false,
  theme: 'light',
  genre: 'fiction',
  
  setCurrentDocument: (doc) => set({ currentDocument: doc }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setTheme: (theme) => {
    set({ theme })
    document.documentElement.classList.toggle('dark', theme === 'dark')
  },
  setGenre: (genre) => set({ genre }),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    return { theme: newTheme }
  }),
}))
