/**
 * Feature Flag System Type Definitions
 * Legal compliance feature management for Bitcoin DCA Tracker
 */

export interface FeatureFlagConfig {
  // High-risk features (disabled in production)
  taxEducation: boolean; // Educational content about tax implications
  transactionGuidance: boolean; // Guidance on transaction categorization
  expandedClassifications: boolean; // Advanced transaction classification features

  // Medium-risk features (enhanced disclaimers in production)
  taxCalculations: boolean; // Basic tax calculation features
  taxOptimization: boolean; // Tax optimization suggestions

  // Low-risk features (safe for production)
  portfolioTracking: boolean; // Basic portfolio tracking
  dataVisualization: boolean; // Charts and data visualization
  importExport: boolean; // CSV import/export functionality
}

export interface FeatureFlagEnvironment {
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  safeMode: boolean;
}

export interface FeatureFlagContext {
  flags: FeatureFlagConfig;
  environment: FeatureFlagEnvironment;
  updateFlags: (newFlags: Partial<FeatureFlagConfig>) => void;
  isFeatureEnabled: (feature: keyof FeatureFlagConfig) => boolean;
  getRiskLevel: (feature: keyof FeatureFlagConfig) => 'HIGH' | 'MEDIUM' | 'LOW';
}

// Default configurations for different environments
export const DEFAULT_DEVELOPMENT_FLAGS: FeatureFlagConfig = {
  // Development: All features enabled for continued development
  taxEducation: true,
  transactionGuidance: true,
  expandedClassifications: true,
  taxCalculations: true,
  taxOptimization: true,
  portfolioTracking: true,
  dataVisualization: true,
  importExport: true,
};

export const DEFAULT_PRODUCTION_FLAGS: FeatureFlagConfig = {
  // Production: High-risk features disabled, safe features enabled
  taxEducation: false,
  transactionGuidance: false,
  expandedClassifications: false,
  taxCalculations: true,
  taxOptimization: true,
  portfolioTracking: true,
  dataVisualization: true,
  importExport: true,
};

export const DEFAULT_STAGING_FLAGS: FeatureFlagConfig = {
  // Staging: Selective feature combinations for legal review
  taxEducation: false,
  transactionGuidance: true,
  expandedClassifications: true,
  taxCalculations: true,
  taxOptimization: true,
  portfolioTracking: true,
  dataVisualization: true,
  importExport: true,
};

// Feature risk classification
export const FEATURE_RISK_LEVELS: Record<keyof FeatureFlagConfig, 'HIGH' | 'MEDIUM' | 'LOW'> = {
  taxEducation: 'HIGH',
  transactionGuidance: 'HIGH',
  expandedClassifications: 'HIGH',
  taxCalculations: 'MEDIUM',
  taxOptimization: 'MEDIUM',
  portfolioTracking: 'LOW',
  dataVisualization: 'LOW',
  importExport: 'LOW',
};

// Legal disclaimers for different risk levels
export const RISK_LEVEL_DISCLAIMERS = {
  HIGH: 'This feature provides educational information only and should not be considered as financial or tax advice.',
  MEDIUM:
    'Tax calculations are estimates only. Consult a qualified tax professional for official tax advice.',
  LOW: 'Portfolio tracking and data visualization for informational purposes only.',
};
