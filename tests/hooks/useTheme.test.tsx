import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useTheme } from '../../src/hooks/useTheme';

function ThemeFixture() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

describe('useTheme', () => {
  const matchMediaMock = window.matchMedia as jest.Mock;

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('uses system preference on mount without reading localStorage', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

    render(<ThemeFixture />);

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(getItemSpy).not.toHaveBeenCalled();

    getItemSpy.mockRestore();
  });

  it('toggles theme in memory without writing localStorage', () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

    render(<ThemeFixture />);

    act(() => {
      screen.getByRole('button', { name: 'toggle' }).click();
    });

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(setItemSpy).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
  });

  it('starts in light mode when system preference is light', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<ThemeFixture />);

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
