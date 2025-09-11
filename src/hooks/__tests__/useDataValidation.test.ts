import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDataValidation } from '../useDataValidation';
import * as dataValidation from '../../utils/dataValidation';

// Mock the data validation utility
vi.mock('../../utils/dataValidation');

describe('useDataValidation', () => {
  const mockValidateStoredData = vi.mocked(dataValidation.validateStoredData);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with validating state', () => {
    mockValidateStoredData.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      canMigrate: false,
      requiresReset: false,
      migratableTransactions: 0,
      invalidTransactions: 0,
    });

    const { result } = renderHook(() => useDataValidation());

    expect(result.current.isValidating).toBe(true);
    expect(result.current.validationResult).toBe(null);
    expect(result.current.needsUserAction).toBe(false);
    expect(result.current.showValidationModal).toBe(false);
  });

  it('should complete validation successfully with valid data', async () => {
    const validResult = {
      isValid: true,
      errors: [],
      warnings: [],
      canMigrate: false,
      requiresReset: false,
      migratableTransactions: 0,
      invalidTransactions: 0,
    };
    mockValidateStoredData.mockReturnValue(validResult);

    const { result } = renderHook(() => useDataValidation());

    // Fast-forward past the 500ms delay and wait for state update
    await act(async () => {
      vi.advanceTimersByTime(500);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationResult).toEqual(validResult);
    expect(result.current.needsUserAction).toBe(false);
    expect(result.current.showValidationModal).toBe(false);
  });

  it('should handle invalid data requiring user action', async () => {
    const invalidResult = {
      isValid: false,
      errors: [{ type: 'CORRUPT_DATA' as const, message: 'Data corrupted', details: 'Test error' }],
      warnings: [],
      canMigrate: true,
      requiresReset: false,
      migratableTransactions: 5,
      invalidTransactions: 2,
    };
    mockValidateStoredData.mockReturnValue(invalidResult);

    const { result } = renderHook(() => useDataValidation());

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.validationResult).toEqual(invalidResult);
    expect(result.current.needsUserAction).toBe(true);
    expect(result.current.showValidationModal).toBe(true);
  });

  it('should handle validation errors gracefully', async () => {
    mockValidateStoredData.mockImplementation(() => {
      throw new Error('Validation failed');
    });

    const { result } = renderHook(() => useDataValidation());

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.validationResult?.isValid).toBe(false);
    expect(result.current.validationResult?.errors).toHaveLength(1);
    expect(result.current.validationResult?.errors[0].type).toBe('CORRUPT_DATA');
    expect(result.current.needsUserAction).toBe(true);
    expect(result.current.showValidationModal).toBe(true);
  });

  it('should handle validation completion', async () => {
    const invalidResult = {
      isValid: false,
      errors: [{ type: 'CORRUPT_DATA' as const, message: 'Error', details: 'Test' }],
      warnings: [],
      canMigrate: false,
      requiresReset: true,
      migratableTransactions: 0,
      invalidTransactions: 1,
    };
    mockValidateStoredData.mockReturnValue(invalidResult);

    const { result } = renderHook(() => useDataValidation());

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.showValidationModal).toBe(true);
    });

    act(() => {
      result.current.handleValidationComplete();
    });

    expect(result.current.showValidationModal).toBe(false);
    expect(result.current.needsUserAction).toBe(false);
  });

  it('should handle data reset', async () => {
    const invalidResult = {
      isValid: false,
      errors: [{ type: 'CORRUPT_DATA' as const, message: 'Error', details: 'Test' }],
      warnings: [],
      canMigrate: false,
      requiresReset: true,
      migratableTransactions: 0,
      invalidTransactions: 1,
    };
    mockValidateStoredData.mockReturnValue(invalidResult);

    const { result } = renderHook(() => useDataValidation());

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.showValidationModal).toBe(true);
    });

    act(() => {
      result.current.handleDataReset();
    });

    expect(result.current.showValidationModal).toBe(false);
    expect(result.current.needsUserAction).toBe(false);
    expect(result.current.validationResult?.isValid).toBe(true);
    expect(result.current.validationResult?.errors).toHaveLength(0);
  });

  it('should allow retry validation', async () => {
    // First call fails
    mockValidateStoredData.mockImplementationOnce(() => {
      throw new Error('First validation failed');
    });

    const { result } = renderHook(() => useDataValidation());

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.validationResult?.isValid).toBe(false);

    // Second call succeeds
    const validResult = {
      isValid: true,
      errors: [],
      warnings: [],
      canMigrate: false,
      requiresReset: false,
      migratableTransactions: 0,
      invalidTransactions: 0,
    };
    mockValidateStoredData.mockReturnValue(validResult);

    act(() => {
      result.current.retryValidation();
    });

    expect(result.current.isValidating).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.validationResult).toEqual(validResult);
    expect(result.current.needsUserAction).toBe(false);
  });

  it('should have correct return object structure', () => {
    mockValidateStoredData.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      canMigrate: false,
      requiresReset: false,
      migratableTransactions: 0,
      invalidTransactions: 0,
    });

    const { result } = renderHook(() => useDataValidation());

    expect(result.current).toHaveProperty('isValidating');
    expect(result.current).toHaveProperty('validationResult');
    expect(result.current).toHaveProperty('needsUserAction');
    expect(result.current).toHaveProperty('showValidationModal');
    expect(result.current).toHaveProperty('handleValidationComplete');
    expect(result.current).toHaveProperty('handleDataReset');
    expect(result.current).toHaveProperty('retryValidation');

    expect(typeof result.current.handleValidationComplete).toBe('function');
    expect(typeof result.current.handleDataReset).toBe('function');
    expect(typeof result.current.retryValidation).toBe('function');
  });
});
