import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../../src/components/useTimer';

describe('useTimer', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.startedAt).toBeNull();
    expect(result.current.elapsedMs).toBe(0);
    expect(typeof result.current.formattedElapsed).toBe('string');
  });

  it('should update elapsedMs when started', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useTimer());
    act(() => {
      result.current.setIsRunning(true);
      result.current.setStartedAt(new Date(Date.now() - 2000));
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(2000);
    jest.useRealTimers();
  });
});