import { describe, it, expect } from 'vitest';
import { getHighRiskFeatures, getEnabledFeaturesByRisk } from '../useFeatureFlags';
import {
  DEFAULT_DEVELOPMENT_FLAGS,
  DEFAULT_PRODUCTION_FLAGS,
  FEATURE_RISK_LEVELS,
} from '../../types/FeatureFlags';

describe('useFeatureFlags', () => {
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
});
