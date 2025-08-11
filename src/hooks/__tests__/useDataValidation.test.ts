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
});
