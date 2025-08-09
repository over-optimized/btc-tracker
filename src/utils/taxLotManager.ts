/**
 * Tax lot management system for tracking individual Bitcoin purchases
 * and their cost basis for tax calculations
 */

import {
  DisposalEvent,
  HoldingPeriod,
  TaxEvent,
  TaxEventType,
  TaxLot,
  TaxValidationError,
  TaxValidationResult,
} from '../types/TaxTypes';
import { Transaction } from '../types/Transaction';

export class TaxLotManager {
  private lots: Map<string, TaxLot> = new Map();
  private nextLotId = 1;

  constructor(lots: TaxLot[] = []) {
    // Initialize with existing lots
    lots.forEach((lot) => {
      this.lots.set(lot.id, { ...lot });
    });

    // Set next ID based on existing lots
    if (lots.length > 0) {
      const maxId = Math.max(...lots.map((lot) => parseInt(lot.id.replace('lot-', '')) || 0));
      this.nextLotId = maxId + 1;
    }
  }

  /**
   * Create a tax lot from a transaction (purchase)
   */
  addAcquisition(transaction: Transaction): TaxLot {
    const lotId = `lot-${this.nextLotId++}`;

    const lot: TaxLot = {
      id: lotId,
      transactionId: transaction.id,
      purchaseDate: transaction.date,
      btcAmount: transaction.btcAmount,
      remaining: transaction.btcAmount, // Initially, all BTC remains
      costBasis: transaction.usdAmount,
      pricePerBtc: transaction.price,
      exchange: transaction.exchange,
    };

    this.lots.set(lotId, lot);
    return { ...lot };
  }

  /**
   * Process a disposal event and update lots
   * Returns the tax events generated
   */
  processDisposal(disposal: DisposalEvent, method: 'FIFO' | 'LIFO' | 'HIFO' = 'FIFO'): TaxEvent {
    const availableLots = Array.from(this.lots.values())
      .filter((lot) => lot.remaining > 0)
      .sort(this.getSortFunction(method));

    if (availableLots.length === 0) {
      throw new Error('No lots available for disposal');
    }

    const totalAvailable = availableLots.reduce((sum, lot) => sum + lot.remaining, 0);
    if (disposal.btcAmount > totalAvailable) {
      throw new Error(
        `Insufficient BTC: trying to dispose ${disposal.btcAmount}, only ${totalAvailable} available`,
      );
    }

    // Create the disposal event
    const disposalEvent: TaxEvent = {
      id: `disposal-${Date.now()}`,
      type: TaxEventType.DISPOSAL,
      date: disposal.date,
      btcAmount: disposal.btcAmount,
      usdValue: disposal.totalProceeds,
      costBasis: 0,
      capitalGain: 0,
      disposedLots: [],
      exchange: disposal.exchange,
      notes: disposal.notes,
    };

    let remainingToDispose = disposal.btcAmount;
    let totalCostBasis = 0;

    // Process lots according to the specified method
    for (const lot of availableLots) {
      if (remainingToDispose <= 0) break;

      const amountFromThisLot = Math.min(remainingToDispose, lot.remaining);
      const proportionalCostBasis = (amountFromThisLot / lot.btcAmount) * lot.costBasis;

      // Create disposed lot record
      disposalEvent.disposedLots!.push({
        lotId: lot.id,
        btcAmount: amountFromThisLot,
        costBasis: proportionalCostBasis,
        purchaseDate: lot.purchaseDate,
        holdingPeriod: this.calculateHoldingPeriod(lot.purchaseDate, disposal.date),
      });

      // Update the lot
      lot.remaining -= amountFromThisLot;
      totalCostBasis += proportionalCostBasis;
      remainingToDispose -= amountFromThisLot;
    }

    // Calculate gains and holding period for the overall disposal
    disposalEvent.costBasis = totalCostBasis;
    disposalEvent.capitalGain = disposal.totalProceeds - totalCostBasis - (disposal.fees || 0);
    disposalEvent.holdingPeriod = this.determineOverallHoldingPeriod(disposalEvent.disposedLots!);

    return disposalEvent;
  }

  /**
   * Get all lots (copy to prevent modification)
   */
  getAllLots(): TaxLot[] {
    return Array.from(this.lots.values()).map((lot) => ({ ...lot }));
  }

  /**
   * Get lots with remaining balance
   */
  getRemainingLots(): TaxLot[] {
    return this.getAllLots().filter((lot) => lot.remaining > 0);
  }

  /**
   * Get total remaining BTC across all lots
   */
  getTotalRemainingBtc(): number {
    return Array.from(this.lots.values()).reduce((sum, lot) => sum + lot.remaining, 0);
  }

