import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Download,
  Share,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Network,
  Search,
  Accessibility,
  Wand2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import EnhancedTiptap from '@/components/EnhancedTiptap'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { analyzeText, transformStyle, trackSuggestionAction } from '@/lib/api'
import type { AnalysisResponse } from '@/types'
import type { DocumentContent } from '@/types/firebase'
import SuggestionCard from '@/components/SuggestionCard'
import EmotionalArcChart from '@/components/EmotionalArcChart'
import StyleFingerprintRadar from '@/components/StyleFingerprintRadar'
import { useDocumentStore } from '@/store/documents'
import {
  EMPTY_TIPTAP_DOCUMENT,
  ensureDocumentContent,
  extractPlainTextFromDocument,
  isDocumentContent,
  plainTextToDocument,
  replaceFirstTextOccurrence,
} from '@/lib/tiptap-content'

const genres = [
  { id: 'fiction', label: 'Fiction' },
  { id: 'academic', label: 'Academic' },
  { id: 'blog', label: 'Blog' },
  { id: 'email', label: 'Email' },
  { id: 'technical', label: 'Technical' },
  { id: 'script', label: 'Script' },
]

const styleModes = [
  { id: 'formal', label: 'Formal' },
  { id: 'casual', label: 'Casual' },
  { id: 'academic', label: 'Academic' },
  { id: 'professional', label: 'Professional' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'journalistic', label: 'Journalistic' },
]

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline'

