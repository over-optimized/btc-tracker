/**
 * Comprehensive tax calculation engine for Bitcoin DCA tracking
 * Supports FIFO, LIFO, HIFO, and Specific Identification methods
 */

import { Transaction } from '../types/Transaction';
import {
  TaxMethod,
  TaxReport,
  TaxEvent,
  TaxEventType,
  TaxConfiguration,
  TaxSummary,
  DisposalEvent,
  HoldingPeriod,
  TaxValidationResult,
  TaxValidationError,
  TaxValidationWarning,
  PriceInfo,
} from '../types/TaxTypes';
import { TaxLotManager } from './taxLotManager';

export class TaxCalculator {
  private lotManager: TaxLotManager;
  private configuration: TaxConfiguration;
  private acquisitionEvents: TaxEvent[] = [];
  private disposalEvents: TaxEvent[] = [];

  constructor(
    config: TaxConfiguration,
    existingLots?: import('../types/TaxTypes').TaxLot[]
  ) {
    this.configuration = { ...config };
    this.lotManager = new TaxLotManager(existingLots);
  }

  /**
   * Process all transactions to build tax lots and events
   */
  processTransactions(transactions: Transaction[]): TaxValidationResult {
    // Clear existing events
    this.acquisitionEvents = [];
    this.disposalEvents = [];
    this.lotManager.clear();

    const errors: TaxValidationError[] = [];
    const warnings: TaxValidationWarning[] = [];

    // Filter transactions for the tax year
    const yearTransactions = this.filterTransactionsByYear(transactions);

    if (yearTransactions.length === 0) {
      warnings.push({
        code: 'NO_TRANSACTIONS',
        message: `No transactions found for tax year ${this.configuration.taxYear}`,
        suggestion: 'Check if the tax year is correct or if transactions exist for this period',
      });
    }

    // Process each transaction (skip withdrawals as they're non-taxable movements)
    for (const transaction of yearTransactions) {
      try {
        // Skip withdrawal/transfer transactions as they're non-taxable self-custody movements
        if (this.isWithdrawalTransaction(transaction)) {
          // Add to warnings for visibility but don't process as acquisition
          warnings.push({
            code: 'WITHDRAWAL_SKIPPED',
            message: `Withdrawal transaction skipped (non-taxable): ${transaction.btcAmount} BTC to ${transaction.destinationWallet || 'self-custody'}`,
            suggestion: 'This withdrawal does not create a taxable event',
          });
          continue;
        }

        // Process as acquisition for purchases/buys
        this.processAcquisition(transaction);
      } catch (error) {
        errors.push({
          code: 'ACQUISITION_ERROR',
          message: `Failed to process acquisition: ${error}`,
          details: `Transaction ID: ${transaction.id}`,
        });
      }
    }

    // Process any disposal events if provided
    if (this.configuration.disposals) {
      for (const disposal of this.configuration.disposals) {
        try {
          this.processDisposal(disposal);
        } catch (error) {
          errors.push({
            code: 'DISPOSAL_ERROR',
            message: `Failed to process disposal: ${error}`,
            details: `Disposal ID: ${disposal.id}`,
          });
        }
      }
    }

    // Validate lot integrity
    const lotValidation = this.lotManager.validate();
    errors.push(...lotValidation.errors);
    warnings.push(...lotValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate comprehensive tax report
   */
  generateTaxReport(currentPrice?: PriceInfo): TaxReport {
    const startDate = new Date(this.configuration.taxYear, 0, 1);
    const endDate = new Date(this.configuration.taxYear, 11, 31);

    // Calculate summary statistics
    const summary = this.calculateTaxSummary(currentPrice);

    // Get remaining lots
    const remainingLots = this.lotManager.getRemainingLots();

    const report: TaxReport = {
      taxYear: this.configuration.taxYear,
      method: this.configuration.method,
      generatedAt: new Date(),
      summary,
      acquisitions: [...this.acquisitionEvents],
      disposals: [...this.disposalEvents],
      remainingLots,
      startDate,
      endDate,
      totalTransactions: this.acquisitionEvents.length + this.disposalEvents.length,
      isComplete: true,
      warnings: [],
      errors: [],
    };

    // Add warnings for common issues
    if (this.disposalEvents.length === 0) {
      report.warnings.push('No disposal events found - this report shows acquisitions only');
    }

    if (remainingLots.length === 0) {
      report.warnings.push('No remaining Bitcoin lots - all holdings appear to have been disposed');
    }

    return report;
  }

  /**
   * Process a Bitcoin purchase as an acquisition
   */
  private processAcquisition(transaction: Transaction): TaxEvent {
    // Create the lot
    const lot = this.lotManager.addAcquisition(transaction);

    // Create acquisition event
    const event: TaxEvent = {
      id: `acq-${transaction.id}`,
      type: TaxEventType.ACQUISITION,
      date: transaction.date,
      btcAmount: transaction.btcAmount,
      usdValue: transaction.usdAmount,
      costBasis: transaction.usdAmount,
      transactionId: transaction.id,
      exchange: transaction.exchange,
    };

    this.acquisitionEvents.push(event);
    return event;
  }

  /**
   * Process a Bitcoin sale/disposal
   */
  private processDisposal(disposal: DisposalEvent): TaxEvent {
    // Use the configured method for lot selection
    const method = this.configuration.method === TaxMethod.SPECIFIC_ID 
      ? 'FIFO' // Default to FIFO for specific ID (would need UI selection)
      : this.configuration.method;

    const disposalEvent = this.lotManager.processDisposal(disposal, method);
    this.disposalEvents.push(disposalEvent);
    return disposalEvent;
  }

  /**
   * Calculate comprehensive tax summary
   */
  private calculateTaxSummary(currentPrice?: PriceInfo): TaxSummary {
    let totalGains = 0;
    let totalLosses = 0;
    let shortTermGains = 0;
    let longTermGains = 0;
    let shortTermLosses = 0;
    let longTermLosses = 0;
    let shortTermDisposals = 0;
    let longTermDisposals = 0;

    // Process all disposal events
    for (const disposal of this.disposalEvents) {
      const gain = disposal.capitalGain || 0;

      if (gain >= 0) {
        totalGains += gain;
        if (disposal.holdingPeriod === HoldingPeriod.SHORT_TERM) {
          shortTermGains += gain;
          shortTermDisposals++;
        } else {
          longTermGains += gain;
          longTermDisposals++;
        }
      } else {
        const loss = Math.abs(gain);
        totalLosses += loss;
        if (disposal.holdingPeriod === HoldingPeriod.SHORT_TERM) {
          shortTermLosses += loss;
        } else {
          longTermLosses += loss;
        }
      }
    }

    // Get portfolio information
    const totalCostBasis = this.lotManager.getTotalCostBasis();
    const remainingBtc = this.lotManager.getTotalRemainingBtc();
    const remainingCostBasis = this.lotManager.getRemainingCostBasis();
    
    // Calculate unrealized gains if current price is provided
    let unrealizedGains = 0;
    if (currentPrice && remainingBtc > 0) {
      unrealizedGains = this.lotManager.getUnrealizedGains(currentPrice.price);
    }

    return {
      totalGains,
      totalLosses,
      netGains: totalGains - totalLosses,
      shortTermGains,
      longTermGains,
      shortTermLosses,
      longTermLosses,
      totalDisposals: this.disposalEvents.length,
      shortTermDisposals,
      longTermDisposals,
      totalCostBasis,
      remainingBtc,
      remainingCostBasis,
      unrealizedGains,
    };
  }

  /**
   * Filter transactions by tax year
   */
  private filterTransactionsByYear(transactions: Transaction[]): Transaction[] {
    const startDate = new Date(this.configuration.taxYear, 0, 1);
    const endDate = new Date(this.configuration.taxYear, 11, 31, 23, 59, 59);

    return transactions.filter(tx => 
      tx.date >= startDate && tx.date <= endDate
    );
  }

  /**
   * Check if a transaction is a withdrawal to self-custody (non-taxable)
   */
  private isWithdrawalTransaction(transaction: Transaction): boolean {
    // Check explicit withdrawal types
    if (transaction.type === 'Withdrawal' || transaction.type === 'Transfer') {
      return true;
    }

    // Check self-custody flag
    if (transaction.isSelfCustody === true) {
      return true;
    }

    // Check taxable flag (explicitly marked as non-taxable)
    if (transaction.isTaxable === false) {
      return true;
    }

    return false;
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<TaxConfiguration>): void {
    Object.assign(this.configuration, config);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): TaxConfiguration {
    return { ...this.configuration };
  }

  /**
   * Get lot manager for advanced operations
   */
  getLotManager(): TaxLotManager {
    return this.lotManager;
  }

  /**
   * Calculate tax impact of hypothetical disposal
   */
  calculateHypotheticalDisposal(
    btcAmount: number,
    salePrice: number,
    saleDate: Date = new Date()
  ): {
    capitalGain: number;
    costBasis: number;
    proceeds: number;
    holdingPeriod: HoldingPeriod;
    effectiveTaxRate?: number;
  } {
    // Create temporary disposal event
    const hypotheticalDisposal: DisposalEvent = {
      id: 'hypothetical',
      date: saleDate,
      btcAmount,
      salePrice,
      totalProceeds: btcAmount * salePrice,
    };

    // Create temporary lot manager to avoid modifying state
    const tempLotManager = new TaxLotManager(this.lotManager.getAllLots());
    
    try {
      const method = this.configuration.method === TaxMethod.SPECIFIC_ID 
        ? 'FIFO' 
        : this.configuration.method;

      const disposalEvent = tempLotManager.processDisposal(hypotheticalDisposal, method);

      return {
        capitalGain: disposalEvent.capitalGain || 0,
        costBasis: disposalEvent.costBasis || 0,
        proceeds: hypotheticalDisposal.totalProceeds,
        holdingPeriod: disposalEvent.holdingPeriod || HoldingPeriod.SHORT_TERM,
        // Note: Tax rate calculation would depend on user's tax bracket
        // This is just for demonstration
        effectiveTaxRate: disposalEvent.holdingPeriod === HoldingPeriod.LONG_TERM ? 0.15 : 0.22,
      };
    } catch (error) {
      throw new Error(`Cannot calculate hypothetical disposal: ${error}`);
    }
  }

  /**
   * Get tax optimization suggestions
   */
  getTaxOptimizationSuggestions(currentPrice: number): string[] {
    const suggestions: string[] = [];
    const remainingLots = this.lotManager.getRemainingLots();

    if (remainingLots.length === 0) {
      return ['No remaining lots to optimize'];
    }

    // Check for tax-loss harvesting opportunities
    const losingLots = remainingLots.filter(lot => {
      const currentValue = lot.remaining * currentPrice;
      const proportionalCostBasis = (lot.remaining / lot.btcAmount) * lot.costBasis;
      return currentValue < proportionalCostBasis;
    });

    if (losingLots.length > 0) {
      const totalLoss = losingLots.reduce((sum, lot) => {
        const currentValue = lot.remaining * currentPrice;
        const proportionalCostBasis = (lot.remaining / lot.btcAmount) * lot.costBasis;
        return sum + (proportionalCostBasis - currentValue);
      }, 0);

      suggestions.push(
        `Tax-loss harvesting opportunity: ${losingLots.length} lots with potential losses totaling $${totalLoss.toFixed(2)}`
      );
    }

    // Check for long-term holding opportunities
    const shortTermLots = remainingLots.filter(lot => {
      const daysSincePurchase = (Date.now() - lot.purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSincePurchase < 365;
    });

    if (shortTermLots.length > 0) {
      suggestions.push(
        `Consider holding ${shortTermLots.length} lots longer for long-term capital gains treatment`
      );
    }

    // Method optimization suggestion
    const fifoCalculator = new TaxCalculator({ ...this.configuration, method: TaxMethod.FIFO });
    const lifoCalculator = new TaxCalculator({ ...this.configuration, method: TaxMethod.LIFO });
    const hifoCalculator = new TaxCalculator({ ...this.configuration, method: TaxMethod.HIFO });

    // This is a simplified suggestion - real implementation would need actual disposal scenarios
    suggestions.push(
      `Current method: ${this.configuration.method}. Consider comparing FIFO, LIFO, and HIFO methods for optimal tax treatment.`
    );

    return suggestions;
  }
}