  /**
   * Get total cost basis of remaining BTC
   */
  getRemainingCostBasis(): number {
    return Array.from(this.lots.values())
      .filter((lot) => lot.remaining > 0)
      .reduce((sum, lot) => {
        const proportion = lot.remaining / lot.btcAmount;
        return sum + lot.costBasis * proportion;
      }, 0);
  }

  /**
   * Get total original cost basis (for reporting)
   */
  getTotalCostBasis(): number {
    return Array.from(this.lots.values()).reduce((sum, lot) => sum + lot.costBasis, 0);
  }

  /**
   * Calculate unrealized gains at current price
   */
  getUnrealizedGains(currentPrice: number): number {
    const remainingBtc = this.getTotalRemainingBtc();
    const remainingCostBasis = this.getRemainingCostBasis();
    const currentValue = remainingBtc * currentPrice;

    return currentValue - remainingCostBasis;
  }

  /**
   * Validate lot integrity
   */
  validate(): TaxValidationResult {
    const errors: TaxValidationError[] = [];

    for (const lot of this.lots.values()) {
      // Check for negative remaining amounts
      if (lot.remaining < 0) {
        errors.push({
          code: 'NEGATIVE_REMAINING',
          message: `Lot ${lot.id} has negative remaining amount: ${lot.remaining}`,
          lotId: lot.id,
        });
      }

      // Check that remaining doesn't exceed original
      if (lot.remaining > lot.btcAmount) {
        errors.push({
          code: 'REMAINING_EXCEEDS_ORIGINAL',
          message: `Lot ${lot.id} remaining (${lot.remaining}) exceeds original amount (${lot.btcAmount})`,
          lotId: lot.id,
        });
      }

      // Check for zero cost basis
      if (lot.costBasis <= 0) {
        errors.push({
          code: 'ZERO_COST_BASIS',
          message: `Lot ${lot.id} has zero or negative cost basis: ${lot.costBasis}`,
          lotId: lot.id,
        });
      }

      // Check for invalid dates
      if (isNaN(lot.purchaseDate.getTime())) {
        errors.push({
          code: 'INVALID_DATE',
          message: `Lot ${lot.id} has invalid purchase date`,
          lotId: lot.id,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Reset all lots (for testing or clearing data)
   */
  clear(): void {
    this.lots.clear();
    this.nextLotId = 1;
  }

  /**
   * Get lot by ID
   */
  getLot(lotId: string): TaxLot | undefined {
    const lot = this.lots.get(lotId);
    return lot ? { ...lot } : undefined;
  }

  /**
   * Manually update a lot (for corrections)
   */
  updateLot(lotId: string, updates: Partial<TaxLot>): boolean {
    const lot = this.lots.get(lotId);
    if (!lot) return false;

    Object.assign(lot, updates);
    return true;
  }

  /**
   * Remove a lot (for corrections)
   */
  removeLot(lotId: string): boolean {
    return this.lots.delete(lotId);
  }

  /**
   * Get sort function for lot ordering based on method
   */
  private getSortFunction(method: 'FIFO' | 'LIFO' | 'HIFO'): (a: TaxLot, b: TaxLot) => number {
    switch (method) {
      case 'FIFO':
        // First In, First Out - oldest lots first
        return (a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime();

      case 'LIFO':
        // Last In, First Out - newest lots first
        return (a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime();

      case 'HIFO':
        // Highest In, First Out - highest cost basis per BTC first
        return (a, b) => b.pricePerBtc - a.pricePerBtc;

      default:
        return (a, b) => 0;
    }
  }

  /**
   * Calculate holding period for a specific purchase date
   */
  private calculateHoldingPeriod(purchaseDate: Date, saleDate: Date): HoldingPeriod {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const daysBetween = (saleDate.getTime() - purchaseDate.getTime()) / millisecondsPerDay;

    return daysBetween > 365 ? HoldingPeriod.LONG_TERM : HoldingPeriod.SHORT_TERM;
  }

  /**
   * Determine overall holding period for a disposal (most restrictive)
   */
  private determineOverallHoldingPeriod(disposedLots: any[]): HoldingPeriod {
    // If any lot is short-term, the entire disposal is short-term
    const hasShortTerm = disposedLots.some((lot) => lot.holdingPeriod === 'SHORT_TERM');
    return hasShortTerm ? HoldingPeriod.SHORT_TERM : HoldingPeriod.LONG_TERM;
  }

  /**
   * Export lots to JSON for persistence
   */
  toJSON(): TaxLot[] {
    return this.getAllLots();
  }

  /**
   * Create manager from JSON data
   */
  static fromJSON(data: TaxLot[]): TaxLotManager {
    // Ensure dates are properly parsed
    const lots = data.map((lot) => ({
      ...lot,
      purchaseDate: new Date(lot.purchaseDate),
    }));

    return new TaxLotManager(lots);
  }
}
