/**
 * Comprehensive unit tests for TaxLotManager
 * Tests all tax calculation methods (FIFO, LIFO, HIFO) and lot management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaxLotManager } from '../taxLotManager';
import { Transaction } from '../../types/Transaction';
import { DisposalEvent, HoldingPeriod, TaxEventType } from '../../types/TaxTypes';

describe('TaxLotManager', () => {
  let manager: TaxLotManager;
  
  beforeEach(() => {
    manager = new TaxLotManager();
  });

  describe('Lot Creation', () => {
    it('should create a lot from a transaction', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        date: new Date('2024-01-15'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 5000,
        btcAmount: 0.1,
        price: 50000,
      };

      const lot = manager.addAcquisition(transaction);

      expect(lot.id).toBe('lot-1');
      expect(lot.transactionId).toBe('tx-1');
      expect(lot.btcAmount).toBe(0.1);
      expect(lot.remaining).toBe(0.1);
      expect(lot.costBasis).toBe(5000);
      expect(lot.pricePerBtc).toBe(50000);
      expect(lot.exchange).toBe('Strike');
    });

    it('should generate sequential lot IDs', () => {
      const tx1: Transaction = {
        id: 'tx-1',
        date: new Date('2024-01-15'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 1000,
        btcAmount: 0.02,
        price: 50000,
      };

      const tx2: Transaction = {
        id: 'tx-2',
        date: new Date('2024-01-16'),
        exchange: 'Coinbase',
        type: 'Buy',
        usdAmount: 2000,
        btcAmount: 0.04,
        price: 50000,
      };

      const lot1 = manager.addAcquisition(tx1);
      const lot2 = manager.addAcquisition(tx2);

      expect(lot1.id).toBe('lot-1');
      expect(lot2.id).toBe('lot-2');
    });
  });

  describe('Lot Retrieval', () => {
    beforeEach(() => {
      // Add some test lots
      const transactions = [
        { id: 'tx-1', date: new Date('2024-01-15'), exchange: 'Strike', type: 'Purchase', usdAmount: 1000, btcAmount: 0.02, price: 50000 },
        { id: 'tx-2', date: new Date('2024-01-16'), exchange: 'Coinbase', type: 'Buy', usdAmount: 2000, btcAmount: 0.04, price: 50000 },
        { id: 'tx-3', date: new Date('2024-01-17'), exchange: 'Kraken', type: 'Trade', usdAmount: 3000, btcAmount: 0.06, price: 50000 },
      ];

      transactions.forEach(tx => manager.addAcquisition(tx as Transaction));
    });

    it('should return all lots', () => {
      const allLots = manager.getAllLots();
      expect(allLots).toHaveLength(3);
      expect(allLots[0].id).toBe('lot-1');
      expect(allLots[1].id).toBe('lot-2');
      expect(allLots[2].id).toBe('lot-3');
    });

    it('should return remaining lots only', () => {
      const remainingLots = manager.getRemainingLots();
      expect(remainingLots).toHaveLength(3);
      
      // All lots should have remaining > 0 initially
      remainingLots.forEach(lot => {
        expect(lot.remaining).toBeGreaterThan(0);
      });
    });

    it('should calculate total remaining BTC', () => {
      const totalBtc = manager.getTotalRemainingBtc();
      expect(totalBtc).toBe(0.12); // 0.02 + 0.04 + 0.06
    });

    it('should calculate total cost basis', () => {
      const totalCost = manager.getTotalCostBasis();
      expect(totalCost).toBe(6000); // 1000 + 2000 + 3000
    });

    it('should calculate remaining cost basis', () => {
      const remainingCost = manager.getRemainingCostBasis();
      expect(remainingCost).toBe(6000); // All lots are untouched initially
    });
  });

  describe('FIFO Disposal Processing', () => {
    beforeEach(() => {
      // Add lots with different dates for FIFO testing
      const transactions = [
        { id: 'tx-1', date: new Date('2024-01-15'), exchange: 'Strike', type: 'Purchase', usdAmount: 1000, btcAmount: 0.02, price: 50000 },
        { id: 'tx-2', date: new Date('2024-02-15'), exchange: 'Coinbase', type: 'Buy', usdAmount: 2000, btcAmount: 0.04, price: 50000 },
        { id: 'tx-3', date: new Date('2024-03-15'), exchange: 'Kraken', type: 'Trade', usdAmount: 3000, btcAmount: 0.06, price: 50000 },
      ];

      transactions.forEach(tx => manager.addAcquisition(tx as Transaction));
    });

    it('should process FIFO disposal using oldest lots first', () => {
      const disposal: DisposalEvent = {
        id: 'disposal-1',
        date: new Date('2024-06-15'),
        btcAmount: 0.03,
        salePrice: 60000,
        totalProceeds: 1800, // 0.03 * 60000
      };

      const disposalEvent = manager.processDisposal(disposal, 'FIFO');

      expect(disposalEvent.type).toBe(TaxEventType.DISPOSAL);
      expect(disposalEvent.btcAmount).toBe(0.03);
      expect(disposalEvent.usdValue).toBe(1800);
      expect(disposalEvent.disposedLots).toHaveLength(2);

      // Should use oldest lots first
      const disposedLots = disposalEvent.disposedLots!;
      expect(disposedLots[0].btcAmount).toBe(0.02); // Full first lot
      expect(disposedLots[1].btcAmount).toBeCloseTo(0.01, 6); // Partial second lot

      // Calculate expected cost basis: full lot 1 (1000) + partial lot 2 (500)
      expect(disposalEvent.costBasis).toBe(1500);
      expect(disposalEvent.capitalGain).toBe(300); // 1800 - 1500
    });

    it('should handle partial lot consumption', () => {
      const disposal: DisposalEvent = {
        id: 'disposal-1',
        date: new Date('2024-06-15'),
        btcAmount: 0.01, // Less than first lot
        salePrice: 60000,
        totalProceeds: 600,
      };

      const disposalEvent = manager.processDisposal(disposal, 'FIFO');

      expect(disposalEvent.disposedLots).toHaveLength(1);
      expect(disposalEvent.disposedLots![0].btcAmount).toBe(0.01);
      expect(disposalEvent.costBasis).toBe(500); // Proportional: (0.01/0.02) * 1000
      
      // Check remaining balance in first lot
      const remainingLots = manager.getRemainingLots();
      const firstLot = remainingLots.find(lot => lot.id === 'lot-1');
      expect(firstLot?.remaining).toBe(0.01); // 0.02 - 0.01
    });

    it('should calculate holding periods correctly', () => {
      const disposal: DisposalEvent = {
        id: 'disposal-1',
        date: new Date('2025-02-15'), // More than 1 year from first purchase
        btcAmount: 0.02,
        salePrice: 60000,
        totalProceeds: 1200,
      };

      const disposalEvent = manager.processDisposal(disposal, 'FIFO');

      expect(disposalEvent.holdingPeriod).toBe(HoldingPeriod.LONG_TERM);
      expect(disposalEvent.disposedLots![0].holdingPeriod).toBe(HoldingPeriod.LONG_TERM);
    });
  });

  describe('LIFO Disposal Processing', () => {
    beforeEach(() => {
      const transactions = [
        { id: 'tx-1', date: new Date('2024-01-15'), exchange: 'Strike', type: 'Purchase', usdAmount: 1000, btcAmount: 0.02, price: 50000 },
        { id: 'tx-2', date: new Date('2024-02-15'), exchange: 'Coinbase', type: 'Buy', usdAmount: 2000, btcAmount: 0.04, price: 50000 },
        { id: 'tx-3', date: new Date('2024-03-15'), exchange: 'Kraken', type: 'Trade', usdAmount: 3000, btcAmount: 0.06, price: 50000 },
      ];

      transactions.forEach(tx => manager.addAcquisition(tx as Transaction));
    });

    it('should process LIFO disposal using newest lots first', () => {
      const disposal: DisposalEvent = {
        id: 'disposal-1',
        date: new Date('2024-06-15'),
        btcAmount: 0.08, // Requires newest lot + part of second lot
        salePrice: 60000,
        totalProceeds: 4800,
      };

      const disposalEvent = manager.processDisposal(disposal, 'LIFO');

      expect(disposalEvent.disposedLots).toHaveLength(2);
      
      // Should use newest lots first
      const disposedLots = disposalEvent.disposedLots!;
      expect(disposedLots[0].btcAmount).toBe(0.06); // Full third lot (newest)
      expect(disposedLots[1].btcAmount).toBeCloseTo(0.02, 6); // Partial second lot

      // Cost basis: full lot 3 (3000) + partial lot 2 (1000)
      expect(disposalEvent.costBasis).toBe(4000);
      expect(disposalEvent.capitalGain).toBe(800); // 4800 - 4000
    });
  });

  describe('HIFO Disposal Processing', () => {
    beforeEach(() => {
      // Add lots with different prices for HIFO testing
      const transactions = [
        { id: 'tx-1', date: new Date('2024-01-15'), exchange: 'Strike', type: 'Purchase', usdAmount: 1000, btcAmount: 0.02, price: 50000 },
        { id: 'tx-2', date: new Date('2024-02-15'), exchange: 'Coinbase', type: 'Buy', usdAmount: 2200, btcAmount: 0.04, price: 55000 }, // Higher price
        { id: 'tx-3', date: new Date('2024-03-15'), exchange: 'Kraken', type: 'Trade', usdAmount: 2700, btcAmount: 0.06, price: 45000 }, // Lower price
      ];

      transactions.forEach(tx => manager.addAcquisition(tx as Transaction));
    });

    it('should process HIFO disposal using highest cost lots first', () => {
      const disposal: DisposalEvent = {
        id: 'disposal-1',
        date: new Date('2024-06-15'),
        btcAmount: 0.05, // Requires highest cost lot + part of next highest
        salePrice: 60000,
        totalProceeds: 3000,
      };

      const disposalEvent = manager.processDisposal(disposal, 'HIFO');

      expect(disposalEvent.disposedLots).toHaveLength(2);
      
      // Should use highest cost lots first (lot-2 at 55000, then lot-1 at 50000)
      const disposedLots = disposalEvent.disposedLots!;
      expect(disposedLots[0].btcAmount).toBe(0.04); // Full second lot (highest price)
      expect(disposedLots[1].btcAmount).toBeCloseTo(0.01, 6); // Partial first lot

      // Cost basis: full lot 2 (2200) + partial lot 1 (500)
      expect(disposalEvent.costBasis).toBe(2700);
      expect(disposalEvent.capitalGain).toBe(300); // 3000 - 2700
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no lots available', () => {
      const disposal: DisposalEvent = {
        id: 'disposal-1',
        date: new Date('2024-06-15'),
        btcAmount: 0.01,
        salePrice: 60000,
        totalProceeds: 600,
      };

      expect(() => manager.processDisposal(disposal, 'FIFO')).toThrow('No lots available for disposal');
    });

    it('should throw error when insufficient BTC available', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        date: new Date('2024-01-15'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 1000,
        btcAmount: 0.02,
        price: 50000,
      };
      
      manager.addAcquisition(transaction);

      const disposal: DisposalEvent = {
        id: 'disposal-1',
        date: new Date('2024-06-15'),
        btcAmount: 0.05, // More than available
        salePrice: 60000,
        totalProceeds: 3000,
      };

      expect(() => manager.processDisposal(disposal, 'FIFO')).toThrow('Insufficient BTC');
    });
  });

  describe('Validation', () => {
    it('should validate lot integrity', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        date: new Date('2024-01-15'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 1000,
        btcAmount: 0.02,
        price: 50000,
      };
      
      manager.addAcquisition(transaction);
      
      const validation = manager.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect negative remaining amounts', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        date: new Date('2024-01-15'),
        exchange: 'Strike',
        type: 'Purchase',
        usdAmount: 1000,
        btcAmount: 0.02,
        price: 50000,
      };
      
      const lot = manager.addAcquisition(transaction);
      
      // Manually corrupt the lot for testing
      manager.updateLot(lot.id, { remaining: -0.01 });
      
      const validation = manager.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].code).toBe('NEGATIVE_REMAINING');
    });
  });

  describe('Persistence', () => {
    it('should serialize and deserialize lots correctly', () => {
      const transactions = [
        { id: 'tx-1', date: new Date('2024-01-15'), exchange: 'Strike', type: 'Purchase', usdAmount: 1000, btcAmount: 0.02, price: 50000 },
        { id: 'tx-2', date: new Date('2024-02-15'), exchange: 'Coinbase', type: 'Buy', usdAmount: 2000, btcAmount: 0.04, price: 50000 },
      ];

      transactions.forEach(tx => manager.addAcquisition(tx as Transaction));

      const serialized = manager.toJSON();
      const newManager = TaxLotManager.fromJSON(serialized);

      expect(newManager.getAllLots()).toHaveLength(2);
      expect(newManager.getTotalRemainingBtc()).toBe(0.06);
      expect(newManager.getTotalCostBasis()).toBe(3000);
    });

    it('should handle date deserialization correctly', () => {
      const transactions = [
        { id: 'tx-1', date: new Date('2024-01-15'), exchange: 'Strike', type: 'Purchase', usdAmount: 1000, btcAmount: 0.02, price: 50000 },
      ];

      transactions.forEach(tx => manager.addAcquisition(tx as Transaction));

      const serialized = manager.toJSON();
      const newManager = TaxLotManager.fromJSON(serialized);

      const lots = newManager.getAllLots();
      expect(lots[0].purchaseDate).toBeInstanceOf(Date);
      expect(lots[0].purchaseDate.getTime()).toBe(new Date('2024-01-15').getTime());
    });
  });

  describe('Unrealized Gains', () => {
    beforeEach(() => {
      const transactions = [
        { id: 'tx-1', date: new Date('2024-01-15'), exchange: 'Strike', type: 'Purchase', usdAmount: 1000, btcAmount: 0.02, price: 50000 },
        { id: 'tx-2', date: new Date('2024-02-15'), exchange: 'Coinbase', type: 'Buy', usdAmount: 2000, btcAmount: 0.04, price: 50000 },
      ];

      transactions.forEach(tx => manager.addAcquisition(tx as Transaction));
    });

    it('should calculate unrealized gains correctly', () => {
      const currentPrice = 60000; // 20% increase
      const unrealizedGains = manager.getUnrealizedGains(currentPrice);
      
      // Current value: 0.06 * 60000 = 3600
      // Cost basis: 3000
      // Unrealized gains: 600
      expect(unrealizedGains).toBe(600);
    });

    it('should calculate unrealized losses correctly', () => {
      const currentPrice = 40000; // 20% decrease
      const unrealizedGains = manager.getUnrealizedGains(currentPrice);
      
      // Current value: 0.06 * 40000 = 2400
      // Cost basis: 3000
      // Unrealized gains: -600 (loss)
      expect(unrealizedGains).toBe(-600);
    });
  });
});