import { render } from '@testing-library/react';
import InvestedVsPnLChart from '../InvestedVsPnLChart';

describe('InvestedVsPnLChart', () => {
  it('renders chart with data', () => {
    const transactions = [
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
    ];
    const { container } = render(
      <InvestedVsPnLChart transactions={transactions} currentPrice={50000} />,
    );
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