export default function Editor() {
  const { docId } = useParams<{ docId: string }>()
  const {
    loading: docLoading,
    saving: docSaving,
    fetchDocument,
    loadContent,
    saveContent,
    getCachedDocument,
    getCachedContent,
    cacheContent,
    setCurrentDocument,
  } = useDocumentStore()
  
  const [title, setTitle] = useState('Untitled Document')
  const [editorContent, setEditorContent] = useState<DocumentContent>(EMPTY_TIPTAP_DOCUMENT)
  const [selectedGenre, setSelectedGenre] = useState('fiction')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isTransforming, setIsTransforming] = useState(false)
  const [activeTab, setActiveTab] = useState('suggestions')
  const [styleMode, setStyleMode] = useState('formal')
  const [intensity, setIntensity] = useState([0.5])
  const [isDocumentInitializing, setIsDocumentInitializing] = useState(Boolean(docId))
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  // Analysis toggles
  const [enableSEO, setEnableSEO] = useState(false)
  const [enableAccessibility, setEnableAccessibility] = useState(false)
  const [enableKnowledgeGraph, setEnableKnowledgeGraph] = useState(false)

  const { toast } = useToast()
  const isEditorLoading = Boolean(docId) && (isDocumentInitializing || docLoading)
  const plainText = useMemo(
    () => extractPlainTextFromDocument(editorContent),
    [editorContent]
  )

  // Load document if docId is present
  useEffect(() => {
    if (!docId) {
      setCurrentDocument(null)
      setEditorContent(EMPTY_TIPTAP_DOCUMENT)
      setIsDocumentInitializing(false)
      setSyncStatus('idle')
      return
    }

    let isCancelled = false
    const cachedDoc = getCachedDocument(docId)
    if (cachedDoc?.title) {
      setTitle(cachedDoc.title)
    }
    const cached = getCachedContent(docId)
    if (cached) {
      setEditorContent(cached)
      setIsDocumentInitializing(false)
    } else {
      setIsDocumentInitializing(true)
    }
    setSyncStatus('syncing')

    const loadDocument = async () => {
      try {
        const [doc, content] = await Promise.all([
          fetchDocument(docId),
          loadContent(docId),
        ])

        if (isCancelled) {
          return
        }

        if (doc) {
          setTitle(doc.title)
        }

        if (content) {
          const normalizedContent = ensureDocumentContent(content)
          if (!cached || JSON.stringify(cached) !== JSON.stringify(normalizedContent)) {
            setEditorContent(normalizedContent)
          }
        }
        setSyncStatus('synced')
        window.setTimeout(() => {
          if (!isCancelled) setSyncStatus('idle')
        }, 1500)
      } catch {
        setSyncStatus('offline')
      } finally {
        if (!isCancelled) {
          setIsDocumentInitializing(false)
        }
      }
    }

    void loadDocument()
    return () => {
      isCancelled = true
    }
  }, [
    docId,
    fetchDocument,
    getCachedContent,
    getCachedDocument,
    loadContent,
    setCurrentDocument,
  ])

  // Save document handler
  const handleSaveContent = useCallback(async (content: unknown) => {
    if (docId && isDocumentContent(content)) {
      try {
        setSyncStatus('syncing')
        await saveContent(docId, content)
        setSyncStatus('synced')
        window.setTimeout(() => setSyncStatus('idle'), 1200)
      } catch {
        setSyncStatus('offline')
      }
    }
  }, [docId, saveContent])

  const handleAnalyze = useCallback(async () => {
    if (!plainText.trim()) {
      toast({ title: 'No text to analyze', description: 'Please enter some text first.', variant: 'destructive' })
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await analyzeText({
        text: plainText,
        genre: selectedGenre,
        mode: 'full',
        enable_narrative: true,
        enable_structural: true,
        enable_emotional: true,
        enable_style: true,
        enable_seo: enableSEO,
        enable_accessibility: enableAccessibility,
        enable_knowledge_graph: enableKnowledgeGraph,
      })
      setAnalysisResult(result)
      toast({
        title: 'Analysis complete',
        description: `Found ${result.suggestions.length} suggestions in ${result.processing_time_ms}ms`,
      })
    } catch {
      toast({ title: 'Analysis failed', description: 'An error occurred during analysis.', variant: 'destructive' })
    } finally {
      setIsAnalyzing(false)
    }
  }, [plainText, selectedGenre, enableSEO, enableAccessibility, enableKnowledgeGraph, toast])

  const handleTransformStyle = async () => {
    if (!plainText.trim()) return
    setIsTransforming(true)
    try {
      const result = await transformStyle({
        text: plainText,
        style_mode: styleMode,
        intensity: intensity[0],
        preserve_entities: true,
      })
      setEditorContent(plainTextToDocument(result.transformed_text))
      toast({
        title: 'Style Transformed',
        description: `Meaning preservation: ${(result.meaning_preservation_score * 100).toFixed(0)}%`,
      })
    } catch {
      toast({ title: 'Transform failed', description: 'Style transformation failed.', variant: 'destructive' })
    } finally {
      setIsTransforming(false)
    }
  }

  const handleAcceptSuggestion = (suggestionId: string) => {
    if (analysisResult) {
      const suggestion = analysisResult.suggestions.find(s => s.suggestion_id === suggestionId)

      // Apply the suggestion to the first matching text node in the TipTap JSON.
      if (suggestion && suggestion.original_text && suggestion.modified_text) {
        const replaceResult = replaceFirstTextOccurrence(
          editorContent,
          suggestion.original_text,
          suggestion.modified_text
        )
        if (replaceResult.replaced) {
          setEditorContent(replaceResult.content)
          if (docId) {
            cacheContent(docId, replaceResult.content)
          }
          toast({
            title: 'Suggestion Applied',
            description: `"${suggestion.rule_triggered.split('.').pop()?.replace(/_/g, ' ')}" fix applied to text.`,
          })
        }
      }

      setAnalysisResult({
        ...analysisResult,
        suggestions: analysisResult.suggestions.map((s) =>
          s.suggestion_id === suggestionId ? { ...s, status: 'accepted' } : s
        ),
      })
      trackSuggestionAction(suggestionId, 'accepted').catch(() => { })
    }
  }

  const handleRejectSuggestion = (suggestionId: string) => {
    if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        suggestions: analysisResult.suggestions.map((s) =>
          s.suggestion_id === suggestionId ? { ...s, status: 'rejected' } : s
        ),
      })
      trackSuggestionAction(suggestionId, 'rejected').catch(() => { })
    }
  }

  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length
  const sentenceCount = plainText.split(/[.!?]+/).filter(Boolean).length
  const paragraphCount = plainText.split(/\n\s*\n/).filter(Boolean).length

  return (
    <div className="flex h-screen flex-col bg-editor-bg">
      <header className="border-b border-panel-border bg-panel-bg px-4 py-3 text-text-main">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-text-secondary transition-colors hover:text-text-main">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 w-64 border-panel-border bg-panel-surface text-sm font-semibold text-text-main focus-visible:ring-primary/50"
            />
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="h-9 border-panel-border bg-panel-surface px-3 text-xs font-medium uppercase tracking-[0.08em] text-text-main"
            >
              {genres.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Module toggles */}
            <div className="mr-2 flex items-center gap-1">
              <button
                onClick={() => setEnableSEO(!enableSEO)}
                className={`rounded-sm border border-panel-border p-1.5 transition-colors ${enableSEO ? 'bg-primary text-primary-foreground' : 'bg-panel-surface text-text-secondary hover:text-text-main'}`}
                title="SEO Analysis"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEnableAccessibility(!enableAccessibility)}
                className={`rounded-sm border border-panel-border p-1.5 transition-colors ${enableAccessibility ? 'bg-primary text-primary-foreground' : 'bg-panel-surface text-text-secondary hover:text-text-main'}`}
                title="Accessibility Analysis"
              >
                <Accessibility className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEnableKnowledgeGraph(!enableKnowledgeGraph)}
                className={`rounded-sm border border-panel-border p-1.5 transition-colors ${enableKnowledgeGraph ? 'bg-primary text-primary-foreground' : 'bg-panel-surface text-text-secondary hover:text-text-main'}`}
                title="Knowledge Graph"
              >
                <Network className="h-3.5 w-3.5" />
              </button>
            </div>

            <Button onClick={handleAnalyze} disabled={isAnalyzing}
              className="border border-primary/70 bg-primary px-4 text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground hover:bg-primary/90">
              {isAnalyzing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Analyze</>
              )}
            </Button>
            <Button variant="outline" size="icon" className="border-panel-border bg-panel-surface text-text-main hover:bg-panel-hover">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-panel-border bg-panel-surface text-text-main hover:bg-panel-hover">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isAnalyzing && <Progress value={50} className="h-1 mt-2" />}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1 p-4">
          {docId && syncStatus !== 'idle' && (
            <div className="absolute top-6 right-6 z-30 pointer-events-none">
              <div className="flex items-center gap-1.5 rounded-sm border border-panel-border bg-panel-bg px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-text-secondary">
                {syncStatus === 'syncing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {syncStatus === 'synced' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {syncStatus === 'offline' && <AlertCircle className="h-3.5 w-3.5" />}
                {syncStatus === 'syncing' && 'Syncing...'}
                {syncStatus === 'synced' && 'Synced'}
                {syncStatus === 'offline' && 'Offline cache'}
              </div>
            </div>
          )}
          {isEditorLoading ? (
            <div className="flex h-full items-center justify-center rounded-md border border-editor-border bg-editor-page shadow-panel">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Loading document...
                </p>
              </div>
            </div>
          ) : (
            <EnhancedTiptap
              content={editorContent}
              onChange={(json) => {
                if (isDocumentContent(json)) {
                  setEditorContent(json)
                  if (docId) {
                    cacheContent(docId, json)
                  }
                }
              }}
              onSave={docId ? handleSaveContent : undefined}
              isSaving={docSaving}
              className="h-full overflow-hidden rounded-md border border-editor-border shadow-panel"
            />
          )}
        </div>

        <div className="flex min-h-0 w-[420px] flex-col overflow-hidden border-l border-panel-border bg-panel-bg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-4 mt-4 border-panel-border bg-panel-surface/70">
              <TabsTrigger value="suggestions" className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Suggestions</TabsTrigger>
              <TabsTrigger value="narrative" className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Narrative</TabsTrigger>
              <TabsTrigger value="style" className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Style</TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="scrollbar-thin flex-1 min-h-0 overflow-auto p-4">
              {analysisResult ? (
                <>
                  <div className="mb-4 rounded-md border border-panel-border bg-panel-surface/70 p-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-main">
                      {analysisResult.suggestions.length} suggestions
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {analysisResult.suggestions.filter(s => s.source === 'custom_pipeline').length} custom ·{' '}
                      {analysisResult.suggestions.filter(s => s.source === 'llm_rewrite').length} LLM
                    </p>
                  </div>

                  <div className="space-y-3">
                    {analysisResult.suggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.suggestion_id}
                        suggestion={suggestion}
                        onAccept={() => handleAcceptSuggestion(suggestion.suggestion_id)}
                        onReject={() => handleRejectSuggestion(suggestion.suggestion_id)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-text-secondary">
                  <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm font-semibold uppercase tracking-[0.08em]">No analysis yet</p>
                  <p className="text-xs mt-1">Click "Analyze" to get suggestions</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="narrative" className="scrollbar-thin flex-1 min-h-0 overflow-auto p-4 text-text-main">
              {analysisResult ? (
                <>
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.1em] text-text-secondary">Characters ({analysisResult.characters.length})</h3>
                    <div className="space-y-2">
                      {analysisResult.characters.slice(0, 5).map((char) => (
                        <div key={char.name} className="rounded-sm border border-panel-border bg-panel-surface/70 p-2">
                          <p className="text-sm font-semibold text-text-main">{char.name}</p>
                          <p className="text-xs text-text-secondary">
                            {char.mention_count} mentions
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {analysisResult.emotional_arc && (
                    <div className="mt-6">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.1em] text-text-secondary">Emotional Arc</h3>
                      <EmotionalArcChart data={analysisResult.emotional_arc} />
                    </div>
                  )}

                  {/* Knowledge Graph Summary */}
                  {analysisResult.knowledge_graph && (
                    <div className="mt-6">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-text-secondary">
                        <Network className="h-4 w-4 text-primary" />
                        Knowledge Graph
                      </h3>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="border border-panel-border bg-panel-surface/70 p-2 text-center">
                          <p className="text-lg font-semibold text-text-main">{analysisResult.knowledge_graph.entities.length}</p>
                          <p className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">Entities</p>
                        </div>
                        <div className="border border-panel-border bg-panel-surface/70 p-2 text-center">
                          <p className="text-lg font-semibold text-text-main">{analysisResult.knowledge_graph.relationships.length}</p>
                          <p className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">Relations</p>
                        </div>
                        <div className="border border-panel-border bg-panel-surface/70 p-2 text-center">
                          <p className="text-lg font-semibold text-text-main">{analysisResult.knowledge_graph.events.length}</p>
                          <p className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">Events</p>
                        </div>
                      </div>
                      {analysisResult.knowledge_graph.central_entities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.knowledge_graph.central_entities.map((e) => (
                            <span key={e} className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                              {e}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-text-secondary">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em]">Run analysis to see narrative data</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="style" className="scrollbar-thin flex-1 min-h-0 overflow-auto p-4 text-text-main">
              {analysisResult ? (
                <>
                  {analysisResult.style_fingerprint && (
                    <StyleFingerprintRadar data={analysisResult.style_fingerprint} />
                  )}

                  {analysisResult.readability_scores && (
                    <div className="mt-6">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.1em] text-text-secondary">Readability Scores</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Flesch-Kincaid', value: analysisResult.readability_scores.flesch_kincaid },
                          { label: 'Gunning Fog', value: analysisResult.readability_scores.gunning_fog },
                          { label: 'SMOG', value: analysisResult.readability_scores.smog },
                          { label: 'Coleman-Liau', value: analysisResult.readability_scores.coleman_liau },
                        ].map((s) => (
                          <div key={s.label} className="border border-panel-border bg-panel-surface/70 p-2">
                            <p className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">{s.label}</p>
                            <p className="text-lg font-semibold text-text-main">{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.1em] text-text-secondary">Style Transform</h3>
                    <select
                      value={styleMode}
                      onChange={(e) => setStyleMode(e.target.value)}
                      className="mb-3 h-9 w-full border-panel-border bg-panel-surface px-3 text-xs font-medium uppercase tracking-[0.08em] text-text-main"
                    >
                      {styleModes.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>

                    <div className="mb-3">
                      <label className="text-xs font-medium uppercase tracking-[0.08em] text-text-secondary">Intensity</label>
                      <Slider value={intensity} onValueChange={setIntensity} max={1} step={0.1} className="mt-2" />
                      <p className="mt-1 text-right text-xs text-text-secondary">{(intensity[0] * 100).toFixed(0)}%</p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleTransformStyle}
                      disabled={isTransforming}
                      className="w-full border-panel-border bg-panel-surface text-xs font-semibold uppercase tracking-[0.08em] text-text-main hover:bg-primary hover:text-primary-foreground"
                    >
                      {isTransforming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      Transform Style
                    </Button>
                  </div>

                  {/* SEO Summary (if enabled) */}
                  {analysisResult.seo_analysis && (
                    <div className="mt-6">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-text-secondary">
                        <Search className="h-4 w-4 text-primary" />
                        SEO Score
                      </h3>
                      <div className={`text-4xl font-semibold ${analysisResult.seo_analysis.overall_score >= 80 ? 'text-green-500' :
                        analysisResult.seo_analysis.overall_score >= 50 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                        {analysisResult.seo_analysis.overall_score}
                      </div>
                      <div className="space-y-1 mt-2">
                        {analysisResult.seo_analysis.recommendations.slice(0, 3).map((r, i) => (
                          <p key={i} className="text-xs text-text-secondary">{r}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-text-secondary">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em]">Run analysis to see style data</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="flex items-center gap-6 border-t border-panel-border bg-panel-bg px-4 py-2 text-xs text-text-secondary">
        <span>{wordCount.toLocaleString()} words</span>
        <span>{sentenceCount} sentences</span>
        <span>{paragraphCount} paragraphs</span>
        {analysisResult && (
          <>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {analysisResult.suggestions.filter(s => s.status === 'accepted').length} accepted
            </span>
            <span>LLM: {analysisResult.llm_calls_used}/10</span>
            <span>{analysisResult.processing_time_ms}ms</span>
          </>
        )}
      </footer>
    </div>
  )
}
