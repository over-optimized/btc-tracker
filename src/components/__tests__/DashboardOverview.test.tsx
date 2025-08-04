import { render, screen } from '@testing-library/react';
import DashboardOverview from '../DashboardOverview';

const stats = {
  totalInvested: 1000,
  totalBitcoin: 0.05,
  avgCostBasis: 20000,
  currentValue: 1500,
  unrealizedPnL: 500,
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const formatBTC = (n: number) => `₿${n.toFixed(8)}`;

describe('DashboardOverview', () => {
  it('renders stats correctly', () => {
    render(
      <DashboardOverview stats={stats} formatCurrency={formatCurrency} formatBTC={formatBTC} />,
    );
    expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/₿0\.05000000/)).toBeInTheDocument();
    expect(screen.getByText(/\$20,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$500\.00/)).toBeInTheDocument();
  });
});
