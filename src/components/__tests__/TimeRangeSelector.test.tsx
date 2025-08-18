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

    expect(screen.getByText('Last 6 Months')).toBeInTheDocument();
    expect(screen.getByText('Last 12 Months')).toBeInTheDocument();
    expect(screen.getByText('Year to Date')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('should include year options when transactions have data for those years', () => {
    const transactions = [{ date: new Date('2024-03-15') }, { date: new Date('2025-01-10') }];

    render(<TimeRangeSelector {...defaultProps} transactions={transactions} />);

    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('should highlight the selected range', () => {
    render(<TimeRangeSelector {...defaultProps} selectedRange="last6months" />);

    const selectedButton = screen.getByText('Last 6 Months');
    const unselectedButton = screen.getByText('Last 12 Months');

    expect(selectedButton).toHaveClass('bg-blue-600', 'text-white');
    expect(unselectedButton).toHaveClass('bg-gray-200', 'text-gray-900');
  });

  it('should call onRangeChange when a button is clicked', () => {
    render(<TimeRangeSelector {...defaultProps} />);

    const button = screen.getByText('Last 6 Months');
    fireEvent.click(button);

    expect(mockOnRangeChange).toHaveBeenCalledTimes(1);
    expect(mockOnRangeChange).toHaveBeenCalledWith('last6months');
  });

  it('should apply custom className', () => {
    const { container } = render(<TimeRangeSelector {...defaultProps} className="custom-class" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have proper touch targets for mobile accessibility', () => {
    render(<TimeRangeSelector {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('min-h-[44px]');
    });
  });
});
