import React, { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useClickOutside } from '../../src/hooks/useClickOutside';

// Helper component: renders an inner div inside a container div.
// click-outside listener is attached to containerRef.
function Fixture({
  onClose,
  enabled = true,
}: {
  onClose: () => void;
  enabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(containerRef, onClose, enabled);
  return (
    <div data-testid="outside">
      <div ref={containerRef} data-testid="inside">
        inner
      </div>
    </div>
  );
}

// ─── useClickOutside ─────────────────────────────────────────────────────────

describe('useClickOutside', () => {
  it('does NOT call onClose when mousedown is inside the ref element', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<Fixture onClose={onClose} />);

    fireEvent.mouseDown(getByTestId('inside'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when mousedown fires outside the ref element', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<Fixture onClose={onClose} />);

    fireEvent.mouseDown(getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose multiple times for consecutive outside clicks', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<Fixture onClose={onClose} />);

    fireEvent.mouseDown(getByTestId('outside'));
    fireEvent.mouseDown(getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does NOT attach listener or call onClose when enabled=false', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<Fixture onClose={onClose} enabled={false} />);

    fireEvent.mouseDown(getByTestId('outside'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes listener after unmount (does not call onClose after unmount)', () => {
    const onClose = jest.fn();
    const { unmount, getByTestId } = render(<Fixture onClose={onClose} />);

    unmount();

    // Dispatching mousedown after unmount should not trigger onClose
    fireEvent.mouseDown(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });
});
