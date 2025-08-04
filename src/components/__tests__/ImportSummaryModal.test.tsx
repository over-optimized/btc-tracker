import { render, screen } from '@testing-library/react';
import ImportSummaryModal from '../ImportSummaryModal';

describe('ImportSummaryModal', () => {
  it('renders summary and counts when open', () => {
    render(
      <ImportSummaryModal
        open={true}
        onClose={() => {}}
        importedCount={3}
        ignoredCount={1}
        summary="3 Strike, 1 Coinbase"
      />,
    );
    expect(screen.getByText(/Import Summary/i)).toBeInTheDocument();

    // Find the <p> containing "Imported:" and check it contains "3"
    const importedP = screen.getByText(/Imported:/i).closest('p');
    expect(importedP).toHaveTextContent('Imported: 3');

    // Find the <p> containing "Ignored (duplicates):" and check it contains "1"
    const ignoredP = screen.getByText(/Ignored \(duplicates\):/i).closest('p');
    expect(ignoredP).toHaveTextContent('Ignored (duplicates): 1');

    expect(screen.getByText(/3 Strike, 1 Coinbase/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ImportSummaryModal
        open={false}
        onClose={() => {}}
        importedCount={0}
        ignoredCount={0}
        summary=""
      />,
    );
    expect(screen.queryByText(/Import Summary/i)).not.toBeInTheDocument();
  });
});
