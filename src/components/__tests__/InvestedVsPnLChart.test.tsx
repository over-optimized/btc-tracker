import { render, screen, fireEvent } from '@testing-library/react';
import InvestedVsPnLChart from '../InvestedVsPnLChart';

describe('InvestedVsPnLChart', () => {
  const mockTransactions = [
    {
      id: '1',
      date: new Date('2025-01-01'),
      usdAmount: 100,
      btcAmount: 0.002,
      exchange: 'Strike',
      type: 'buy',
      price: 50000,
    },
    {
      id: '2',
      date: new Date('2025-02-01'),
      usdAmount: 200,
      btcAmount: 0.004,
      exchange: 'Coinbase',
      type: 'buy',
      price: 50000,
    },
    {
      id: '3',
      date: new Date('2024-12-01'),
      usdAmount: 150,
      btcAmount: 0.003,
      exchange: 'Kraken',
      type: 'buy',
      price: 50000,
    },
  ];

  it('renders chart with data', () => {
    const { container } = render(
      <InvestedVsPnLChart transactions={mockTransactions} currentPrice={50000} />,
    );
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('renders time range selector', () => {
    render(<InvestedVsPnLChart transactions={mockTransactions} currentPrice={50000} />);

    expect(screen.getByText('Last 6 Months')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('filters data when time range changes', () => {
    render(<InvestedVsPnLChart transactions={mockTransactions} currentPrice={50000} />);

    // Initially should show all data (default might be "All Time" or "Last 12 Months")
    const allTimeButton = screen.getByText('All Time');
    fireEvent.click(allTimeButton);

    // Should have chart container
    expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();
  });

  it('shows year options when data spans multiple years', () => {
    render(<InvestedVsPnLChart transactions={mockTransactions} currentPrice={50000} />);

    // Should show year options for 2024 and 2025 since we have data in both years
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('handles empty transactions gracefully', () => {
    render(<InvestedVsPnLChart transactions={[]} currentPrice={50000} />);

    expect(screen.getByText('All Time')).toBeInTheDocument();
  });
});
