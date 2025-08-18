import {
  CLAUDE_MODELS,
  CostCalculation,
  CostSummary,
  DevelopmentSession,
  FeatureCost,
  TokenUsage,
} from './CostTracking';

/**
 * Cost Tracking Utility for Claude Development Sessions
 * Tracks token usage and estimates costs for features and sessions
 */
export class CostTracker {
  private static readonly STORAGE_KEY = 'btc-tracker-cost-analysis';
  private static readonly SESSION_KEY = 'btc-tracker-current-session';

  /**
   * Calculate cost from token usage
   */
  static calculateCost(
    tokenUsage: TokenUsage,
    modelName: string = 'claude-sonnet-4',
  ): CostCalculation {
    const model = CLAUDE_MODELS[modelName];
    if (!model) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const inputCost = (tokenUsage.inputTokens / 1_000_000) * model.inputTokenCost;
    const outputCost = (tokenUsage.outputTokens / 1_000_000) * model.outputTokenCost;

    return {
      inputCost: parseFloat(inputCost.toFixed(6)),
      outputCost: parseFloat(outputCost.toFixed(6)),
      totalCost: parseFloat((inputCost + outputCost).toFixed(6)),
      model: model.name,
    };
  }

  /**
   * Start a new development session
   */
  static startSession(
    sessionName: string,
    description: string,
    features: string[] = [],
  ): DevelopmentSession {
    const session: DevelopmentSession = {
      id: this.generateSessionId(),
      sessionName,
      startTime: new Date(),
      description,
      features,
      tokenUsage: [],
      totalCost: {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        model: 'Claude Sonnet 4',
      },
      status: 'active',
    };

    this.saveCurrentSession(session);
    return session;
  }

  /**
   * Add token usage to current session
   */
  static addTokenUsage(
    inputTokens: number,
    outputTokens: number,
    modelName: string = 'claude-sonnet-4',
  ): void {
    const session = this.getCurrentSession();
    if (!session) {
      console.warn('No active session found. Start a session first.');
      return;
    }

    const tokenUsage: TokenUsage = {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      timestamp: new Date(),
    };

    session.tokenUsage.push(tokenUsage);

    // Recalculate total cost
    const totalUsage = this.sumTokenUsage(session.tokenUsage);
    session.totalCost = this.calculateCost(totalUsage, modelName);

    this.saveCurrentSession(session);
  }

  /**
   * Complete current session
   */
  static completeSession(): DevelopmentSession | null {
    const session = this.getCurrentSession();
    if (!session) return null;

    session.endTime = new Date();
    session.status = 'completed';

    // Save to completed sessions
    this.saveCompletedSession(session);

    // Clear current session
    localStorage.removeItem(this.SESSION_KEY);

    return session;
  }

  /**
   * Get current active session
   */
  static getCurrentSession(): DevelopmentSession | null {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    // Convert date strings back to Date objects
    session.startTime = new Date(session.startTime);
    session.tokenUsage.forEach((usage: TokenUsage) => {
      usage.timestamp = new Date(usage.timestamp);
    });

    return session;
  }

