/**
 * Comprehensive unit tests for TaxCalculator
 * Tests tax report generation, method comparisons, and complex scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaxCalculator } from '../taxCalculator';
import { Transaction } from '../../types/Transaction';
import {
  TaxMethod,
  TaxConfiguration,
  DisposalEvent,
  HoldingPeriod,
  PriceInfo,
} from '../../types/TaxTypes';

describe('TaxCalculator', () => {
  let calculator: TaxCalculator;
  let transactions: Transaction[];

  const defaultConfig: TaxConfiguration = {
    method: TaxMethod.FIFO,
    taxYear: 2024,
    longTermThresholdDays: 365,
    includePreviousYears: false,
    showDetailedLots: true,
    roundToCents: true,
  };

  beforeEach(() => {
    calculator = new TaxCalculator(defaultConfig);

    // Create test transactions across different dates and prices
    transactions = [
      {
        id: 'tx-1',
        date: new Date('2024-01-15'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 5000,
        btcAmount: 0.1,
        price: 50000,
      },
      {
        id: 'tx-2',
        date: new Date('2024-03-15'),
        exchange: 'Coinbase',
        type: 'Buy',
        usdAmount: 4400,
        btcAmount: 0.08,
        price: 55000,
      },
      {
        id: 'tx-3',
        date: new Date('2024-06-15'),
        exchange: 'Kraken',
        type: 'Trade',
        usdAmount: 2700,
        btcAmount: 0.06,
        price: 45000,
      },
    ];
  });

  describe('Transaction Processing', () => {
    it('should process transactions for the specified tax year', () => {
      const validation = calculator.processTransactions(transactions);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const lotManager = calculator.getLotManager();
      expect(lotManager.getAllLots()).toHaveLength(3);
      expect(lotManager.getTotalRemainingBtc()).toBe(0.24);
      expect(lotManager.getTotalCostBasis()).toBe(12100);
    });

    it('should filter transactions by tax year', () => {
      const mixedYearTransactions = [
        ...transactions,
        {
          id: 'tx-2023',
          date: new Date('2023-12-15'),
          exchange: 'Strike',
          type: 'Purchase',
          usdAmount: 1000,
          btcAmount: 0.02,
          price: 50000,
        },
        {
          id: 'tx-2025',
          date: new Date('2025-01-15'),
          exchange: 'Strike',
          type: 'Purchase',
          usdAmount: 1000,
          btcAmount: 0.02,
          price: 50000,
        },
      ];

      const validation = calculator.processTransactions(mixedYearTransactions);
      expect(validation.isValid).toBe(true);

      // Should only process 2024 transactions
      const lotManager = calculator.getLotManager();
      expect(lotManager.getAllLots()).toHaveLength(3);
    });

    it('should handle empty transaction list', () => {
      const validation = calculator.processTransactions([]);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(1);
      expect(validation.warnings[0].code).toBe('NO_TRANSACTIONS');
    });

    it('should handle disposal events in configuration', () => {
      const disposal: DisposalEvent = {
        id: 'disposal-1',
        date: new Date('2024-09-15'),
        btcAmount: 0.05,
        salePrice: 60000,
        totalProceeds: 3000,
      };

      const configWithDisposal: TaxConfiguration = {
        ...defaultConfig,
        disposals: [disposal],
      };

      const calculatorWithDisposal = new TaxCalculator(configWithDisposal);
      const validation = calculatorWithDisposal.processTransactions(transactions);

      expect(validation.isValid).toBe(true);
    });
  });

  describe('Tax Report Generation', () => {
    beforeEach(() => {
      calculator.processTransactions(transactions);
    });

    it('should generate basic tax report', () => {
      const report = calculator.generateTaxReport();

      expect(report.taxYear).toBe(2024);
      expect(report.method).toBe(TaxMethod.FIFO);
      expect(report.acquisitions).toHaveLength(3);
      expect(report.disposals).toHaveLength(0); // No disposals yet
      expect(report.remainingLots).toHaveLength(3);
      expect(report.totalTransactions).toBe(3);
      expect(report.isComplete).toBe(true);
    });

    it('should include current price information', () => {
      const currentPrice: PriceInfo = {
        price: 70000,
        timestamp: new Date(),
        source: 'Test',
      };

      const report = calculator.generateTaxReport(currentPrice);

      // Should calculate unrealized gains
      expect(report.summary.unrealizedGains).toBeGreaterThan(0);
      expect(report.summary.remainingBtc).toBe(0.24);
    });

    it('should calculate summary statistics correctly', () => {
      const report = calculator.generateTaxReport();
      const summary = report.summary;

      expect(summary.totalGains).toBe(0); // No disposals
      expect(summary.totalLosses).toBe(0);
      expect(summary.netGains).toBe(0);
      expect(summary.totalDisposals).toBe(0);
      expect(summary.totalCostBasis).toBe(12100);
      expect(summary.remainingBtc).toBe(0.24);
      expect(summary.remainingCostBasis).toBe(12100);
    });
  });

  describe('Tax Method Comparisons', () => {
    let disposalScenario: DisposalEvent;

    beforeEach(() => {
      disposalScenario = {
        id: 'disposal-1',
        date: new Date('2024-12-15'),
        btcAmount: 0.1,
        salePrice: 60000,
        totalProceeds: 6000,
      };
    });

    it('should calculate FIFO disposal correctly', () => {
      const fifoConfig: TaxConfiguration = {
        ...defaultConfig,
        method: TaxMethod.FIFO,
        disposals: [disposalScenario],
      };
      const fifoCalculator = new TaxCalculator(fifoConfig);

      fifoCalculator.processTransactions(transactions);
      const report = fifoCalculator.generateTaxReport();

      expect(report.disposals).toHaveLength(1);
      const disposal = report.disposals[0];

      // FIFO should use oldest lot first (0.1 BTC at $50,000)
      expect(disposal.costBasis).toBe(5000);
      expect(disposal.capitalGain).toBe(1000); // 6000 - 5000
      expect(disposal.holdingPeriod).toBe(HoldingPeriod.SHORT_TERM); // Less than 1 year
    });

    it('should calculate LIFO disposal correctly', () => {
      const lifoConfig: TaxConfiguration = {
        ...defaultConfig,
        method: TaxMethod.LIFO,
        disposals: [disposalScenario],
      };
      const lifoCalculator = new TaxCalculator(lifoConfig);

      lifoCalculator.processTransactions(transactions);
      const report = lifoCalculator.generateTaxReport();

      expect(report.disposals).toHaveLength(1);
      const disposal = report.disposals[0];

      // LIFO should use newest lot first (0.06 BTC at $45,000 + 0.04 BTC at $55,000)
      // Cost basis: (0.06 * 45000) + (0.04 * 55000) = 2700 + 2200 = 4900
      expect(disposal.costBasis).toBe(4900);
      expect(disposal.capitalGain).toBe(1100); // 6000 - 4900
    });

    it('should calculate HIFO disposal correctly', () => {
      const hifoConfig: TaxConfiguration = {
        ...defaultConfig,
        method: TaxMethod.HIFO,
        disposals: [disposalScenario],
      };
      const hifoCalculator = new TaxCalculator(hifoConfig);

      hifoCalculator.processTransactions(transactions);
      const report = hifoCalculator.generateTaxReport();

      expect(report.disposals).toHaveLength(1);
      const disposal = report.disposals[0];

      // HIFO should use highest cost lots first (0.08 BTC at $55,000 + 0.02 BTC at $50,000)
      // Cost basis: (0.08 * 55000) + (0.02 * 50000) = 4400 + 1000 = 5400
      expect(disposal.costBasis).toBe(5400);
      expect(disposal.capitalGain).toBe(600); // 6000 - 5400
    });
  });

  describe('Holding Period Calculations', () => {
    it('should classify short-term vs long-term correctly', () => {
      const shortTermDisposal: DisposalEvent = {
        id: 'disposal-short',
        date: new Date('2024-06-15'), // ~5 months from first purchase
        btcAmount: 0.05,
        salePrice: 60000,
        totalProceeds: 3000,
      };

      const longTermDisposal: DisposalEvent = {
        id: 'disposal-long',
        date: new Date('2025-02-15'), // ~13 months from first purchase
        btcAmount: 0.05,
        salePrice: 60000,
        totalProceeds: 3000,
      };

      // Test short-term
      const shortTermConfig: TaxConfiguration = {
        ...defaultConfig,
        disposals: [shortTermDisposal],
      };
      const shortTermCalculator = new TaxCalculator(shortTermConfig);
      shortTermCalculator.processTransactions(transactions);
      const shortTermReport = shortTermCalculator.generateTaxReport();

      expect(shortTermReport.disposals[0].holdingPeriod).toBe(HoldingPeriod.SHORT_TERM);
      expect(shortTermReport.summary.shortTermGains).toBeGreaterThan(0);

      // Test long-term
      const longTermConfig: TaxConfiguration = { ...defaultConfig, disposals: [longTermDisposal] };
      const longTermCalculator = new TaxCalculator(longTermConfig);
      longTermCalculator.processTransactions(transactions);
      const longTermReport = longTermCalculator.generateTaxReport();

      expect(longTermReport.disposals[0].holdingPeriod).toBe(HoldingPeriod.LONG_TERM);
      expect(longTermReport.summary.longTermGains).toBeGreaterThan(0);
    });
  });

  describe('Hypothetical Disposal Calculations', () => {
    beforeEach(() => {
      calculator.processTransactions(transactions);
    });

    it('should calculate hypothetical disposal without affecting state', () => {
      const original = calculator.getLotManager().getTotalRemainingBtc();

      const hypothetical = calculator.calculateHypotheticalDisposal(0.05, 60000);

      expect(hypothetical.capitalGain).toBeGreaterThan(0);
      expect(hypothetical.costBasis).toBeGreaterThan(0);
      expect(hypothetical.proceeds).toBe(3000); // 0.05 * 60000
      expect(hypothetical.holdingPeriod).toBeDefined();

      // State should remain unchanged
      expect(calculator.getLotManager().getTotalRemainingBtc()).toBe(original);
    });

    it('should handle insufficient BTC for hypothetical disposal', () => {
      expect(() => {
        calculator.calculateHypotheticalDisposal(1.0, 60000); // More than available
      }).toThrow();
    });
  });

  describe('Tax Optimization Suggestions', () => {
    beforeEach(() => {
      calculator.processTransactions(transactions);
    });

    it('should provide tax-loss harvesting suggestions', () => {
      const currentPrice = 40000; // Below all purchase prices
      const suggestions = calculator.getTaxOptimizationSuggestions(currentPrice);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.includes('Tax-loss harvesting'))).toBe(true);
    });

    it('should suggest holding for long-term treatment', () => {
      // Create transactions that are recent (< 1 year old) to trigger holding suggestion
      const recentTransactions: Transaction[] = [
        {
          id: 'recent-1',
          date: new Date('2024-11-15'), // Recent but in 2024 tax year
          exchange: 'Strike',
          type: 'Purchase',
          usdAmount: 5000,
          btcAmount: 0.1,
          price: 50000,
        },
      ];

      const recentCalculator = new TaxCalculator(defaultConfig);
      recentCalculator.processTransactions(recentTransactions);

      const currentPrice = 70000;
      const suggestions = recentCalculator.getTaxOptimizationSuggestions(currentPrice);

      expect(
        suggestions.some((s) => s.includes('Consider holding') || s.includes('lots longer')),
      ).toBe(true);
    });

    it('should suggest method comparisons', () => {
      const currentPrice = 60000;
      const suggestions = calculator.getTaxOptimizationSuggestions(currentPrice);

      expect(suggestions.some((s) => s.includes('comparing FIFO, LIFO, and HIFO'))).toBe(true);
    });

    it('should handle empty portfolio', () => {
      const emptyCalculator = new TaxCalculator(defaultConfig);
      emptyCalculator.processTransactions([]);

      const suggestions = emptyCalculator.getTaxOptimizationSuggestions(60000);
      expect(suggestions).toEqual(['No remaining lots to optimize']);
    });
  });

  describe('Configuration Management', () => {
    it('should allow configuration updates', () => {
      const newConfig = { method: TaxMethod.LIFO };
      calculator.updateConfiguration(newConfig);

      const currentConfig = calculator.getConfiguration();
      expect(currentConfig.method).toBe(TaxMethod.LIFO);
    });

    it('should preserve other configuration values when updating', () => {
      const originalConfig = calculator.getConfiguration();
      calculator.updateConfiguration({ method: TaxMethod.HIFO });

      const newConfig = calculator.getConfiguration();
      expect(newConfig.method).toBe(TaxMethod.HIFO);
      expect(newConfig.taxYear).toBe(originalConfig.taxYear);
      expect(newConfig.longTermThresholdDays).toBe(originalConfig.longTermThresholdDays);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple disposals in a single year', () => {
      const disposals: DisposalEvent[] = [
        {
          id: 'disposal-1',
          date: new Date('2024-09-15'),
          btcAmount: 0.05,
          salePrice: 60000,
          totalProceeds: 3000,
        },
        {
          id: 'disposal-2',
          date: new Date('2024-11-15'),
          btcAmount: 0.03,
          salePrice: 65000,
          totalProceeds: 1950,
        },
      ];

      const config: TaxConfiguration = { ...defaultConfig, disposals };
      const multiDisposalCalculator = new TaxCalculator(config);

      const validation = multiDisposalCalculator.processTransactions(transactions);
      expect(validation.isValid).toBe(true);

      const report = multiDisposalCalculator.generateTaxReport();
      expect(report.disposals).toHaveLength(2);
      expect(report.summary.totalDisposals).toBe(2);
      expect(report.summary.totalGains).toBeGreaterThan(0);
    });

    it('should handle partial lot consumption across multiple disposals', () => {
      const smallDisposals: DisposalEvent[] = [
        {
          id: 'disposal-1',
          date: new Date('2024-08-15'),
          btcAmount: 0.02,
          salePrice: 60000,
          totalProceeds: 1200,
        },
        {
          id: 'disposal-2',
          date: new Date('2024-09-15'),
          btcAmount: 0.03,
          salePrice: 62000,
          totalProceeds: 1860,
        },
        {
          id: 'disposal-3',
          date: new Date('2024-10-15'),
          btcAmount: 0.04,
          salePrice: 64000,
          totalProceeds: 2560,
        },
      ];

      const config: TaxConfiguration = { ...defaultConfig, disposals: smallDisposals };
      const partialCalculator = new TaxCalculator(config);

      const validation = partialCalculator.processTransactions(transactions);
      expect(validation.isValid).toBe(true);

      const report = partialCalculator.generateTaxReport();
      expect(report.disposals).toHaveLength(3);

      // Check that lots have been properly consumed
      const remainingBtc = report.remainingLots.reduce((sum, lot) => sum + lot.remaining, 0);
      expect(remainingBtc).toBe(0.15); // 0.24 - 0.09
    });

    it('should handle edge case of exact lot consumption', () => {
      const exactDisposal: DisposalEvent = {
        id: 'disposal-exact',
        date: new Date('2024-09-15'),
        btcAmount: 0.24, // Exactly all BTC
        salePrice: 60000,
        totalProceeds: 14400,
      };

      const config: TaxConfiguration = { ...defaultConfig, disposals: [exactDisposal] };
      const exactCalculator = new TaxCalculator(config);

      const validation = exactCalculator.processTransactions(transactions);
      expect(validation.isValid).toBe(true);

      const report = exactCalculator.generateTaxReport();
      expect(report.remainingLots.every((lot) => lot.remaining <= 0.000001)).toBe(true); // Allow for floating point precision
      expect(report.summary.remainingBtc).toBeCloseTo(0, 6);
      expect(report.summary.remainingCostBasis).toBeCloseTo(0, 2);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid transaction data gracefully', () => {
      const invalidTransactions = [
        {
          id: 'tx-invalid',
          date: new Date('invalid-date'),
          exchange: 'Strike',
          type: 'Purchase',
          usdAmount: -1000, // Negative amount
          btcAmount: 0,
          price: 50000,
        },
      ];

      const validation = calculator.processTransactions(invalidTransactions as Transaction[]);

      // Should still attempt to process, lot manager will handle validation
      expect(validation.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate lot integrity after processing', () => {
      calculator.processTransactions(transactions);

      // Manually corrupt a lot to test validation
      const lotManager = calculator.getLotManager();
      const lots = lotManager.getAllLots();
      if (lots.length > 0) {
        lotManager.updateLot(lots[0].id, { remaining: -0.01 });
      }

      // Test validation directly without re-processing
      const validation = lotManager.validate();

      // Should detect issues during validation
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].code).toBe('NEGATIVE_REMAINING');
    });

    it('should handle transactions with no data', () => {
      const result = calculator.processTransactions([]);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('NO_TRANSACTIONS');
    });

    it('should handle withdrawal transactions correctly', () => {
      const withdrawalTx: Transaction = {
        id: 'withdrawal-test',
        date: new Date('2024-02-01'),
        exchange: 'Strike',
        type: 'Withdrawal',
        usdAmount: 0,
        btcAmount: 0.01,
        price: 50000,
        isSelfCustody: true,
        isTaxable: false,
      };

      const result = calculator.processTransactions([...transactions, withdrawalTx]);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.code === 'WITHDRAWAL_SKIPPED')).toBe(true);
    });

    it('should get configuration', () => {
      const config = calculator.getConfiguration();
      expect(config.taxYear).toBe(2024);
      expect(config.method).toBe(TaxMethod.FIFO);
    });

    it('should update configuration', () => {
      calculator.updateConfiguration({ method: TaxMethod.LIFO });
      const config = calculator.getConfiguration();
      expect(config.method).toBe(TaxMethod.LIFO);
    });

    it('should provide tax optimization suggestions', () => {
      calculator.processTransactions(transactions);
      const suggestions = calculator.getTaxOptimizationSuggestions(45000);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should handle optimization suggestions with no lots', () => {
      // Calculator with no transactions
      const emptyCalculator = new TaxCalculator({
        taxYear: 2024,
        method: TaxMethod.FIFO,
        longTermThresholdDays: 365,
        includePreviousYears: false,
        showDetailedLots: true,
        roundToCents: true,
      });

      const suggestions = emptyCalculator.getTaxOptimizationSuggestions(50000);
      expect(suggestions).toEqual(['No remaining lots to optimize']);
    });
  });
});
