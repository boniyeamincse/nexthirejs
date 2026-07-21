import { render, screen } from '@testing-library/react';
import StatusPage from '@/app/status/page';

describe('Status Page', () => {
  it('shows the current phase', () => {
    render(<StatusPage />);
    expect(screen.getByText(/Phase 0 — Foundation/i)).toBeInTheDocument();
  });

  it('marks database as not connected', () => {
    render(<StatusPage />);
    expect(screen.getByText('Database integration')).toBeInTheDocument();
    expect(screen.getByText('Redis integration')).toBeInTheDocument();
    const items = screen.getAllByText(/not connected yet/i);
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  it('marks Redis as not connected', () => {
    render(<StatusPage />);
    const items = screen.getAllByText(/not connected yet/i);
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  it('has one main heading', () => {
    render(<StatusPage />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/Platform Status/i);
  });
});
