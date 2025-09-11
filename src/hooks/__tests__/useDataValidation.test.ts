import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDataValidation } from '../useDataValidation';

describe('useDataValidation', () => {
  it('should initialize with validating state', () => {
    const { result } = renderHook(() => useDataValidation());

    expect(result.current.isValidating).toBe(true);
    expect(result.current.validationResult).toBe(null);
    expect(result.current.needsUserAction).toBe(false);
    expect(result.current.showValidationModal).toBe(false);
  });

  it('should have correct return object structure', () => {
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