  /**
   * Get all completed sessions
   */
  static getCompletedSessions(): DevelopmentSession[] {
    const data = this.getStoredData();
    return data.sessions.map((session) => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      tokenUsage: session.tokenUsage.map((usage: TokenUsage) => ({
        ...usage,
        timestamp: new Date(usage.timestamp),
      })),
    }));
  }

  /**
   * Create feature cost analysis
   */
  static createFeatureCost(
    featureName: string,
    version: string,
    sessionIds: string[],
    storyPoints: number,
    complexity: 'low' | 'medium' | 'high' = 'medium',
  ): FeatureCost {
    const sessions = this.getCompletedSessions().filter((s) => sessionIds.includes(s.id));

    const totalTokenUsage = sessions.reduce(
      (total, session) => {
        const sessionTotal = this.sumTokenUsage(session.tokenUsage);
        return {
          inputTokens: total.inputTokens + sessionTotal.inputTokens,
          outputTokens: total.outputTokens + sessionTotal.outputTokens,
          totalTokens: total.totalTokens + sessionTotal.totalTokens,
          timestamp: new Date(), // Most recent timestamp
        };
      },
      { inputTokens: 0, outputTokens: 0, totalTokens: 0, timestamp: new Date() },
    );

    const estimatedCost = this.calculateCost(totalTokenUsage);

    const featureCost: FeatureCost = {
      featureName,
      version,
      startDate: sessions.length > 0 ? sessions[0].startTime : new Date(),
      completionDate: sessions.length > 0 ? sessions[sessions.length - 1].endTime : undefined,
      sessions: sessionIds,
      totalTokenUsage,
      estimatedCost,
      complexity,
      storyPoints,
    };

    this.saveFeatureCost(featureCost);
    return featureCost;
  }

  /**
   * Generate cost summary
   */
  static generateCostSummary(): CostSummary {
    const data = this.getStoredData();
    const sessions = data.sessions;
    const features = data.features;

    const totalTokens = sessions.reduce(
      (sum, session) => sum + this.sumTokenUsage(session.tokenUsage).totalTokens,
      0,
    );
    const totalCost = sessions.reduce((sum, session) => sum + session.totalCost.totalCost, 0);

    const costByMonth = sessions.reduce(
      (acc, session) => {
        const monthKey = session.startTime.toISOString().substring(0, 7); // YYYY-MM format
        acc[monthKey] = (acc[monthKey] || 0) + session.totalCost.totalCost;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostExpensiveFeature = features.reduce(
      (max, feature) =>
        feature.estimatedCost.totalCost > (max?.estimatedCost.totalCost || 0) ? feature : max,
      null as FeatureCost | null,
    );

    return {
      totalSessions: sessions.length,
      totalFeatures: features.length,
      totalTokensUsed: totalTokens,
      totalEstimatedCost: totalCost,
      avgCostPerFeature: features.length > 0 ? totalCost / features.length : 0,
      avgCostPerStoryPoint:
        features.reduce((sum, f) => sum + f.storyPoints, 0) > 0
          ? totalCost / features.reduce((sum, f) => sum + f.storyPoints, 0)
          : 0,
      mostExpensiveFeature: mostExpensiveFeature?.featureName || 'None',
      costBreakdownByMonth: costByMonth,
    };
  }

  /**
   * Export cost data as CSV
   */
  static exportCostData(): string {
    const data = this.getStoredData();
    const csvRows = [
      'Session,Feature,Start Date,End Date,Input Tokens,Output Tokens,Total Cost,Story Points',
    ];

    data.sessions.forEach((session) => {
      const tokenTotal = this.sumTokenUsage(session.tokenUsage);
      const featureName = session.features.join(';') || 'General Development';
      csvRows.push(
        [
          session.sessionName,
          featureName,
          session.startTime,
          session.endTime || '',
          tokenTotal.inputTokens.toString(),
          tokenTotal.outputTokens.toString(),
          session.totalCost.totalCost.toString(),
          '', // Story points would come from features
        ].join(','),
      );
    });

    return csvRows.join('\n');
  }

  // Private helper methods
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private static sumTokenUsage(usageArray: TokenUsage[]): TokenUsage {
    return usageArray.reduce(
      (total, usage) => ({
        inputTokens: total.inputTokens + usage.inputTokens,
        outputTokens: total.outputTokens + usage.outputTokens,
        totalTokens: total.totalTokens + usage.totalTokens,
        timestamp: usage.timestamp, // Keep last timestamp
      }),
      { inputTokens: 0, outputTokens: 0, totalTokens: 0, timestamp: new Date() },
    );
  }

  private static saveCurrentSession(session: DevelopmentSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  private static saveCompletedSession(session: DevelopmentSession): void {
    const data = this.getStoredData();
    data.sessions.push(session);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private static saveFeatureCost(feature: FeatureCost): void {
    const data = this.getStoredData();
    const existingIndex = data.features.findIndex((f) => f.featureName === feature.featureName);

    if (existingIndex >= 0) {
      data.features[existingIndex] = feature;
    } else {
      data.features.push(feature);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private static getStoredData(): { sessions: DevelopmentSession[]; features: FeatureCost[] } {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : { sessions: [], features: [] };
  }
}
