import React, { ReactNode } from 'react';
import { useFeatureFlags, useFeature, useFeatureRisk } from '../hooks/useFeatureFlags';
import { FeatureFlagConfig, RISK_LEVEL_DISCLAIMERS } from '../types/FeatureFlags';

interface FeatureFlagProps {
  feature: keyof FeatureFlagConfig;
  children: ReactNode;
  fallback?: ReactNode;
  showDisclaimer?: boolean;
  className?: string;
}

/**
 * Feature Flag Wrapper Component
 * Conditionally renders content based on feature flag status
 * Automatically handles disclaimers for medium/high-risk features
 */
export function FeatureFlag({
  feature,
  children,
  fallback = null,
  showDisclaimer = true,
  className = '',
}: FeatureFlagProps) {
  const isEnabled = useFeature(feature);
  const { riskLevel, requiresDisclaimer } = useFeatureRisk(feature);

  // Feature is disabled, show fallback
  if (!isEnabled) {
    return <>{fallback}</>;
  }

  // Feature is enabled, render with optional disclaimer
  const content = (
    <div className={className}>
      {requiresDisclaimer && showDisclaimer && (
        <div className={`mb-3 p-3 rounded-lg border ${getDisclaimerStyles(riskLevel)}`}>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 mt-0.5">⚠️</span>
            <div className="text-sm">
              <p className="font-medium text-gray-700 mb-1">
                {riskLevel === 'HIGH' ? 'Educational Information' : 'Calculation Estimates'}
              </p>
              <p className="text-gray-600">{RISK_LEVEL_DISCLAIMERS[riskLevel]}</p>
              {riskLevel === 'HIGH' && (
                <p className="text-gray-600 mt-1">
                  <strong>Always consult a qualified tax professional</strong> for official tax
                  advice.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );

  return content;
}

/**
 * High-Risk Feature Wrapper
 * Specifically for features that require strong disclaimers
 */
export function HighRiskFeature({
  feature,
  children,
  fallback,
  className = '',
}: Omit<FeatureFlagProps, 'showDisclaimer'>) {
  return (
    <FeatureFlag feature={feature} fallback={fallback} showDisclaimer={true} className={className}>
      {children}
    </FeatureFlag>
  );
}

/**
 * Medium-Risk Feature Wrapper
 * For features that need disclaimers but are generally safer
 */
export function MediumRiskFeature({
  feature,
  children,
  fallback,
  showDisclaimer = true,
  className = '',
}: FeatureFlagProps) {
  return (
    <FeatureFlag
      feature={feature}
      fallback={fallback}
      showDisclaimer={showDisclaimer}
      className={className}
    >
      {children}
    </FeatureFlag>
  );
}

/**
 * Safe Feature Wrapper
 * For low-risk features that don't need disclaimers
 */
export function SafeFeature({
  feature,
  children,
  fallback,
  className = '',
}: Omit<FeatureFlagProps, 'showDisclaimer'>) {
  return (
    <FeatureFlag feature={feature} fallback={fallback} showDisclaimer={false} className={className}>
      {children}
    </FeatureFlag>
  );
}

/**
 * Feature Flag Hook Component
 * For more complex conditional rendering logic
 */
interface FeatureFlagHookProps {
  children: (flags: {
    isEnabled: boolean;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    requiresDisclaimer: boolean;
  }) => ReactNode;
  feature: keyof FeatureFlagConfig;
}

export function FeatureFlagHook({ children, feature }: FeatureFlagHookProps) {
  const isEnabled = useFeature(feature);
  const { riskLevel, requiresDisclaimer } = useFeatureRisk(feature);

  return <>{children({ isEnabled, riskLevel, requiresDisclaimer })}</>;
}

/**
 * Environment-based Feature Flag
 * Conditional rendering based on environment rather than feature flags
 */
interface EnvironmentFeatureProps {
  environment: 'development' | 'staging' | 'production';
  children: ReactNode;
  fallback?: ReactNode;
}

export function EnvironmentFeature({
  environment,
  children,
  fallback = null,
}: EnvironmentFeatureProps) {
  const { environment: currentEnv } = useFeatureFlags();

  const shouldRender =
    (environment === 'development' && currentEnv.isDevelopment) ||
    (environment === 'staging' && currentEnv.isStaging) ||
    (environment === 'production' && currentEnv.isProduction);

  return shouldRender ? <>{children}</> : <>{fallback}</>;
}

/**
 * Development-only Feature
 * Only renders in development environment
 */
export function DevelopmentOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <EnvironmentFeature environment="development" fallback={fallback}>
      {children}
    </EnvironmentFeature>
  );
}

/**
 * Production-only Feature
 * Only renders in production environment
 */
export function ProductionOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <EnvironmentFeature environment="production" fallback={fallback}>
      {children}
    </EnvironmentFeature>
  );
}

// Helper function for disclaimer styling
function getDisclaimerStyles(riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  switch (riskLevel) {
    case 'HIGH':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'MEDIUM':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'LOW':
    default:
      return 'bg-blue-50 border-blue-200 text-blue-800';
  }
}

export default FeatureFlag;
