const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Entity {
  id: string;
  name: string;
  entity_type: string;
  mentions: Array<{
    start: number;
    end: number;
    sentence: string;
  }>;
  attributes: Record<string, unknown>;
  aliases: string[];
}

export interface Relationship {
  source_id: string;
  target_id: string;
  relation_type: string;
  context: string;
}

export interface EntityGraph {
  entities: Entity[];
  relationships: Relationship[];
}

export interface ConsistencyWarning {
  entity_id: string;
  entity_name: string;
  warning_type: string;
  description: string;
  locations: Array<Record<string, unknown>>;
  severity: string;
}

export interface EnhancementSuggestion {
  id: string;
  suggestion_type: string;
  original_text: string;
  suggested_text: string | null;
  explanation: string;
  location: {
    sentence_index: number;
  };
  severity: string;
}

export interface ReadabilityScores {
  flesch_kincaid: number;
  gunning_fog: number;
  smog: number;
  grade_level: string;
}

export interface AnalysisResult {
  entity_graph: EntityGraph | null;
  consistency_warnings: ConsistencyWarning[];
  enhancement_suggestions: EnhancementSuggestion[];
  readability_scores: ReadabilityScores;
  statistics: {
    sentence_count: number;
    word_count: number;
    average_sentence_length: number;
    passive_voice_count: number;
    long_sentence_count: number;
  };
}

export interface StyleTransformResult {
  original: string;
  transformed: string;
  changes: Array<{
    original: string;
    replacement: string;
    change_type: string;
    explanation: string;
  }>;
  explanation: string;
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      track_entities: true,
      check_consistency: true,
      analyze_clarity: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  return response.json();
}

export async function transformStyle(
  text: string,
  targetStyle: 'formal' | 'casual',
  intensity: number = 0.5
): Promise<StyleTransformResult> {
  const response = await fetch(`${API_BASE}/api/transform/style`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      target_style: targetStyle,
      intensity,
    }),
  });

  if (!response.ok) {
    throw new Error(`Style transformation failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getStyleAnalysis(text: string): Promise<{
  current_style: string;
  contraction_count: number;
  formal_word_count: number;
  average_sentence_length: number;
  passive_voice_ratio: number;
  formality_score: number;
}> {
  const response = await fetch(`${API_BASE}/api/analyze/style-analysis?text=${encodeURIComponent(text)}`);

  if (!response.ok) {
    throw new Error(`Style analysis failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getDiff(original: string, transformed: string): Promise<Array<{
  type: string;
  original_segment: string;
  transformed_segment: string;
}>> {
  const response = await fetch(
    `${API_BASE}/api/transform/diff?original=${encodeURIComponent(original)}&transformed=${encodeURIComponent(transformed)}`
  );

  if (!response.ok) {
    throw new Error(`Diff failed: ${response.statusText}`);
  }

  return response.json();
}
