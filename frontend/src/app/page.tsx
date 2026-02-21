'use client';

import { useState, useCallback } from 'react';
import Editor from '@/components/Editor';
import EntitySidebar from '@/components/EntitySidebar';
import SuggestionPanel from '@/components/SuggestionPanel';
import DiffModal from '@/components/DiffModal';
import {
  analyzeText,
  transformStyle,
  AnalysisResult,
  StyleTransformResult,
  Entity,
  EnhancementSuggestion,
} from '@/lib/api';
import { Wand2, Sparkles, FileText, Settings, Loader2 } from 'lucide-react';

const SAMPLE_TEXT = `<p>John walked through the dark forest. His blue eyes scanned the shadows carefully. The ancient trees whispered secrets of old.</p>
<p>Mary was waiting by the old oak tree. She had been there since morning, her brown hair catching the afternoon light. John had told her to meet him at noon, but he was late.</p>
<p>"You're late," she said when she saw him approach. Her green eyes flashed with annoyance. John noticed her eyes had changed color since yesterday when they were blue.</p>
<p>"I know," John replied. "The forest is dangerous at night. I had to be careful."</p>
<p>They walked together towards the village. The village of Thornwood was small but welcoming. Mary's father, the village elder, would be waiting for them.</p>`;

export default function Home() {
  const [content, setContent] = useState(SAMPLE_TEXT);
  const [plainText, setPlainText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformResult, setTransformResult] = useState<StyleTransformResult | null>(null);
  const [activeTab, setActiveTab] = useState<'entities' | 'suggestions'>('entities');
  const [styleIntensity, setStyleIntensity] = useState(0.5);

  const handleEditorChange = useCallback((html: string) => {
    setContent(html);
    const div = document.createElement('div');
    div.innerHTML = html;
    setPlainText(div.textContent || div.innerText || '');
  }, []);

  const handleAnalyze = async () => {
    if (!plainText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeText(plainText);
      setAnalysis(result);
      setActiveTab('suggestions');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStyleTransform = async (targetStyle: 'formal' | 'casual') => {
    if (!plainText.trim()) return;
    
    setIsTransforming(true);
    try {
      const result = await transformStyle(plainText, targetStyle, styleIntensity);
      setTransformResult(result);
    } catch (error) {
      console.error('Style transformation failed:', error);
    } finally {
      setIsTransforming(false);
    }
  };

  const handleApplyTransform = (transformed: string) => {
    const paragraphs = transformed.split('\n').filter(p => p.trim());
    const html = paragraphs.map(p => `<p>${p}</p>`).join('');
    setContent(html);
    setPlainText(transformed);
  };

  const handleEntityClick = (entityId: string) => {
    console.log('Entity clicked:', entityId);
  };

  return (
    <main className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-blue-600" />
          <h1 className="text-xl font-semibold">AI Writer</h1>
          <span className="text-sm text-gray-500">Script & Content Enhancement</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-r pr-3">
            <label className="text-sm text-gray-600">Style Intensity:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={styleIntensity}
              onChange={(e) => setStyleIntensity(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-500">{Math.round(styleIntensity * 100)}%</span>
          </div>
          
          <button
            onClick={() => handleStyleTransform('formal')}
            disabled={isTransforming || !plainText.trim()}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles size={16} />
            Formal
          </button>
          
          <button
            onClick={() => handleStyleTransform('casual')}
            disabled={isTransforming || !plainText.trim()}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles size={16} />
            Casual
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !plainText.trim()}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            Analyze
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 overflow-auto">
            <Editor
              content={content}
              onChange={handleEditorChange}
            />
          </div>
        </div>

        <div className="w-80 border-l bg-white flex flex-col">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('entities')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'entities'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entities
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'suggestions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Suggestions
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeTab === 'entities' ? (
              <EntitySidebar
                entities={analysis?.entity_graph?.entities || []}
                relationships={analysis?.entity_graph?.relationships || []}
                onEntityClick={handleEntityClick}
              />
            ) : (
              <SuggestionPanel
                suggestions={analysis?.enhancement_suggestions || []}
                warnings={analysis?.consistency_warnings || []}
                readability={analysis?.readability_scores || null}
                statistics={analysis?.statistics || null}
              />
            )}
          </div>
        </div>
      </div>

      {transformResult && (
        <DiffModal
          result={transformResult}
          onClose={() => setTransformResult(null)}
          onApply={handleApplyTransform}
        />
      )}
    </main>
  );
}
