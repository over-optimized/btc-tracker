import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  FeatureFlagContext,
  FeatureFlagConfig,
  FeatureFlagEnvironment,
  FEATURE_RISK_LEVELS,
} from '../types/FeatureFlags';
import {
  FeatureFlagContextProvider,
  getEnvironmentFlags,
  getEnabledFeaturesByRisk,
} from '../hooks/useFeatureFlags';

interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlagConfig>;
  debugMode?: boolean;
}

/**
 * Feature Flag Provider Component
 * Provides feature flag context to the entire application
 * Handles environment detection and flag management
 */
export function FeatureFlagProvider({
  children,
  initialFlags,
  debugMode = false,
}: FeatureFlagProviderProps) {
  // Get environment-based default flags
  const { flags: defaultFlags, environment } = getEnvironmentFlags();

  // Merge with initial flags and create state
  const [flags, setFlags] = useState<FeatureFlagConfig>({
    ...defaultFlags,
    ...initialFlags,
  });

  // Log feature flag status in debug mode or development
  useEffect(() => {
    if (debugMode || environment.isDevelopment) {
      const enabledByRisk = getEnabledFeaturesByRisk(flags);

      console.group('🏁 Feature Flag Configuration');
      console.log('Environment:', {
        mode: environment.isDevelopment
          ? 'development'
          : environment.isProduction
            ? 'production'
            : 'staging',
        safeMode: environment.safeMode,
      });
      console.log('Enabled Features by Risk Level:', enabledByRisk);
      console.groupEnd();
    }
  }, [flags, environment, debugMode]);

  // Validate production safety
  useEffect(() => {
    if (environment.isProduction && !environment.safeMode) {
      const highRiskEnabled = Object.entries(flags).filter(
        ([feature, enabled]) =>
          enabled && FEATURE_RISK_LEVELS[feature as keyof FeatureFlagConfig] === 'HIGH',
      );

      if (highRiskEnabled.length > 0) {
        console.warn(
          '⚠️  LEGAL COMPLIANCE WARNING: High-risk features enabled in production:',
          highRiskEnabled.map(([feature]) => feature),
        );
      }
    }
  }, [flags, environment]);

  // Create context value with state management
  const contextValue: FeatureFlagContext = {
    flags,
    environment,

    updateFlags: (newFlags: Partial<FeatureFlagConfig>) => {
      setFlags((currentFlags) => ({ ...currentFlags, ...newFlags }));

      if (debugMode) {
        console.log('🏁 Feature flags updated:', newFlags);
      }
    },

    isFeatureEnabled: (feature: keyof FeatureFlagConfig) => {
      const enabled = Boolean(flags[feature]);

      // Additional safety check for production (simplified)
      if (environment.isProduction && !environment.isStaging) {
        const riskLevel = FEATURE_RISK_LEVELS[feature];
        if (riskLevel === 'HIGH' && enabled) {
          console.warn(`⚠️  High-risk feature '${feature}' accessed in production`);
          return false; // Override and disable high-risk features in production
        }
      }

      return enabled;
    },

    getRiskLevel: (feature: keyof FeatureFlagConfig) => {
      return FEATURE_RISK_LEVELS[feature];
    },
  };

  return (
    <FeatureFlagContextProvider.Provider value={contextValue}>
      {children}
    </FeatureFlagContextProvider.Provider>
  );
}

/**
 * Development-only Feature Flag Debug Panel
 * Shows current flag status and allows runtime toggling
 */
export function FeatureFlagDebugPanel() {
  // Only render in development
  if (import.meta.env.MODE === 'production') {
    return null;
  }

  return null; // TODO: Implement debug panel UI if needed
}

/**
 * Production Safety Warning Component
 * Shows warnings when high-risk features are accidentally enabled
 */
export function ProductionSafetyWarning() {
  const { flags, environment } = React.useContext(FeatureFlagContextProvider) || {
    flags: {},
    environment: { isProduction: false },
  };

  // Only show in production
  if (!environment.isProduction) {
    return null;
  }

  const highRiskEnabled = Object.entries(flags).filter(
    ([feature, enabled]) =>
      enabled && FEATURE_RISK_LEVELS[feature as keyof FeatureFlagConfig] === 'HIGH',
  );

  if (highRiskEnabled.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm font-semibold z-50">
      ⚠️ LEGAL COMPLIANCE WARNING: High-risk features enabled in production
    </div>
  );
}

export default FeatureFlagProvider;
