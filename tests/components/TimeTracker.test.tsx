import { render, screen } from '@testing-library/react';
import { TimeTracker } from '../../src/components/TimeTracker';

const noop = () => {};

describe('TimeTracker', () => {
  it('renders setup screen if Supabase is not configured', () => {
    render(<TimeTracker theme="light" toggleTheme={noop} />);
    expect(screen.getByText(/connect supabase to start tracking time/i)).toBeInTheDocument();
  });
});
