import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = vi.fn();
const mockLogin = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/providers/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    status: 'unauthenticated',
    user: null,
    accessToken: null,
    logout: vi.fn(),
    getAccessToken: vi.fn(),
  }),
}));

import LoginPage from '@/app/(auth)/login/page';

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
  });

  it('has a registration link', () => {
    render(<LoginPage />);
    const link = screen.getByRole('link', { name: /create one/i });
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/register');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    expect(passwordInput.getAttribute('type')).toBe('password');
    await user.click(toggleButton);
    expect(passwordInput.getAttribute('type')).toBe('text');
  });
});
