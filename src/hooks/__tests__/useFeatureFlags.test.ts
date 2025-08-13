import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getHighRiskFeatures,
  getEnabledFeaturesByRisk,
  getEnvironmentFlags,
  createFeatureFlagContext,
  isValidFeatureFlag,
} from '../useFeatureFlags';
import {
  DEFAULT_DEVELOPMENT_FLAGS,
  DEFAULT_PRODUCTION_FLAGS,
  FEATURE_RISK_LEVELS,
} from '../../types/FeatureFlags';

// Helper function to mock environment variables for legacy tests
// NOTE: Most tests should use testEnv parameter or .env.test defaults instead
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mockEnvironment(envVars: Record<string, string | undefined>) {
  Object.keys(envVars).forEach((key) => {
    vi.stubGlobal(`import.meta.env.${key}`, envVars[key]);
  });
}

describe('useFeatureFlags', () => {
  beforeEach(() => {
    // Reset environment mocks before each test
    vi.unstubAllGlobals();
  });
  describe('getHighRiskFeatures', () => {
    it('should return all high-risk features', () => {
      const highRiskFeatures = getHighRiskFeatures();

      expect(highRiskFeatures).toContain('taxEducation');
      expect(highRiskFeatures).toContain('transactionGuidance');
      expect(highRiskFeatures).toContain('expandedClassifications');

      // Should not contain medium or low risk features
      expect(highRiskFeatures).not.toContain('portfolioTracking');
      expect(highRiskFeatures).not.toContain('taxOptimization');
    });
  });

  describe('getEnabledFeaturesByRisk', () => {
    it('should categorize enabled features by risk level', () => {
      const testFlags = {
        ...DEFAULT_DEVELOPMENT_FLAGS,
        taxEducation: true, // HIGH
        taxOptimization: true, // MEDIUM
        portfolioTracking: true, // LOW
        transactionGuidance: false, // HIGH (disabled)
      };

      const categorized = getEnabledFeaturesByRisk(testFlags);

      expect(categorized.HIGH).toContain('taxEducation');
      expect(categorized.HIGH).not.toContain('transactionGuidance');
      expect(categorized.MEDIUM).toContain('taxOptimization');
      expect(categorized.LOW).toContain('portfolioTracking');
    });
  });

  describe('FEATURE_RISK_LEVELS', () => {
    it('should have correct risk classifications', () => {
      expect(FEATURE_RISK_LEVELS.taxEducation).toBe('HIGH');
      expect(FEATURE_RISK_LEVELS.transactionGuidance).toBe('HIGH');
      expect(FEATURE_RISK_LEVELS.expandedClassifications).toBe('HIGH');
      expect(FEATURE_RISK_LEVELS.taxCalculations).toBe('MEDIUM');
      expect(FEATURE_RISK_LEVELS.taxOptimization).toBe('MEDIUM');
      expect(FEATURE_RISK_LEVELS.portfolioTracking).toBe('LOW');
      expect(FEATURE_RISK_LEVELS.dataVisualization).toBe('LOW');
      expect(FEATURE_RISK_LEVELS.importExport).toBe('LOW');
    });
  });

  describe('production safety', () => {
    it('should disable all high-risk features in production', () => {
      const productionFlags = DEFAULT_PRODUCTION_FLAGS;

      // Verify all high-risk features are disabled
      expect(productionFlags.taxEducation).toBe(false);
      expect(productionFlags.transactionGuidance).toBe(false);
      expect(productionFlags.expandedClassifications).toBe(false);

      // Verify medium-risk features can be enabled (with disclaimers)
      expect(productionFlags.taxCalculations).toBe(true);
      expect(productionFlags.taxOptimization).toBe(true);

      // Verify low-risk features are enabled
      expect(productionFlags.portfolioTracking).toBe(true);
      expect(productionFlags.dataVisualization).toBe(true);
      expect(productionFlags.importExport).toBe(true);
    });
  });

  describe('getEnvironmentFlags', () => {
    it('should use test environment defaults from .env.test', () => {
      // This test verifies .env.test is loaded correctly
      const { environment, flags } = getEnvironmentFlags();

      // Should detect test mode as development (from .env.test: MODE=test)
      expect(environment.isDevelopment).toBe(true); // test mode = development in simplified logic
      expect(environment.isProduction).toBe(false);
      expect(environment.isStaging).toBe(false);

      // Should use test environment defaults from .env.test
      expect(flags.taxEducation).toBe(false); // VITE_ENABLE_EDUCATIONAL_COMPONENTS=false
      expect(flags.expandedClassifications).toBe(false); // VITE_ENABLE_EXPANDED_CLASSIFICATIONS=false
      expect(flags.taxOptimization).toBe(true); // VITE_ENABLE_TAX_OPTIMIZATION=true
      expect(flags.portfolioTracking).toBe(true); // VITE_ENABLE_PORTFOLIO_TRACKING=true (default)
    });

    it('should detect development environment correctly using testEnv parameter', () => {
      // Use testEnv parameter for complex environment testing
      const testEnv = {
        MODE: 'development',
        VITE_SAFE_MODE: undefined,
      };

      const { environment, flags } = getEnvironmentFlags(testEnv);

      expect(environment.isDevelopment).toBe(true);
      expect(environment.isProduction).toBe(false);
      expect(environment.isStaging).toBe(false);
      expect(environment.safeMode).toBe(false);

      // Development should enable high-risk features
      expect(flags.taxEducation).toBe(true);
      expect(flags.transactionGuidance).toBe(true);
      expect(flags.expandedClassifications).toBe(true);
    });

    it('should detect production environment correctly using testEnv parameter', () => {
      // Use testEnv parameter for complex environment testing
      const testEnv = {
        MODE: 'production',
        VITE_SAFE_MODE: undefined,
      };

      const { environment, flags } = getEnvironmentFlags(testEnv);

      expect(environment.isDevelopment).toBe(false);
      expect(environment.isProduction).toBe(true);
      expect(environment.isStaging).toBe(false);

      // Production should disable high-risk features
      expect(flags.taxEducation).toBe(false);
      expect(flags.transactionGuidance).toBe(false);
      expect(flags.expandedClassifications).toBe(false);

      // Medium and low-risk features should be enabled
      expect(flags.taxCalculations).toBe(true);
      expect(flags.portfolioTracking).toBe(true);
    });

    it('should detect safe mode correctly using testEnv parameter', () => {
      // Use testEnv parameter for complex environment testing
      const testEnv = {
        MODE: 'development',
        VITE_SAFE_MODE: 'true',
      };

      const { environment, flags } = getEnvironmentFlags(testEnv);

      expect(environment.safeMode).toBe(true);
      expect(environment.isDevelopment).toBe(true); // Still development mode
      expect(environment.isProduction).toBe(false); // Safe mode doesn't force production in simplified logic

      // Safe mode in development still uses development defaults (simplified logic)
      // High-risk features are only forcibly disabled in production
      expect(flags.taxEducation).toBe(true); // Development default
      expect(flags.expandedClassifications).toBe(true); // Development default
    });

    it('should detect staging environment correctly using testEnv parameter', () => {
      // Use testEnv parameter for complex environment testing
      const testEnv = {
        MODE: 'staging',
        VITE_SAFE_MODE: undefined,
      };

      const { environment, flags } = getEnvironmentFlags(testEnv);

      expect(environment.isDevelopment).toBe(false);
      expect(environment.isProduction).toBe(false);
      expect(environment.isStaging).toBe(true);

      // Staging should have selective features (per DEFAULT_STAGING_FLAGS)
      expect(flags.taxEducation).toBe(false);
      expect(flags.transactionGuidance).toBe(true);
      expect(flags.expandedClassifications).toBe(true);
    });

    it('should return flags object with all required properties', () => {
      // Use .env.test defaults for simple property checking
      const { flags } = getEnvironmentFlags();

      expect(flags).toHaveProperty('taxEducation');
      expect(flags).toHaveProperty('transactionGuidance');
      expect(flags).toHaveProperty('expandedClassifications');
      expect(flags).toHaveProperty('taxCalculations');
      expect(flags).toHaveProperty('taxOptimization');
      expect(flags).toHaveProperty('portfolioTracking');
      expect(flags).toHaveProperty('dataVisualization');
      expect(flags).toHaveProperty('importExport');
    });

    it('should respect environment variable overrides in development using testEnv parameter', () => {
      // Use testEnv parameter for complex environment variable testing
      const testEnv = {
        MODE: 'development',
        VITE_SAFE_MODE: undefined,
        VITE_ENABLE_EDUCATIONAL_COMPONENTS: 'false',
        VITE_ENABLE_DETAILED_TAX_GUIDANCE: 'false',
      };

      const { flags } = getEnvironmentFlags(testEnv);

      // Environment variables should override defaults in development
      expect(flags.taxEducation).toBe(false);
      expect(flags.transactionGuidance).toBe(false);
    });

    it('should ignore high-risk overrides in production/safe mode using testEnv parameter', () => {
      // Use testEnv parameter for complex production override testing
      const testEnv = {
        MODE: 'production',
        VITE_SAFE_MODE: undefined,
        VITE_ENABLE_EDUCATIONAL_COMPONENTS: 'true', // Should be ignored
        VITE_ENABLE_EXPANDED_CLASSIFICATIONS: 'true', // Should be ignored
        VITE_ENABLE_DETAILED_TAX_GUIDANCE: 'true', // Should work (medium risk)
      };

      const { flags } = getEnvironmentFlags(testEnv);

      // High-risk overrides should be ignored in production
      expect(flags.taxEducation).toBe(false);
      expect(flags.expandedClassifications).toBe(false);

      // Medium-risk override should work
      expect(flags.transactionGuidance).toBe(true);
    });
  });

  describe('createFeatureFlagContext', () => {
    it('should create context with default flags using .env.test', () => {
      // Uses .env.test defaults - no testEnv parameter needed
      const context = createFeatureFlagContext();

      expect(context.flags).toBeDefined();
      expect(context.environment).toBeDefined();
      expect(context.isFeatureEnabled).toBeTypeOf('function');
      expect(context.getRiskLevel).toBeTypeOf('function');
      expect(context.updateFlags).toBeTypeOf('function');
    });

    it('should merge initial flags with defaults', () => {
      // Uses .env.test defaults with initial flag override
      const initialFlags = { taxEducation: true };
      const context = createFeatureFlagContext(initialFlags);

      expect(context.flags.taxEducation).toBe(true);
    });

    it('should correctly check if feature is enabled using .env.test defaults', () => {
      // Uses .env.test defaults - simpler test without complex environment mocking
      const context = createFeatureFlagContext({ portfolioTracking: true });

      expect(context.isFeatureEnabled('portfolioTracking')).toBe(true);
      expect(context.isFeatureEnabled('taxEducation')).toBe(false); // From .env.test
    });

    it('should work with testEnv parameter for complex scenarios', () => {
      // Use testEnv parameter for complex environment testing
      const testEnv = {
        MODE: 'development',
        VITE_ENABLE_EDUCATIONAL_COMPONENTS: 'true',
      };

      const context = createFeatureFlagContext({ portfolioTracking: true }, testEnv);

      expect(context.isFeatureEnabled('portfolioTracking')).toBe(true);
      expect(context.isFeatureEnabled('taxEducation')).toBe(true); // From testEnv override
    });

    it('should return correct risk level', () => {
      const context = createFeatureFlagContext();

      expect(context.getRiskLevel('taxEducation')).toBe('HIGH');
      expect(context.getRiskLevel('taxOptimization')).toBe('MEDIUM');
      expect(context.getRiskLevel('portfolioTracking')).toBe('LOW');
    });

    it('should log update flags call', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const context = createFeatureFlagContext();

      context.updateFlags({ taxEducation: true });

      expect(consoleSpy).toHaveBeenCalledWith('Feature flags would be updated:', {
        taxEducation: true,
      });

      consoleSpy.mockRestore();
    });
  });

  describe('isValidFeatureFlag', () => {
    it('should return true for valid feature flags', () => {
      expect(isValidFeatureFlag('taxEducation')).toBe(true);
      expect(isValidFeatureFlag('portfolioTracking')).toBe(true);
      expect(isValidFeatureFlag('transactionGuidance')).toBe(true);
    });

    it('should return false for invalid feature flags', () => {
      expect(isValidFeatureFlag('invalidFlag')).toBe(false);
      expect(isValidFeatureFlag('')).toBe(false);
      expect(isValidFeatureFlag('randomString')).toBe(false);
    });
  });
});
