export interface CharacterInfo {
  name: string
  aliases: string[]
  traits: string[]
  role?: string
  first_mention_paragraph: number
  mention_count: number
}

export interface Suggestion {
  suggestion_id: string
  original_text: string
  modified_text: string
  rule_triggered: string
  reason: string
  confidence: number
  improvement_score: number
  source: 'custom_pipeline' | 'llm_rewrite'
  severity: 'high' | 'medium' | 'low'
  status: 'pending' | 'accepted' | 'rejected'
  location?: Record<string, unknown>
}

export interface EmotionData {
  paragraph: number
  emotions: Record<string, number>
  dominant_emotion?: string
  intensity?: number
}

export interface EmotionalArc {
  arc_shape: string
  flat_zones: Array<{
    paragraphs: number[]
    dominant_emotion: string
    suggestion: string
  }>
  pacing_scores: number[]
  emotion_timeline: EmotionData[]
  statistics?: {
    avg_intensity: number
    emotion_distribution: Record<string, number>
  }
}

export interface StyleFingerprint {
  sentence_length_mean: number
  sentence_length_std: number
  passive_voice_ratio: number
  vocabulary_complexity: number
  dialogue_percentage: number
  narrative_density: number
  adverb_usage_rate: number
  rhetorical_question_frequency: number
  paragraph_length_variance: number
}

export interface ReadabilityScores {
  flesch_kincaid: number
  flesch_kincaid_grade: number
  gunning_fog: number
  coleman_liau: number
  smog: number
  dale_chall: number
}

// Knowledge Graph types
export interface KGEntity {
  name: string
  entity_type: string
  frequency: number
  first_paragraph: number
  mentions: Array<{ paragraph: number; context: string }>
  attributes: Record<string, string>
}

export interface KGRelationship {
  source: string
  target: string
  relationship_type: string
  weight: number
  paragraphs: number[]
  evidence: string[]
}

export interface KGEvent {
  description: string
  paragraph: number
  entities_involved: string[]
  temporal_marker?: string
  event_type: string
}

export interface KnowledgeGraphResponse {
  entities: KGEntity[]
  relationships: KGRelationship[]
  events: KGEvent[]
  entity_frequency_map: Record<string, number[]>
  orphaned_entities: string[]
  central_entities: string[]
  graph_stats: Record<string, unknown>
}

// SEO types
export interface SEOAnalysisResponse {
  overall_score: number
  keyword_analysis: {
    target_keywords: string[]
    keyword_data: Record<string, { count: number; density: number; in_ideal_range: boolean; distribution_score: number }>
    average_density: number
    keyword_score: number
  }
  heading_analysis: {
    headings: Array<{ level: number; content: string }>
    h1_count: number
    total_headings: number
    hierarchy_valid: boolean
    heading_score: number
  }
  content_analysis: {
    word_count: number
    sentence_count: number
    paragraph_count: number
    avg_sentence_length: number
    vocabulary_richness: number
    semantic_richness: number
    content_score: number
  }
  issues: Array<{ issue_type: string; severity: string; explanation: string; suggestion: string; score: number }>
  recommendations: string[]
  meta_suggestions: {
    suggested_title: string
    suggested_meta_description: string
    title_length: number
    meta_description_length: number
  }
}

// Comparative Analysis types
export interface CompareResponse {
  structural_diff: {
    paragraphs_original: number
    paragraphs_modified: number
    matched_pairs: Array<{
      original_index: number
      modified_index: number
      similarity: number
      change_type: string
      original_preview: string
      modified_preview: string
    }>
    additions: Array<{ index: number; preview: string }>
    deletions: Array<{ index: number; preview: string }>
    paragraphs_added: number
    paragraphs_deleted: number
    reordered: boolean
  }
  word_stats: {
    word_count_original: number
    word_count_modified: number
    word_count_delta: number
    word_count_change_pct: number
    words_added: number
    words_removed: number
    overall_similarity: number
  }
  readability_delta: {
    original: Record<string, number>
    modified: Record<string, number>
    delta: Record<string, number>
    readability_improved: boolean
  }
  style_delta: {
    original: Record<string, number>
    modified: Record<string, number>
    delta: Record<string, number>
  }
  vocabulary_comparison: {
    new_terms: string[]
    removed_terms: string[]
    frequency_changes: Array<{ word: string; delta: number }>
    vocabulary_growth: number
  }
  sentence_diff: {
    sentences_original: number
    sentences_modified: number
    sentences_added: number
    sentences_removed: number
    sentences_modified_count: number
    sentences_unchanged: number
  }
  improvement_score: {
    overall: number
    breakdown: Record<string, number>
  }
  summary: string
}

