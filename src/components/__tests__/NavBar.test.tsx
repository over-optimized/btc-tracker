import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from '../NavBar';

describe('NavBar', () => {
  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Charts/i)).toBeInTheDocument();
  });
});
