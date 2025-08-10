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
    expect(screen.getByText(/Import Completed/i)).toBeInTheDocument();

    // Check for imported count
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Imported')).toBeInTheDocument();

    // Check for skipped count
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();

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
    expect(screen.queryByText(/Import Completed/i)).not.toBeInTheDocument();
  });
});
