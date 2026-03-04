import { render, screen } from '@testing-library/react';
import { TimeTracker } from '../../src/components/TimeTracker';

describe('TimeTracker', () => {
  it('renders setup screen if Supabase is not configured', () => {
    render(<TimeTracker />);
    expect(screen.getByText(/connect supabase to start tracking time/i)).toBeInTheDocument();
  });
});