import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../../src/hooks/useTimer';

describe('useTimer', () => {
  it('initialises with correct default values', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.startedAt).toBeNull();
    expect(typeof result.current.formattedElapsed).toBe('string');
    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('formats elapsed as "00:00:00" before any start', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.formattedElapsed).toBe('00:00:00');
  });

  it('sets isRunning=true and records startedAt when start() is called', () => {
    const { result } = renderHook(() => useTimer());
    const before = Date.now();
    act(() => { result.current.start(); });
    const after = Date.now();
    expect(result.current.isRunning).toBe(true);
    expect(result.current.startedAt).not.toBeNull();
    expect(result.current.startedAt!.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.current.startedAt!.getTime()).toBeLessThanOrEqual(after);
  });

  it('sets isRunning=false but keeps startedAt when stop() is called', () => {
    const { result } = renderHook(() => useTimer());
    act(() => { result.current.start(); });
    const recordedAt = result.current.startedAt;
    act(() => { result.current.stop(); });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.startedAt).toBe(recordedAt);
  });

  it('resets all state to initial values when reset() is called after start', () => {
    const { result } = renderHook(() => useTimer());
    act(() => { result.current.start(); });
    act(() => { result.current.reset(); });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.startedAt).toBeNull();
    expect(result.current.formattedElapsed).toBe('00:00:00');
  });

  it('formattedElapsed updates when the interval fires (fake timers)', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useTimer());
    act(() => { result.current.start(); });
    // Advance 65 seconds — formatted should reflect >= 1 minute
    act(() => { jest.advanceTimersByTime(65_000); });
    // Should be "00:01:05" (or more if timing is slightly off)
    expect(result.current.formattedElapsed).not.toBe('00:00:00');
    jest.useRealTimers();
  });
});
