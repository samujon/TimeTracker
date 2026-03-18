import { render, screen } from '@testing-library/react';
import { TimeTracker } from '../../src/views/TimeTracker';
import { UserContext } from '../../src/context/UserContext';

const noop = () => {};
const noopAsync = async () => {};

// Minimal mock value — TimeTracker renders SetupScreen when Supabase is not
// configured, so no real Supabase calls are made during this test.
const mockUserContext = {
  user: { id: 'test-user-id', email: 'test@example.com' } as never,
  signOut: noopAsync,
};

describe('TimeTracker', () => {
  it('renders setup screen if Supabase is not configured', () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <TimeTracker theme="light" toggleTheme={noop} />
      </UserContext.Provider>
    );
    expect(screen.getByText(/connect supabase to start tracking time/i)).toBeInTheDocument();
  });
});
