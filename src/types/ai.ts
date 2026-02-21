export interface AIRequest {
  id: string;
  userId: string;
  documentId: string;
  feature: AIFeature;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  tokensUsed?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export type AIFeature = 
  | 'summarize'
  | 'translate'
  | 'grammar-check'
  | 'tone-adjustment'
  | 'expand'
  | 'shorten'
  | 'generate-outline'
  | 'help-me-write';

export interface AIFeatureConfig {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  requiresConsent: boolean;
  costPerToken: number;
  dailyLimit: number;
  regions: string[];
}

export interface AIUsageRecord {
  id: string;
  userId: string;
  feature: AIFeature;
  documentId: string;
  tokensUsed: number;
  cost: number;
  timestamp: Date;
}

export interface AIPrompt {
  feature: AIFeature;
  systemPrompt: string;
  userPromptTemplate: string;
  maxTokens: number;
  temperature: number;
}
