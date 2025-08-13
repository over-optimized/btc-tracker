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
 *
 * @param testEnv - Optional test environment override for complex test scenarios
 *                  When not provided, uses import.meta.env (including .env.test in test mode)
 */
export function getEnvironmentFlags(testEnv?: Record<string, string | undefined>): {
  flags: FeatureFlagConfig;
  environment: FeatureFlagEnvironment;
} {
  // Hybrid approach: Use testEnv for complex scenarios, otherwise use import.meta.env
  // In test mode, import.meta.env includes values from .env.test
  const env = testEnv || import.meta.env;
  const nodeEnv = env.MODE || 'development';
  const safeMode = env.VITE_SAFE_MODE === 'true';
  const debugMode = env.VITE_DEBUG_MODE === 'true';

  // Determine environment
  const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';
  const isProduction = nodeEnv === 'production';
  const isStaging = nodeEnv === 'staging';

  const environment: FeatureFlagEnvironment = {
    isDevelopment,
    isProduction,
    isStaging,
    safeMode,
  };

  // Build flags from environment variables and base configuration
  let flags: FeatureFlagConfig;

  if (isProduction && !isStaging) {
    // Production: Safe mode - only low risk features, all high/medium disabled
    flags = {
      ...DEFAULT_PRODUCTION_FLAGS,
      // Force disable high-risk features in production
      taxEducation: false,
      expandedClassifications: false,
      // transactionGuidance removed from hardcoded overrides - can be enabled with proper disclaimers
    };
  } else if (isStaging) {
    // Staging: Use staging defaults even with safe mode enabled
    flags = { ...DEFAULT_STAGING_FLAGS };
  } else {
    // Development: All features enabled
    flags = { ...DEFAULT_DEVELOPMENT_FLAGS };
  }

  // Apply environment variable overrides
  if (isDevelopment || isStaging) {
    // Development/Staging: Allow all environment variable overrides
    if (env.VITE_ENABLE_EDUCATIONAL_COMPONENTS !== undefined) {
      flags.taxEducation = env.VITE_ENABLE_EDUCATIONAL_COMPONENTS === 'true';
    }

    if (env.VITE_ENABLE_EXPANDED_CLASSIFICATIONS !== undefined) {
      flags.expandedClassifications = env.VITE_ENABLE_EXPANDED_CLASSIFICATIONS === 'true';
    }

    if (env.VITE_ENABLE_DETAILED_TAX_GUIDANCE !== undefined) {
      flags.transactionGuidance = env.VITE_ENABLE_DETAILED_TAX_GUIDANCE === 'true';
    }

    if (env.VITE_ENABLE_TAX_OPTIMIZATION !== undefined) {
      flags.taxOptimization = env.VITE_ENABLE_TAX_OPTIMIZATION === 'true';
    }
  } else if (isProduction && !isStaging) {
    // Production: Allow selective overrides for SAFE features only (with proper disclaimers)
    // High-risk features remain hardcoded to false above

    if (env.VITE_ENABLE_DETAILED_TAX_GUIDANCE !== undefined) {
      flags.transactionGuidance = env.VITE_ENABLE_DETAILED_TAX_GUIDANCE === 'true';
    }

    // Note: taxEducation and expandedClassifications remain hardcoded to false in production
    // Only transactionGuidance is allowed to be overridden since it has enhanced disclaimers
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
        VITE_SAFE_MODE: env.VITE_SAFE_MODE,
        VITE_ENABLE_EDUCATIONAL_COMPONENTS: env.VITE_ENABLE_EDUCATIONAL_COMPONENTS,
        VITE_ENABLE_EXPANDED_CLASSIFICATIONS: env.VITE_ENABLE_EXPANDED_CLASSIFICATIONS,
        VITE_ENABLE_DETAILED_TAX_GUIDANCE: env.VITE_ENABLE_DETAILED_TAX_GUIDANCE,
        VITE_ENABLE_TAX_OPTIMIZATION: env.VITE_ENABLE_TAX_OPTIMIZATION,
      },
    });
  }

  return { flags, environment };
}

/**
 * Create feature flag context value
 * Used by FeatureFlagProvider component
 *
 * @param initialFlags - Optional initial flag overrides
 * @param testEnv - Optional test environment override for complex test scenarios
 */
export function createFeatureFlagContext(
  initialFlags?: Partial<FeatureFlagConfig>,
  testEnv?: Record<string, string | undefined>,
): FeatureFlagContext {
  const { flags: defaultFlags, environment } = getEnvironmentFlags(testEnv);

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
