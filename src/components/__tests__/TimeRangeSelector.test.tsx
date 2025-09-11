import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeRangeSelector from '../TimeRangeSelector';
import { TimeRangeOption } from '../../utils/dateFilters';

describe('TimeRangeSelector', () => {
  const mockOnRangeChange = vi.fn();

  const defaultProps = {
    selectedRange: 'last12months' as TimeRangeOption,
    onRangeChange: mockOnRangeChange,
    transactions: [],
  };

  beforeEach(() => {
    mockOnRangeChange.mockClear();
  });

  it('should render basic time range options when no transactions', () => {
    render(<TimeRangeSelector {...defaultProps} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'Last 6 Months' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Last 12 Months' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Year to Date' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All Time' })).toBeInTheDocument();
  });

  it('should include year options when transactions have data for those years', () => {
    const transactions = [{ date: new Date('2024-03-15') }, { date: new Date('2025-01-10') }];

    render(<TimeRangeSelector {...defaultProps} transactions={transactions} />);

    expect(screen.getByRole('option', { name: '2025' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2024' })).toBeInTheDocument();
  });

  it('should show the selected range as the current value', () => {
    render(<TimeRangeSelector {...defaultProps} selectedRange="last6months" />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('last6months');
  });

  it('should call onRangeChange when dropdown value changes', () => {
    render(<TimeRangeSelector {...defaultProps} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'last6months' } });

    expect(mockOnRangeChange).toHaveBeenCalledTimes(1);
    expect(mockOnRangeChange).toHaveBeenCalledWith('last6months');
  });

  it('should apply custom className', () => {
    const { container } = render(<TimeRangeSelector {...defaultProps} className="custom-class" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes for dropdown', () => {
    render(<TimeRangeSelector {...defaultProps} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveAttribute('class');

    // Check that options are accessible
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
  });
});
