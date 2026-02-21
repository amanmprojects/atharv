'use client';

import { EnhancementSuggestion, ConsistencyWarning, ReadabilityScores } from '@/lib/api';
import { AlertTriangle, Lightbulb, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface SuggestionPanelProps {
  suggestions: EnhancementSuggestion[];
  warnings: ConsistencyWarning[];
  readability: ReadabilityScores | null;
  statistics: {
    sentence_count: number;
    word_count: number;
    average_sentence_length: number;
    passive_voice_count: number;
    long_sentence_count: number;
  } | null;
  onSuggestionClick?: (suggestion: EnhancementSuggestion) => void;
}

const severityColors = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  low: 'bg-green-50 border-green-200 text-green-800',
};

const typeIcons: Record<string, React.ReactNode> = {
  vague_word: <Lightbulb size={16} />,
  cliche: <AlertTriangle size={16} />,
  passive_voice: <AlertTriangle size={16} />,
  long_sentence: <AlertTriangle size={16} />,
  name_variant: <AlertTriangle size={16} />,
  attribute_contradiction: <AlertTriangle size={16} />,
  ambiguous_pronoun: <AlertTriangle size={16} />,
};

export default function SuggestionPanel({
  suggestions,
  warnings,
  readability,
  statistics,
  onSuggestionClick,
}: SuggestionPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    warnings: true,
    suggestions: true,
    readability: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getGradeColor = (grade: string): string => {
    if (grade.includes('5th') || grade.includes('6th') || grade.includes('7th')) {
      return 'text-green-600';
    } else if (grade.includes('8th') || grade.includes('9th') || grade.includes('10th')) {
      return 'text-yellow-600';
    } else {
      return 'text-orange-600';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Lightbulb size={20} />
          Suggestions
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {warnings.length > 0 && (
          <div className="border-b">
            <button
              className="w-full px-4 py-3 flex items-center justify-between bg-red-50 hover:bg-red-100 transition-colors"
              onClick={() => toggleSection('warnings')}
            >
              <span className="font-medium flex items-center gap-2 text-red-800">
                <AlertTriangle size={18} />
                Consistency Warnings ({warnings.length})
              </span>
              {expandedSections.warnings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.warnings && (
              <ul className="divide-y">
                {warnings.map((warning, idx) => (
                  <li
                    key={idx}
                    className={`p-3 border-l-4 ${
                      warning.severity === 'high'
                        ? 'border-red-500 bg-red-50'
                        : warning.severity === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {typeIcons[warning.warning_type] || <AlertTriangle size={16} />}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{warning.entity_name}</p>
                        <p className="text-sm text-gray-600 mt-1">{warning.description}</p>
                        <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${
                          severityColors[warning.severity as keyof typeof severityColors]
                        }`}>
                          {warning.warning_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="border-b">
          <button
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => toggleSection('suggestions')}
          >
            <span className="font-medium flex items-center gap-2">
              <Lightbulb size={18} />
              Enhancement Ideas ({suggestions.length})
            </span>
            {expandedSections.suggestions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.suggestions && (
            <ul className="divide-y">
              {suggestions.length === 0 ? (
                <li className="p-4 text-center text-gray-500 text-sm">
                  No suggestions yet. Start writing to get enhancement ideas.
                </li>
              ) : (
                suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onSuggestionClick?.(suggestion)}
                  >
                    <div className="flex items-start gap-2">
                      {typeIcons[suggestion.suggestion_type] || <Lightbulb size={16} />}
                      <div className="flex-1">
                        <p className="font-medium text-sm capitalize">
                          {suggestion.suggestion_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.explanation}</p>
                        {suggestion.original_text && (
                          <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">
                            &quot;{suggestion.original_text}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {readability && statistics && (
          <div className="border-b">
            <button
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => toggleSection('readability')}
            >
              <span className="font-medium flex items-center gap-2">
                <BarChart3 size={18} />
                Readability
              </span>
              {expandedSections.readability ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.readability && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-xs text-blue-600 font-medium">Flesch-Kincaid</p>
                    <p className="text-xl font-bold text-blue-800">{readability.flesch_kincaid}</p>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-xs text-green-600 font-medium">Grade Level</p>
                    <p className={`text-sm font-bold ${getGradeColor(readability.grade_level)}`}>
                      {readability.grade_level}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Word Count</span>
                    <span className="font-medium">{statistics.word_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sentence Count</span>
                    <span className="font-medium">{statistics.sentence_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Sentence Length</span>
                    <span className="font-medium">{statistics.average_sentence_length.toFixed(1)} words</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Passive Voice</span>
                    <span className={`font-medium ${statistics.passive_voice_count > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {statistics.passive_voice_count} sentences
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!warnings.length && !suggestions.length && !readability && (
          <div className="p-8 text-center text-gray-500">
            <Lightbulb size={48} className="mx-auto mb-2 opacity-30" />
            <p>No analysis yet.</p>
            <p className="text-sm mt-1">Click &quot;Analyze&quot; to get suggestions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
