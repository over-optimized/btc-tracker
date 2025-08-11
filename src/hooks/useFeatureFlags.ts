import { createContext, useContext } from 'react';
import {
  FeatureFlagContext,
  FeatureFlagConfig,
  FeatureFlagEnvironment,
  DEFAULT_DEVELOPMENT_FLAGS,
  DEFAULT_PRODUCTION_FLAGS,
  DEFAULT_STAGING_FLAGS,
  FEATURE_RISK_LEVELS,
} from '../types/FeatureFlags';

/**
 * Feature Flag React Context
 * Provides feature flag state and utilities throughout the application
 */
export const FeatureFlagContextProvider = createContext<FeatureFlagContext | null>(null);

/**
 * Hook to access feature flags
 * Throws error if used outside of FeatureFlagProvider
 */
export function useFeatureFlags(): FeatureFlagContext {
  const context = useContext(FeatureFlagContextProvider);

  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }

  return context;
}

/**
 * Hook to check if a specific feature is enabled
 * Convenience hook for simple feature checks
 */
export function useFeature(feature: keyof FeatureFlagConfig): boolean {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(feature);
}

/**
 * Hook to get feature risk level and appropriate disclaimers
 */
export function useFeatureRisk(feature: keyof FeatureFlagConfig) {
  const { getRiskLevel, flags } = useFeatureFlags();

  return {
    riskLevel: getRiskLevel(feature),
    isEnabled: flags[feature],
    requiresDisclaimer: getRiskLevel(feature) !== 'LOW',
  };
}

/**
 * Detect current environment and return appropriate default flags
 */
export function getEnvironmentFlags(): {
  flags: FeatureFlagConfig;
  environment: FeatureFlagEnvironment;
} {
  // Check environment variables (Vite uses VITE_ prefix)
  const nodeEnv = import.meta.env.MODE || 'development';
  const safeMode = import.meta.env.VITE_SAFE_MODE === 'true';
  const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  // Determine environment
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production' || safeMode;
  const isStaging = nodeEnv === 'staging';

  const environment: FeatureFlagEnvironment = {
    isDevelopment,
    isProduction,
    isStaging,
    safeMode,
  };

  // Build flags from environment variables and base configuration
  let flags: FeatureFlagConfig;

  if (isProduction || safeMode) {
    // Production: Safe mode - only low risk features, all high/medium disabled
    flags = {
      ...DEFAULT_PRODUCTION_FLAGS,
      // Force disable high-risk features in production
      taxEducation: false,
      transactionGuidance: false,
      expandedClassifications: false,
    };
  } else if (isStaging) {
    flags = { ...DEFAULT_STAGING_FLAGS };
  } else {
    flags = { ...DEFAULT_DEVELOPMENT_FLAGS };
  }

  // Apply environment variable overrides (development/staging only)
  if (!isProduction && !safeMode) {
    // Override specific features based on environment variables
    if (import.meta.env.VITE_ENABLE_EDUCATIONAL_COMPONENTS !== undefined) {
      flags.taxEducation = import.meta.env.VITE_ENABLE_EDUCATIONAL_COMPONENTS === 'true';
    }

    if (import.meta.env.VITE_ENABLE_EXPANDED_CLASSIFICATIONS !== undefined) {
      flags.expandedClassifications =
        import.meta.env.VITE_ENABLE_EXPANDED_CLASSIFICATIONS === 'true';
    }

    if (import.meta.env.VITE_ENABLE_DETAILED_TAX_GUIDANCE !== undefined) {
      flags.transactionGuidance = import.meta.env.VITE_ENABLE_DETAILED_TAX_GUIDANCE === 'true';
    }

    if (import.meta.env.VITE_ENABLE_TAX_OPTIMIZATION !== undefined) {
      flags.taxOptimization = import.meta.env.VITE_ENABLE_TAX_OPTIMIZATION === 'true';
    }
  }

  // Debug logging
  if (debugMode) {
    console.log('🏁 Feature Flag Configuration:', {
      nodeEnv,
      safeMode,
      environment: {
        isDevelopment,
        isProduction,
        isStaging,
        safeMode,
      },
      flags,
      envOverrides: {
        VITE_SAFE_MODE: import.meta.env.VITE_SAFE_MODE,
        VITE_ENABLE_EDUCATIONAL_COMPONENTS: import.meta.env.VITE_ENABLE_EDUCATIONAL_COMPONENTS,
        VITE_ENABLE_EXPANDED_CLASSIFICATIONS: import.meta.env.VITE_ENABLE_EXPANDED_CLASSIFICATIONS,
        VITE_ENABLE_DETAILED_TAX_GUIDANCE: import.meta.env.VITE_ENABLE_DETAILED_TAX_GUIDANCE,
        VITE_ENABLE_TAX_OPTIMIZATION: import.meta.env.VITE_ENABLE_TAX_OPTIMIZATION,
      },
    });
  }

  return { flags, environment };
}

/**
 * Create feature flag context value
 * Used by FeatureFlagProvider component
 */
export function createFeatureFlagContext(
  initialFlags?: Partial<FeatureFlagConfig>,
): FeatureFlagContext {
  const { flags: defaultFlags, environment } = getEnvironmentFlags();

  // Merge with any provided initial flags
  const flags = { ...defaultFlags, ...initialFlags };

  const context: FeatureFlagContext = {
    flags,
    environment,

    updateFlags: (newFlags: Partial<FeatureFlagConfig>) => {
      // In a real implementation, this would update state
      // For now, we'll log the update (React component will handle state)
      console.log('Feature flags would be updated:', newFlags);
    },

    isFeatureEnabled: (feature: keyof FeatureFlagConfig) => {
      return Boolean(flags[feature]);
    },

    getRiskLevel: (feature: keyof FeatureFlagConfig) => {
      return FEATURE_RISK_LEVELS[feature];
    },
  };

  return context;
}

/**
 * Type guard for feature flag keys
 */
export function isValidFeatureFlag(key: string): key is keyof FeatureFlagConfig {
  return key in FEATURE_RISK_LEVELS;
}

/**
 * Get all high-risk features
 */
export function getHighRiskFeatures(): (keyof FeatureFlagConfig)[] {
  return Object.entries(FEATURE_RISK_LEVELS)
    .filter(([_, risk]) => risk === 'HIGH')
    .map(([feature]) => feature as keyof FeatureFlagConfig);
}

/**
 * Get all enabled features by risk level
 */
export function getEnabledFeaturesByRisk(
  flags: FeatureFlagConfig,
): Record<'HIGH' | 'MEDIUM' | 'LOW', (keyof FeatureFlagConfig)[]> {
  const result = { HIGH: [], MEDIUM: [], LOW: [] } as Record<
    'HIGH' | 'MEDIUM' | 'LOW',
    (keyof FeatureFlagConfig)[]
  >;

  Object.entries(flags).forEach(([feature, enabled]) => {
    if (enabled) {
      const featureKey = feature as keyof FeatureFlagConfig;
      const riskLevel = FEATURE_RISK_LEVELS[featureKey];
      result[riskLevel].push(featureKey);
    }
  });

  return result;
}
