import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1, name: /NextHire/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the product positioning text', () => {
    render(<Home />);
    expect(
      screen.getByText(/Learn, practise, prove your skills, and get hired/i),
    ).toBeInTheDocument();
  });

  it('has a link to the status page', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: /View full status/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/status');
  });

  it('has no duplicate main heading', () => {
    render(<Home />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
  });
});
