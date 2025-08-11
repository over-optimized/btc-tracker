import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBitcoinPrice } from '../useBitcoinPrice';

describe('useBitcoinPrice', () => {
  it('should initialize with null price and loading state', () => {
    const { result } = renderHook(() => useBitcoinPrice());

    expect(result.current.currentPrice).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });
});
