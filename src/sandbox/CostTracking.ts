/**
 * Claude Cost Analysis Types
 * Tracks token usage and costs for development sessions and feature implementations
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: Date;
}

export interface CostCalculation {
  inputCost: number;   // Cost for input tokens
  outputCost: number;  // Cost for output tokens  
  totalCost: number;   // Total session cost
  model: string;       // Claude model used (sonnet-4, etc.)
}

export interface DevelopmentSession {
  id: string;
  sessionName: string;
  startTime: Date;
  endTime?: Date;
  description: string;
  features: string[];  // Features worked on in this session
  tokenUsage: TokenUsage[];
  totalCost: CostCalculation;
  status: 'active' | 'completed' | 'paused';
}

export interface FeatureCost {
  featureName: string;
  version: string;
  startDate: Date;
  completionDate?: Date;
  sessions: string[];  // Session IDs
  totalTokenUsage: TokenUsage;
  estimatedCost: CostCalculation;
  complexity: 'low' | 'medium' | 'high';
  storyPoints: number;
}

export interface CostSummary {
  totalSessions: number;
  totalFeatures: number;
  totalTokensUsed: number;
  totalEstimatedCost: number;
  avgCostPerFeature: number;
  avgCostPerStoryPoint: number;
  mostExpensiveFeature: string;
  costBreakdownByMonth: Record<string, number>;
}

export interface ClaudeModel {
  name: string;
  inputTokenCost: number;  // Cost per 1M input tokens
  outputTokenCost: number; // Cost per 1M output tokens
  contextWindow: number;
}

// Current Claude pricing (as of 2025)
export const CLAUDE_MODELS: Record<string, ClaudeModel> = {
  'claude-sonnet-4': {
    name: 'Claude Sonnet 4',
    inputTokenCost: 3.00,   // $3 per 1M input tokens
    outputTokenCost: 15.00, // $15 per 1M output tokens
    contextWindow: 200000
  },
  'claude-sonnet-3.5': {
    name: 'Claude Sonnet 3.5',
    inputTokenCost: 3.00,
    outputTokenCost: 15.00,
    contextWindow: 200000
  },
  'claude-haiku': {
    name: 'Claude Haiku',
    inputTokenCost: 0.25,
    outputTokenCost: 1.25,
    contextWindow: 200000
  }
};