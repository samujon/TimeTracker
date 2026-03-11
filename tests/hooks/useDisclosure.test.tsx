import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react';
import { useDisclosure } from '../../src/hooks/useDisclosure';

/**
 * Fixture that renders a toggle button + a conditionally visible panel.
 * Mirrors the typical pattern used in ProjectSelector / TagSelector.
 */
function Fixture() {
    const disclosure = useDisclosure<HTMLDivElement>();
    return (
        <div data-testid="root">
            <div ref={disclosure.ref} data-testid="container">
                <button data-testid="toggle" onClick={disclosure.toggle}>
                    toggle
                </button>
                {disclosure.open && <div data-testid="panel">panel content</div>}
            </div>
            <div data-testid="outside">outside</div>
        </div>
    );
}

// ─── useDisclosure ────────────────────────────────────────────────────────────

describe('useDisclosure', () => {
    it('starts closed by default', () => {
        const { result } = renderHook(() => useDisclosure());
        expect(result.current.open).toBe(false);
    });

    it('toggle() opens when closed', () => {
        const { result } = renderHook(() => useDisclosure());
        act(() => result.current.toggle());
        expect(result.current.open).toBe(true);
    });

    it('toggle() closes when open', () => {
        const { result } = renderHook(() => useDisclosure());
        act(() => result.current.toggle());
        act(() => result.current.toggle());
        expect(result.current.open).toBe(false);
    });

    it('close() sets open to false regardless of current state', () => {
        const { result } = renderHook(() => useDisclosure());
        act(() => result.current.toggle());
        expect(result.current.open).toBe(true);
        act(() => result.current.close());
        expect(result.current.open).toBe(false);
    });

    it('set() can force open to a specific value', () => {
        const { result } = renderHook(() => useDisclosure());
        act(() => result.current.set(true));
        expect(result.current.open).toBe(true);
        act(() => result.current.set(false));
        expect(result.current.open).toBe(false);
    });

    describe('click-outside integration', () => {
        it('panel renders after toggling open', () => {
            render(<Fixture />);
            expect(screen.queryByTestId('panel')).toBeNull();
            fireEvent.click(screen.getByTestId('toggle'));
            expect(screen.getByTestId('panel')).toBeInTheDocument();
        });

        it('closes when mousedown fires outside the ref container', () => {
            render(<Fixture />);
            fireEvent.click(screen.getByTestId('toggle'));
            expect(screen.getByTestId('panel')).toBeInTheDocument();

            fireEvent.mouseDown(screen.getByTestId('outside'));
            expect(screen.queryByTestId('panel')).toBeNull();
        });

        it('stays open when mousedown fires inside the ref container', () => {
            render(<Fixture />);
            fireEvent.click(screen.getByTestId('toggle'));
            fireEvent.mouseDown(screen.getByTestId('container'));
            expect(screen.getByTestId('panel')).toBeInTheDocument();
        });

        it('does not call close when already closed and mousedown fires outside', () => {
            render(<Fixture />);
            // Panel is already hidden — outside click should not error or change state
            fireEvent.mouseDown(screen.getByTestId('outside'));
            expect(screen.queryByTestId('panel')).toBeNull();
        });
    });
});
