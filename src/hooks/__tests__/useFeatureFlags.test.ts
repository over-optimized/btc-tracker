import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('useFeatureFlags', () => {
  beforeEach(() => {
    // Reset to a clean state before each test
    vi.unstubAllGlobals();
  });

  afterEach(() => {
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
    it('should have environment detection functions', () => {
      const { environment } = getEnvironmentFlags();

      expect(environment).toHaveProperty('isDevelopment');
      expect(environment).toHaveProperty('isProduction');
      expect(environment).toHaveProperty('isStaging');
      expect(environment).toHaveProperty('safeMode');
    });

    it('should return flags object with all required properties', () => {
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
  });

  describe('createFeatureFlagContext', () => {
    it('should create context with default flags', () => {
      const context = createFeatureFlagContext();

      expect(context.flags).toBeDefined();
      expect(context.environment).toBeDefined();
      expect(context.isFeatureEnabled).toBeTypeOf('function');
      expect(context.getRiskLevel).toBeTypeOf('function');
      expect(context.updateFlags).toBeTypeOf('function');
    });

    it('should merge initial flags with defaults', () => {
      const initialFlags = { taxEducation: true };
      const context = createFeatureFlagContext(initialFlags);

      expect(context.flags.taxEducation).toBe(true);
    });

    it('should correctly check if feature is enabled', () => {
      const context = createFeatureFlagContext({ portfolioTracking: true });

      expect(context.isFeatureEnabled('portfolioTracking')).toBe(true);
      expect(context.isFeatureEnabled('taxEducation')).toBe(false);
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
