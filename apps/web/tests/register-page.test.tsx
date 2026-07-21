import { render, screen } from '@testing-library/react';
import RegisterPage from '@/app/(auth)/register/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Register Page', () => {
  it('renders the registration heading', () => {
    render(<RegisterPage />);
    const heading = screen.getByRole('heading', {
      level: 1,
      name: /Create your candidate account/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the email field', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
  });

  it('renders the password field', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
  });

  it('renders the confirm password field', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument();
  });

  it('renders the terms checkbox', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/accept the/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  it('has show/hide password toggle', () => {
    render(<RegisterPage />);
    const toggle = screen.getByRole('button', { name: /Show password/i });
    expect(toggle).toBeInTheDocument();
  });

  it('has show/hide confirm password toggle', () => {
    render(<RegisterPage />);
    const toggle = screen.getByRole('button', { name: /Show password/i });
    expect(toggle).toBeInTheDocument();
  });
});
