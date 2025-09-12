/**
 * AutoStorageProvider Basic Tests
 * Simple tests to verify the AutoStorageProvider can be instantiated and basic functionality works
 */

import { describe, it, expect } from 'vitest';
import { AutoStorageProvider } from '../AutoStorageProvider';

describe('AutoStorageProvider', () => {
  it('should create an instance', () => {
    const provider = new AutoStorageProvider();
    expect(provider).toBeInstanceOf(AutoStorageProvider);
  });

  it('should have required methods', () => {
    const provider = new AutoStorageProvider();
    expect(typeof provider.initialize).toBe('function');
    expect(typeof provider.getTransactions).toBe('function');
    expect(typeof provider.saveTransaction).toBe('function');
    expect(typeof provider.saveTransactions).toBe('function');
    expect(typeof provider.clearTransactions).toBe('function');
    expect(typeof provider.getStatus).toBe('function');
    expect(typeof provider.migrateToAuthenticated).toBe('function');
  });

  it('should handle missing configuration', async () => {
    const provider = new AutoStorageProvider();
    const result = await provider.getTransactions();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
