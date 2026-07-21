import { render, screen } from '@testing-library/react';
import RegisterSuccessPage from '@/app/(auth)/register/success/page';

describe('Register Success Page', () => {
  it('renders the success heading', () => {
    render(<RegisterSuccessPage />);
    const heading = screen.getByRole('heading', {
      level: 1,
      name: /Account created/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('states that verification is required', () => {
    render(<RegisterSuccessPage />);
    expect(
      screen.getByText(/Email verification is required before you can sign in/i),
    ).toBeInTheDocument();
  });

  it('does not claim email was sent', () => {
    render(<RegisterSuccessPage />);
    expect(screen.queryByText(/verification email sent/i)).not.toBeInTheDocument();
  });

  it('provides a link to return home', () => {
    render(<RegisterSuccessPage />);
    const link = screen.getByRole('link', { name: /Return to home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