// Accessibility types
export interface AccessibilityResponse {
  simplification: {
    total_sentences: number
    complex_count: number
    simplification_potential: number
    complex_sentences: Array<{
      index: number
      original: string
      simplified: string
      complexity_before: number
      complexity_after: number
      changes: string[]
    }>
  }
  idea_clusters: {
    clusters: Array<{
      topic: string
      paragraph_indices: number[]
      paragraph_count: number
      is_scattered: boolean
      suggestion?: string
    }>
    total_clusters: number
    scattered_topics: number
    reorganization_needed: boolean
    suggestion: string
  }
  naturalness: {
    score: number
    issues: Array<{ sentence_index: number; sentence: string; issue: string }>
    issue_count: number
    is_natural: boolean
    grade: string
  }
  readability_assessment: {
    grade_level: number
    avg_sentence_length: number
    avg_word_length: number
    long_sentences_count: number
    recommended_audience: string
  }
  dyslexia_suggestions: {
    suggestions: Array<{ type: string; suggestion: string; priority: string }>
    dyslexia_friendly_score: number
  }
  structure_suggestions: {
    suggestions: Array<Record<string, unknown>>
    structure_score: number
  }
  overall_accessibility_score: {
    overall: number
    simplification: number
    naturalness: number
    readability: number
    grade: string
  }
}

// Watermarking types
export interface WatermarkEmbedResponse {
  watermarked_text: string
  watermark_id: string
  bits_encoded: number
  bits_total: number
  modifications_made: number
  encoding_success_rate: number
}

export interface WatermarkDetectResponse {
  watermark_detected: boolean
  decoded_id?: string
  bits_detected: number
  confidence: number
  evidence: string[]
}

export interface StylometricSignature {
  signature_hash: string
  avg_word_length: number
  avg_sentence_length: number
  vocabulary_richness: number
  letter_frequencies: Record<string, number>
  punctuation_patterns: Record<string, number>
  function_word_usage: Record<string, number>
  hapax_legomena_ratio: number
}

// Admin Dashboard types
export interface AdminStats {
  total_analyses: number
  total_documents: number
  total_suggestions: number
  acceptance_rate: number
  avg_processing_time_ms: number
  llm_calls_total: number
  rule_trigger_frequency: Record<string, number>
  suggestion_stats: {
    total: number
    accepted: number
    rejected: number
    pending: number
  }
  model_performance: Record<string, unknown>
}

export interface AnalysisResponse {
  document_id: string
  word_count: number
  sentence_count: number
  paragraph_count: number
  language: string
  characters: CharacterInfo[]
  contradictions: unknown[]
  structural_issues: unknown[]
  suggestions: Suggestion[]
  emotional_arc?: EmotionalArc
  style_fingerprint?: StyleFingerprint
  readability_scores?: ReadabilityScores
  knowledge_graph?: KnowledgeGraphResponse
  seo_analysis?: SEOAnalysisResponse
  accessibility?: AccessibilityResponse
  llm_calls_used: number
  processing_time_ms: number
}

export interface AnalysisRequest {
  text: string
  genre?: string
  mode?: string
  enable_narrative?: boolean
  enable_structural?: boolean
  enable_emotional?: boolean
  enable_style?: boolean
  enable_seo?: boolean
  enable_accessibility?: boolean
  enable_knowledge_graph?: boolean
}

export interface Document {
  id: string
  title: string
  content: string
  genre: string
  word_count: number
  created_at: string
  updated_at: string
  analysis?: AnalysisResponse
}
